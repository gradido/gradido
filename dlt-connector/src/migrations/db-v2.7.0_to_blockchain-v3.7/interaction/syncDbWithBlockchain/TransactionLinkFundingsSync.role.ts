import { asc, eq, or, gt, and } from 'drizzle-orm'
import { 
  AccountBalance,
  AccountBalances, 
  AuthenticatedEncryption, 
  DurationSeconds, 
  EncryptedMemo, 
  GradidoTransactionBuilder, 
  GradidoTransfer, 
  GradidoUnit, 
  KeyPairEd25519, 
  LedgerAnchor, 
  MemoryBlockPtr, 
  TransferAmount 
} from 'gradido-blockchain-js'
import * as v from 'valibot'
import { addToBlockchain } from '../../blockchain'
import { transactionLinksTable, usersTable } from '../../drizzle.schema'
import { BlockchainError, DatabaseError, NegativeBalanceError } from '../../errors'
import { CommunityContext, TransactionLinkDb, transactionLinkDbSchema } from '../../valibot.schema'
import { AbstractSyncRole, IndexType } from './AbstractSync.role'
import { deriveFromCode } from '../../../../data/deriveKeyPair'
import { reverseLegacyDecay, toMysqlDateTime } from '../../utils'
import Decimal from 'decimal.js-light'
import { Context } from '../../Context'

export class TransactionLinkFundingsSyncRole extends AbstractSyncRole<TransactionLinkDb> {
  constructor(context: Context) {
    super(context)
    this.accountBalances.reserve(2)
  }
  getDate(): Date {
    return this.peek().createdAt
  }

  getLastIndex(): IndexType {
    const lastItem = this.peekLast()
    return { date: lastItem.createdAt, id: lastItem.id }
  }

  itemTypeName(): string {
    return 'transactionLinkFundings'
  }

  async loadFromDb(lastIndex: IndexType, count: number): Promise<TransactionLinkDb[]> {
    const result = await this.context.db
      .select()
      .from(transactionLinksTable)
      .innerJoin(usersTable, eq(transactionLinksTable.userId, usersTable.id))
      .where(or(
        gt(transactionLinksTable.createdAt, toMysqlDateTime(lastIndex.date)),
        and(
          eq(transactionLinksTable.createdAt, toMysqlDateTime(lastIndex.date)), 
          gt(transactionLinksTable.id, lastIndex.id)
        )      
      ))
      .orderBy(asc(transactionLinksTable.createdAt), asc(transactionLinksTable.id))
      .limit(count)
    
    return result.map((row) => {
      const item = {
        ...row.transaction_links,
        user: row.users,
      }
      try {
        return v.parse(transactionLinkDbSchema, item)
      } catch (e) {
        throw new DatabaseError('loadTransactionLinkFundings', item, e as Error)
      }
    })
  }

  buildTransaction(
    communityContext: CommunityContext,
    item: TransactionLinkDb, 
    blockedAmount: GradidoUnit,
    duration: DurationSeconds,
    senderKeyPair: KeyPairEd25519,
    recipientKeyPair: KeyPairEd25519,       
  ): GradidoTransactionBuilder {
    return this.transactionBuilder
      .setCreatedAt(item.createdAt)
      .addMemo(
        new EncryptedMemo(
          item.memo,
          new AuthenticatedEncryption(senderKeyPair),
          new AuthenticatedEncryption(recipientKeyPair),
        ),
      )
      .setSenderCommunity(communityContext.communityId)
      .setDeferredTransfer(
        new GradidoTransfer(
          new TransferAmount(senderKeyPair.getPublicKey(), blockedAmount, communityContext.communityId),
          recipientKeyPair.getPublicKey(),
        ),
        duration,
      )      
      .sign(senderKeyPair)
  }

  calculateBalances(
      item: TransactionLinkDb, 
      blockedAmount: GradidoUnit,
      communityContext: CommunityContext,
      senderPublicKey: MemoryBlockPtr,
      recipientPublicKey: MemoryBlockPtr,
    ): AccountBalances {
      this.accountBalances.clear()
      let senderLastBalance = this.getLastBalanceForUser(senderPublicKey, communityContext.blockchain, communityContext.communityId)
      try {
       senderLastBalance.updateLegacyDecay(blockedAmount.negated(), item.createdAt)
       } catch(e) {
        if (e instanceof NegativeBalanceError) {
          this.logLastBalanceChangingTransactions(senderPublicKey, communityContext.blockchain)
          this.context.logger.debug(`sender public key: ${senderPublicKey.convertToHex()}`)
          throw e
        }
      }
           
      this.accountBalances.add(senderLastBalance.getAccountBalance())
      this.accountBalances.add(new AccountBalance(recipientPublicKey, blockedAmount, communityContext.communityId))
      return this.accountBalances
    }

  pushToBlockchain(item: TransactionLinkDb): void {
    const communityContext = this.context.getCommunityContextByUuid(item.user.communityUuid)
    const blockchain = communityContext.blockchain
        
    const senderKeyPair = this.getAccountKeyPair(communityContext, item.user.gradidoId)
    const senderPublicKey = senderKeyPair.getPublicKey()
    const recipientKeyPair = deriveFromCode(item.code)
    const recipientPublicKey = recipientKeyPair.getPublicKey()
    
    if (!senderKeyPair || !senderPublicKey || !recipientKeyPair || !recipientPublicKey) {
      throw new Error(`missing key for ${this.itemTypeName()}: ${JSON.stringify(item, null, 2)}`)
    }
    let duration = new DurationSeconds((item.validUntil.getTime() - item.createdAt.getTime()) / 1000)
    let blockedAmount = GradidoUnit.fromString(reverseLegacyDecay(new Decimal(item.amount.toString()), duration.getSeconds()).toString())
    let accountBalances: AccountBalances
    try {
      accountBalances = this.calculateBalances(item, blockedAmount, communityContext, senderPublicKey, recipientPublicKey)
    } catch(e) {
      if (item.deletedAt && e instanceof NegativeBalanceError) {
        const senderLastBalance = this.getLastBalanceForUser(senderPublicKey, communityContext.blockchain, communityContext.communityId)
        senderLastBalance.updateLegacyDecay(GradidoUnit.zero(), item.createdAt)
        const oldBlockedAmountString = blockedAmount.toString()
        blockedAmount = senderLastBalance.getBalance()
        accountBalances = this.calculateBalances(item, blockedAmount, communityContext, senderPublicKey, recipientPublicKey)
        this.context.logger.warn(
          `workaround: fix founding for deleted link, reduce funding to actual sender balance: ${senderPublicKey.convertToHex()}: from ${oldBlockedAmountString} GDD to ${blockedAmount.toString()} GDD`
        )
      } else {
        this.context.logger.error(`error calculate account balances for ${this.itemTypeName()}: ${JSON.stringify(item, null, 2)}`)
        throw e
      }
    }
    try {
      addToBlockchain(
        this.buildTransaction(communityContext, item, blockedAmount, duration, senderKeyPair, recipientKeyPair).build(),
        blockchain,
        new LedgerAnchor(item.id, LedgerAnchor.Type_LEGACY_GRADIDO_DB_TRANSACTION_LINK_ID),
        accountBalances,
      )
    } catch(e) {
      if (e instanceof NegativeBalanceError) {
        if (!item.deletedAt && !item.redeemedAt && item.validUntil.getTime() < new Date().getTime()) {
          this.context.logger.warn(`TransactionLinks: ${item.id} skipped, because else it lead to negative balance error, but it wasn't used.`)
          return
        }
      }
      throw new BlockchainError(`Error adding ${this.itemTypeName()}`, item, e as Error)
    }
  }
}
