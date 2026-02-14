import { alias } from 'drizzle-orm/mysql-core'
import { transactionsTable, usersTable } from '../../drizzle.schema'
import { AbstractSyncRole, IndexType } from './AbstractSync.role'
import { CommunityContext, TransactionDb, transactionDbSchema, UserDb } from '../../valibot.schema'
import * as v from 'valibot'
import { toMysqlDateTime } from '../../utils'
import { TransactionTypeId } from '../../data/TransactionTypeId'
import { DatabaseError, NegativeBalanceError } from '../../errors'
import { asc, and, eq, gt, ne, or, inArray, isNull } from 'drizzle-orm'
import { NotEnoughGradidoBalanceError } from '../../errors'
import { BlockchainError } from '../../errors'
import { addToBlockchain } from '../../blockchain'
import { AccountBalance, AccountBalances, AuthenticatedEncryption, EncryptedMemo, GradidoTransactionBuilder, GradidoUnit, KeyPairEd25519, LedgerAnchor, MemoryBlockPtr, TransferAmount } from 'gradido-blockchain-js'
import { Decimal } from 'decimal.js'
import { Context } from '../../Context'

export class RemoteTransactionsSyncRole extends AbstractSyncRole<TransactionDb> {
  constructor(context: Context) {
    super(context)
    this.accountBalances.reserve(1)
  }
  
  getDate(): Date {
    return this.peek().balanceDate
  }

  getLastIndex(): IndexType {
    const lastItem = this.peekLast()
    return { date: lastItem.balanceDate, id: lastItem.id }
  }

  itemTypeName(): string {
    return 'remoteTransactions'
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
          inArray(transactionsTable.typeId, [TransactionTypeId.RECEIVE, TransactionTypeId.SEND]),
          isNull(transactionsTable.transactionLinkId),
          ne(usersTable.communityUuid, linkedUsers.communityUuid),
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
      .innerJoin(linkedUsers, eq(transactionsTable.linkedUserGradidoId, linkedUsers.gradidoId))
      .orderBy(asc(transactionsTable.balanceDate), asc(transactionsTable.id))
      .limit(count)
  
    return result.map((row) => {
      const item = {
          ...row.transaction,
          user: row.user,
          linkedUser: row.linkedUser,
        }
      if (item.typeId === TransactionTypeId.SEND && item.amount) {
        item.amount = new Decimal(item.amount).neg().toString()
      }
      try {
        return v.parse(transactionDbSchema, item)
      } catch (e) {
        throw new DatabaseError('loadRemoteTransferTransactions', item, e as Error)
      }
    })    
  }

  buildTransaction(
      item: TransactionDb, 
      senderKeyPair: KeyPairEd25519,
      recipientKeyPair: KeyPairEd25519,       
      senderCommunityId: string,
      recipientCommunityId: string,
    ): GradidoTransactionBuilder {
      return this.transactionBuilder
        .setCreatedAt(item.balanceDate)
        .addMemo(new EncryptedMemo(
            item.memo,
            new AuthenticatedEncryption(senderKeyPair),
            new AuthenticatedEncryption(recipientKeyPair),
          ),
        )
        .setSenderCommunity(senderCommunityId)
        .setRecipientCommunity(recipientCommunityId)
        .setTransactionTransfer(
          new TransferAmount(senderKeyPair.getPublicKey(), item.amount, senderCommunityId),
          recipientKeyPair.getPublicKey(),
        )        
        .sign(senderKeyPair)
  }

  calculateBalances(
      item: TransactionDb, 
      communityContext: CommunityContext,
      amount: GradidoUnit,
      publicKey: MemoryBlockPtr,
    ): AccountBalances {
      this.accountBalances.clear()
      if (communityContext.foreign) {
        this.accountBalances.add(new AccountBalance(publicKey, GradidoUnit.zero(), communityContext.communityId))
        return this.accountBalances
      } else {
        const lastBalance = this.getLastBalanceForUser(publicKey, communityContext.blockchain, communityContext.communityId)
    
        try {
          lastBalance.updateLegacyDecay(amount, item.balanceDate)
        } catch(e) {
          if (e instanceof NegativeBalanceError) {
            this.logLastBalanceChangingTransactions(publicKey, communityContext.blockchain, 10)
            throw e
          }
        }
        this.accountBalances.add(lastBalance.getAccountBalance())
        return this.accountBalances
      }
  }

  getUser(item: TransactionDb): { senderUser: UserDb, recipientUser: UserDb } {
    return (
      item.typeId === TransactionTypeId.RECEIVE 
        ? { senderUser: item.linkedUser, recipientUser: item.user } 
        : { senderUser: item.user, recipientUser: item.linkedUser }
    )
  }

  pushToBlockchain(item: TransactionDb): void {
    const { senderUser, recipientUser } = this.getUser(item)
    const ledgerAnchor = new LedgerAnchor(item.id, LedgerAnchor.Type_LEGACY_GRADIDO_DB_TRANSACTION_ID)

    if (senderUser.communityUuid === recipientUser.communityUuid) {
      throw new Error(`transfer between user from same community: ${JSON.stringify(item, null, 2)}, check db query`)
    }
    const senderCommunityContext = this.context.getCommunityContextByUuid(senderUser.communityUuid)
    const recipientCommunityContext = this.context.getCommunityContextByUuid(recipientUser.communityUuid)
    const senderBlockchain = senderCommunityContext.blockchain
    const recipientBlockchain = recipientCommunityContext.blockchain
    
    // I use the received transaction so user and linked user are swapped and user is recipient and linkedUser ist sender
    const senderKeyPair = this.getAccountKeyPair(senderCommunityContext, senderUser.gradidoId)
    const senderPublicKey = senderKeyPair.getPublicKey()
    const recipientKeyPair = this.getAccountKeyPair(recipientCommunityContext, recipientUser.gradidoId)
    const recipientPublicKey = recipientKeyPair.getPublicKey()
    
    if (!senderKeyPair || !senderPublicKey || !recipientKeyPair || !recipientPublicKey) {
      throw new Error(`missing key for ${this.itemTypeName()}: ${JSON.stringify(item, null, 2)}`)
    }
    const transactionBuilder = this.buildTransaction(
      item, 
      senderKeyPair, 
      recipientKeyPair, 
      senderCommunityContext.communityId, 
      recipientCommunityContext.communityId
    )
    const outboundTransaction = transactionBuilder.buildOutbound()

    try {
      addToBlockchain(
        outboundTransaction,
        senderBlockchain,
        ledgerAnchor,
        this.calculateBalances(item, senderCommunityContext, item.amount.negated(), senderPublicKey),
      )
    } catch(e) {
      if (e instanceof NotEnoughGradidoBalanceError) {
        this.logLastBalanceChangingTransactions(senderPublicKey, senderBlockchain)        
      }
      throw new BlockchainError(`Error adding ${this.itemTypeName()}`, item, e as Error)
    }
    transactionBuilder.setParentLedgerAnchor(ledgerAnchor)
    const inboundTransaction = transactionBuilder.buildInbound()
    try {
      addToBlockchain(
        inboundTransaction,
        recipientBlockchain,
        ledgerAnchor,
        this.calculateBalances(item, recipientCommunityContext, item.amount, recipientPublicKey),
      )
    } catch(e) {
      if (e instanceof NotEnoughGradidoBalanceError) {
        this.logLastBalanceChangingTransactions(recipientPublicKey, recipientBlockchain)        
      }
      throw new BlockchainError(`Error adding ${this.itemTypeName()}`, item, e as Error)
    }
  }
}
