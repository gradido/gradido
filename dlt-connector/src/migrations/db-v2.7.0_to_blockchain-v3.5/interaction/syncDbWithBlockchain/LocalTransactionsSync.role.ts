import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'
import { 
  AccountBalances, 
  AuthenticatedEncryption, 
  EncryptedMemo, 
  Filter, 
  GradidoTransactionBuilder, 
  KeyPairEd25519, 
  MemoryBlockPtr, 
  SearchDirection_DESC, 
  TransferAmount 
} from 'gradido-blockchain-js'
import * as v from 'valibot'
import { addToBlockchain } from '../../blockchain'
import { TransactionTypeId } from '../../data/TransactionTypeId'
import { transactionsTable, usersTable } from '../../drizzle.schema'
import { BlockchainError, DatabaseError } from '../../errors'
import { CommunityContext, TransactionDb, transactionDbSchema } from '../../valibot.schema'
import { AbstractSyncRole } from './AbstractSync.role'

export class LocalTransactionsSyncRole extends AbstractSyncRole<TransactionDb> {
  
  getDate(): Date {
    return this.peek().balanceDate
  }

  itemTypeName(): string {
    return 'localTransactions'
  }

  async loadFromDb(offset: number, count: number): Promise<TransactionDb[]> {
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
        )
      )
      .innerJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
      .innerJoin(linkedUsers, eq(transactionsTable.linkedUserId, linkedUsers.id))
      .orderBy(asc(transactionsTable.balanceDate), asc(transactionsTable.id))
      .limit(count)
      .offset(offset)
  
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
        .addMemo(
          new EncryptedMemo(
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

    if (senderLastBalance.getAccountBalance().getBalance().lt(item.amount)) {
      const f = new Filter()
      f.updatedBalancePublicKey = senderPublicKey
      f.searchDirection = SearchDirection_DESC
      f.pagination.size = 5
      const lastTransactions = communityContext.blockchain.findAll(f)
      for (let i = lastTransactions.size() - 1; i >= 0; i--) {
        const tx = lastTransactions.get(i)
        this.context.logger.error(`${tx?.getConfirmedTransaction()!.toJson(true)}`)
      }
      throw new Error(`sender has not enough balance (${senderLastBalance.getAccountBalance().getBalance().toString()}) to send ${item.amount.toString()} to ${recipientPublicKey.convertToHex()}`)
    }

    senderLastBalance.updateLegacyDecay(item.amount.negated(), item.balanceDate)
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
        item.id,
        this.calculateBalances(item, communityContext, senderPublicKey, recipientPublicKey),
      )
    } catch(e) {
      throw new BlockchainError(`Error adding ${this.itemTypeName()}`, item, e as Error)
    }
  }
}
