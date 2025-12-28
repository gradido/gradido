import { asc, eq } from 'drizzle-orm'
import { 
  AccountBalance,
  AccountBalances, 
  AuthenticatedEncryption, 
  DurationSeconds, 
  EncryptedMemo, 
  Filter, 
  GradidoTransactionBuilder, 
  GradidoTransfer, 
  GradidoUnit, 
  KeyPairEd25519, 
  MemoryBlockPtr, 
  SearchDirection_DESC, 
  TransferAmount 
} from 'gradido-blockchain-js'
import * as v from 'valibot'
import { addToBlockchain } from '../../blockchain'
import { transactionLinksTable, usersTable } from '../../drizzle.schema'
import { BlockchainError, DatabaseError, NegativeBalanceError } from '../../errors'
import { CommunityContext, TransactionLinkDb, transactionLinkDbSchema } from '../../valibot.schema'
import { AbstractSyncRole } from './AbstractSync.role'
import { deriveFromCode } from '../../../../data/deriveKeyPair'
import { legacyCalculateDecay } from '../../utils'
import Decimal from 'decimal.js-light'

export class TransactionLinkFundingsSyncRole extends AbstractSyncRole<TransactionLinkDb> {
  getDate(): Date {
    return this.peek().createdAt
  }

  itemTypeName(): string {
    return 'transactionLinkFundings'
  }

  async loadFromDb(offset: number, count: number): Promise<TransactionLinkDb[]> {
    const result = await this.context.db
      .select()
      .from(transactionLinksTable)
      .innerJoin(usersTable, eq(transactionLinksTable.userId, usersTable.id))
      .orderBy(asc(transactionLinksTable.createdAt), asc(transactionLinksTable.id))
      .limit(count)
      .offset(offset)
  
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
    item: TransactionLinkDb, 
    blockedAmount: GradidoUnit,
    duration: DurationSeconds,
    senderKeyPair: KeyPairEd25519,
    recipientKeyPair: KeyPairEd25519,       
  ): GradidoTransactionBuilder {
    return new GradidoTransactionBuilder()
      .setCreatedAt(item.createdAt)
      .addMemo(
        new EncryptedMemo(
          item.memo,
          new AuthenticatedEncryption(senderKeyPair),
          new AuthenticatedEncryption(recipientKeyPair),
        ),
      )
      .setDeferredTransfer(
        new GradidoTransfer(
          new TransferAmount(senderKeyPair.getPublicKey(), blockedAmount),
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
      const accountBalances = new AccountBalances()
      let senderLastBalance = this.getLastBalanceForUser(senderPublicKey, communityContext.blockchain)
      senderLastBalance.updateLegacyDecay(blockedAmount.negated(), item.createdAt)
           
      accountBalances.add(senderLastBalance.getAccountBalance())
      accountBalances.add(new AccountBalance(recipientPublicKey, blockedAmount, ''))
      return accountBalances
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

    const duration = new DurationSeconds((item.validUntil.getTime() - item.createdAt.getTime()) / 1000)
    let blockedAmount = item.amount.calculateCompoundInterest(duration.getSeconds())
    let accountBalances: AccountBalances
    try {
      accountBalances = this.calculateBalances(item, blockedAmount, communityContext, senderPublicKey, recipientPublicKey)
    } catch(e) {
      if (item.deletedAt && e instanceof NegativeBalanceError) {
        const senderLastBalance = this.getLastBalanceForUser(senderPublicKey, communityContext.blockchain)
        senderLastBalance.updateLegacyDecay(GradidoUnit.zero(), item.createdAt)
        blockedAmount = senderLastBalance.getBalance()
        accountBalances = this.calculateBalances(item, blockedAmount, communityContext, senderPublicKey, recipientPublicKey)
      } else {
        throw e
      }
    }
    /*
    const decayedAmount = GradidoUnit.fromString(legacyCalculateDecay(new Decimal(item.amount.toString()), item.createdAt, item.validUntil).toString())
    const blockedAmount = item.amount.add(item.amount.minus(decayedAmount))
    */

    try {
      addToBlockchain(
        this.buildTransaction(item, blockedAmount, duration, senderKeyPair, recipientKeyPair),
        blockchain,
        item.id,
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
