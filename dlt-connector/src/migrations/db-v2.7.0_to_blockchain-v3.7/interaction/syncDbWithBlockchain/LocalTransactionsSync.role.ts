import { and, asc, eq, isNotNull, isNull, gt, or } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'
import { 
  AccountBalances, 
  AuthenticatedEncryption, 
  EncryptedMemo, 
  Filter, 
  GradidoTransactionBuilder, 
  KeyPairEd25519, 
  LedgerAnchor, 
  MemoryBlockPtr, 
  SearchDirection_DESC, 
  TransferAmount 
} from 'gradido-blockchain-js'
import * as v from 'valibot'
import { addToBlockchain } from '../../blockchain'
import { TransactionTypeId } from '../../data/TransactionTypeId'
import { transactionsTable, usersTable } from '../../drizzle.schema'
import { BlockchainError, DatabaseError, NegativeBalanceError, NotEnoughGradidoBalanceError } from '../../errors'
import { CommunityContext, TransactionDb, transactionDbSchema } from '../../valibot.schema'
import { AbstractSyncRole, IndexType } from './AbstractSync.role'
import { toMysqlDateTime } from '../../utils'

export class LocalTransactionsSyncRole extends AbstractSyncRole<TransactionDb> {
  
  getDate(): Date {
    return this.peek().balanceDate
  }

  getLastIndex(): IndexType {
    const lastItem = this.peekLast()
    return { date: lastItem.balanceDate, id: lastItem.id }
  }

  itemTypeName(): string {
    return 'localTransactions'
  }

  async loadFromDb(lastIndex: IndexType, count: number): Promise<TransactionDb[]> {
    const linkedUsers = alias(usersTable, 'linkedUser')
    const result = await this.context.db
      .select({
        transaction: transactionsTable,
        user: usersTable,
        linkedUser: linkedUsers,
      })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.typeId, TransactionTypeId.RECEIVE),
          isNull(transactionsTable.transactionLinkId),
          isNotNull(transactionsTable.linkedUserId),
          eq(usersTable.foreign, 0),
          eq(linkedUsers.foreign, 0),
          or(
            gt(transactionsTable.balanceDate, toMysqlDateTime(lastIndex.date)),
            and(
              eq(transactionsTable.balanceDate, toMysqlDateTime(lastIndex.date)), 
              gt(transactionsTable.id, lastIndex.id)
            )
          )
        )
      )
      .innerJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
      .innerJoin(linkedUsers, eq(transactionsTable.linkedUserId, linkedUsers.id))
      .orderBy(asc(transactionsTable.balanceDate), asc(transactionsTable.id))
      .limit(count)
  
    return result.map((row) => {
      const item = {
          ...row.transaction,
          user: row.user,
          linkedUser: row.linkedUser,
        }
      try {
        return v.parse(transactionDbSchema, item)
      } catch (e) {
        throw new DatabaseError('loadLocalTransferTransactions', item, e as Error)
      }
    })    
  }

  buildTransaction(
      item: TransactionDb, 
      senderKeyPair: KeyPairEd25519,
      recipientKeyPair: KeyPairEd25519,       
    ): GradidoTransactionBuilder {
      return new GradidoTransactionBuilder()
        .setCreatedAt(item.balanceDate)
        .addMemo(new EncryptedMemo(
            item.memo,
            new AuthenticatedEncryption(senderKeyPair),
            new AuthenticatedEncryption(recipientKeyPair),
          ),
        )
        .setTransactionTransfer(
          new TransferAmount(senderKeyPair.getPublicKey(), item.amount),
          recipientKeyPair.getPublicKey(),
        )
        .sign(senderKeyPair)
  }

  calculateBalances(
    item: TransactionDb, 
    communityContext: CommunityContext,
    senderPublicKey: MemoryBlockPtr,
    recipientPublicKey: MemoryBlockPtr,
  ): AccountBalances {
    const accountBalances = new AccountBalances()
    
    const senderLastBalance = this.getLastBalanceForUser(senderPublicKey, communityContext.blockchain)
    const recipientLastBalance = this.getLastBalanceForUser(recipientPublicKey, communityContext.blockchain)

    try {
      senderLastBalance.updateLegacyDecay(item.amount.negated(), item.balanceDate)
    } catch(e) {
      if (e instanceof NegativeBalanceError) {
        this.logLastBalanceChangingTransactions(senderPublicKey, communityContext.blockchain)
        throw e
      }
    }
    recipientLastBalance.updateLegacyDecay(item.amount, item.balanceDate)
    
    accountBalances.add(senderLastBalance.getAccountBalance())
    accountBalances.add(recipientLastBalance.getAccountBalance())
    return accountBalances
  }

  pushToBlockchain(item: TransactionDb): void {
    const communityContext = this.context.getCommunityContextByUuid(item.user.communityUuid)
    const blockchain = communityContext.blockchain
    if (item.linkedUser.communityUuid !== item.user.communityUuid) {
      throw new Error(`transfer between user from different communities: ${JSON.stringify(item, null, 2)}`)
    }
    
    // I use the received transaction so user and linked user are swapped and user is recipient and linkedUser ist sender
    const senderKeyPair = this.getAccountKeyPair(communityContext, item.linkedUser.gradidoId)
    const senderPublicKey = senderKeyPair.getPublicKey()
    const recipientKeyPair = this.getAccountKeyPair(communityContext, item.user.gradidoId)
    const recipientPublicKey = recipientKeyPair.getPublicKey()
    
    if (!senderKeyPair || !senderPublicKey || !recipientKeyPair || !recipientPublicKey) {
      throw new Error(`missing key for ${this.itemTypeName()}: ${JSON.stringify(item, null, 2)}`)
    }

    try {
      addToBlockchain(
        this.buildTransaction(item, senderKeyPair, recipientKeyPair),
        blockchain,
        new LedgerAnchor(item.id, LedgerAnchor.Type_LEGACY_GRADIDO_DB_TRANSACTION_ID),
        this.calculateBalances(item, communityContext, senderPublicKey, recipientPublicKey),
      )
    } catch(e) {
      if (e instanceof NotEnoughGradidoBalanceError) {
        this.logLastBalanceChangingTransactions(senderPublicKey, blockchain)        
      }
      throw new BlockchainError(`Error adding ${this.itemTypeName()}`, item, e as Error)
    }
  }
}
