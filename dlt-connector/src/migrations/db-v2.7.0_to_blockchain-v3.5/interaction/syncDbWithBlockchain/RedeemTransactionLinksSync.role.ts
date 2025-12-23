import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm'
import { 
  AccountBalance,
  AccountBalances, 
  AuthenticatedEncryption, 
  EncryptedMemo, 
  Filter,
  GradidoDeferredTransfer,
  GradidoTransactionBuilder, 
  GradidoTransfer, 
  GradidoUnit, 
  KeyPairEd25519, 
  MemoryBlockPtr, 
  TransferAmount 
} from 'gradido-blockchain-js'
import * as v from 'valibot'
import { addToBlockchain } from '../../blockchain'
import { transactionLinksTable, usersTable } from '../../drizzle.schema'
import { BlockchainError, DatabaseError } from '../../errors'
import { CommunityContext, RedeemedTransactionLinkDb, redeemedTransactionLinkDbSchema } from '../../valibot.schema'
import { AbstractSyncRole } from './AbstractSync.role'
import { deriveFromCode } from '../../../../data/deriveKeyPair'
import { alias } from 'drizzle-orm/mysql-core'

export class RedeemTransactionLinksSyncRole extends AbstractSyncRole<RedeemedTransactionLinkDb> {  
  getDate(): Date {
    return this.peek().redeemedAt
  }

  itemTypeName(): string {
    return 'redeemTransactionLinks'
  }

  async loadFromDb(offset: number, count: number): Promise<RedeemedTransactionLinkDb[]> {
    const redeemedByUser = alias(usersTable, 'redeemedByUser')
    const result = await this.context.db
      .select({
        transactionLink: transactionLinksTable,
        user: usersTable,
        redeemedBy: redeemedByUser,
      })
      .from(transactionLinksTable)
      .where(
        and(
          isNull(transactionLinksTable.deletedAt),
          isNotNull(transactionLinksTable.redeemedAt),
          eq(usersTable.foreign, 0),
          eq(redeemedByUser.foreign, 0)
        )
      )
      .innerJoin(usersTable, eq(transactionLinksTable.userId, usersTable.id))
      .innerJoin(redeemedByUser, eq(transactionLinksTable.redeemedBy, redeemedByUser.id))
      .orderBy(asc(transactionLinksTable.redeemedAt), asc(transactionLinksTable.id))
      .limit(count)
      .offset(offset)
  
    return result.map((row) => {
      const item = {
        ...row.transactionLink,
        redeemedBy: row.redeemedBy,
        user: row.user,
      }
      try {
        return v.parse(redeemedTransactionLinkDbSchema, item)
      } catch (e) {
        throw new DatabaseError('loadRedeemTransactionLinks', item, e as Error)
      }
    })
  }

  buildTransaction(
      item: RedeemedTransactionLinkDb, 
      linkFundingTransactionNr: number,
      senderKeyPair: KeyPairEd25519,
      recipientKeyPair: KeyPairEd25519,       
    ): GradidoTransactionBuilder {
      return new GradidoTransactionBuilder()
        .setCreatedAt(item.redeemedAt)
        .addMemo(
          new EncryptedMemo(
            item.memo,
            new AuthenticatedEncryption(senderKeyPair),
            new AuthenticatedEncryption(recipientKeyPair),
          ),
        )
        .setRedeemDeferredTransfer(
          linkFundingTransactionNr,
          new GradidoTransfer(
            new TransferAmount(senderKeyPair.getPublicKey(), item.amount),
            recipientKeyPair.getPublicKey(),
          ),
        )
        .sign(senderKeyPair)
  }

  calculateBalances(
    item: RedeemedTransactionLinkDb, 
    fundingTransaction: GradidoDeferredTransfer,
    communityContext: CommunityContext,
    senderPublicKey: MemoryBlockPtr,
    recipientPublicKey: MemoryBlockPtr,
  ): AccountBalances {
    const accountBalances = new AccountBalances()
    
    const senderLastBalance = this.getLastBalanceForUser(senderPublicKey, communityContext.blockchain)
    const fundingUserLastBalance = this.getLastBalanceForUser(fundingTransaction.getSenderPublicKey()!, communityContext.blockchain)
    const recipientLastBalance = this.getLastBalanceForUser(recipientPublicKey, communityContext.blockchain)

    if (senderLastBalance.getAccountBalance().getBalance().lt(item.amount)) {
      throw new Error(`sender has not enough balance (${senderLastBalance.getAccountBalance().getBalance().toString()}) to send ${item.amount.toString()} to ${recipientPublicKey.convertToHex()}`)
    }
    senderLastBalance.updateLegacyDecay(item.amount.negated(), item.redeemedAt)
    fundingUserLastBalance.updateLegacyDecay(senderLastBalance.getBalance(), item.redeemedAt)
    recipientLastBalance.updateLegacyDecay(item.amount, item.redeemedAt)
    
    // account of link is set to zero, and change send back to link creator
    accountBalances.add(new AccountBalance(senderPublicKey, GradidoUnit.zero(), ''))
    accountBalances.add(recipientLastBalance.getAccountBalance())
    accountBalances.add(fundingUserLastBalance.getAccountBalance())
    return accountBalances
  }

  pushToBlockchain(item: RedeemedTransactionLinkDb): void {
    const communityContext = this.context.getCommunityContextByUuid(item.user.communityUuid)
    const blockchain = communityContext.blockchain

    const senderKeyPair = deriveFromCode(item.code)
    const senderPublicKey = senderKeyPair.getPublicKey()
    const recipientKeyPair = this.getAccountKeyPair(communityContext, item.redeemedBy.gradidoId)
    const recipientPublicKey = recipientKeyPair.getPublicKey()

    if (!senderKeyPair || !senderPublicKey || !recipientKeyPair || !recipientPublicKey) {
      throw new Error(`missing key for ${this.itemTypeName()}: ${JSON.stringify(item, null, 2)}`)
    }
    
    const transaction = blockchain.findOne(Filter.lastBalanceFor(senderPublicKey))
    if (!transaction) {
      throw new Error(`expect transaction for code: ${item.code}`)
    }
    // should be funding transaction
    if (!transaction.isDeferredTransfer()) {
      throw new Error(`expect funding transaction: ${transaction.getConfirmedTransaction()?.toJson(true)}`)
    }
    const body = transaction.getConfirmedTransaction()?.getGradidoTransaction()?.getTransactionBody();
    const deferredTransfer = body?.getDeferredTransfer()
    if (!deferredTransfer || !deferredTransfer.getRecipientPublicKey()?.equal(senderPublicKey)) {
      throw new Error(`expect funding transaction to belong to code: ${item.code}: ${transaction.getConfirmedTransaction()?.toJson(true)}`)
    }

    try {
      addToBlockchain(
        this.buildTransaction(item, transaction.getTransactionNr(), senderKeyPair, recipientKeyPair),
        blockchain,
        item.id,
        this.calculateBalances(item, deferredTransfer, communityContext, senderPublicKey, recipientPublicKey),
      )
    } catch(e) {
      throw new BlockchainError(`Error adding ${this.itemTypeName()}`, item, e as Error)
    }
  }
}
