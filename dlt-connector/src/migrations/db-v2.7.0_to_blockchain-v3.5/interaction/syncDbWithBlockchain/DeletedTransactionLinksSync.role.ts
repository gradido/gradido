import { CommunityContext, DeletedTransactionLinkDb, deletedTransactionLinKDbSchema } from '../../valibot.schema'
import { AbstractSyncRole } from './AbstractSync.role'
import { transactionLinksTable, usersTable } from '../../drizzle.schema'
import { and, lt, asc, isNotNull, eq } from 'drizzle-orm'
import * as v from 'valibot'
import { 
  AccountBalance, 
  AccountBalances, 
  Filter, 
  GradidoDeferredTransfer, 
  GradidoTransactionBuilder,
  GradidoTransfer, 
  GradidoUnit, 
  KeyPairEd25519, 
  MemoryBlockPtr,
  TransferAmount
} from 'gradido-blockchain-js'
import { deriveFromCode } from '../../../../data/deriveKeyPair'
import { addToBlockchain } from '../../blockchain'
import { BlockchainError, DatabaseError } from '../../errors'
import { Balance } from '../../data/Balance'

export class DeletedTransactionLinksSyncRole extends AbstractSyncRole<DeletedTransactionLinkDb> {
  getDate(): Date {
    return this.peek().deletedAt
  }

  itemTypeName(): string {
    return 'deletedTransactionLinks'
  }

  async loadFromDb(offset: number, count: number): Promise<DeletedTransactionLinkDb[]> {
    const result = await this.context.db
      .select({
        transactionLink: transactionLinksTable,
        user: usersTable,
      })
      .from(transactionLinksTable)
      .where(
        and(
          isNotNull(transactionLinksTable.deletedAt),
          lt(transactionLinksTable.deletedAt, transactionLinksTable.validUntil)
        )
      )
      .innerJoin(usersTable, eq(transactionLinksTable.userId, usersTable.id))
      .orderBy(asc(transactionLinksTable.deletedAt), asc(transactionLinksTable.id))
      .limit(count)
      .offset(offset)
  
    return result.map((row) => {
      const item = {
        ...row.transactionLink,
        user: row.user,
      }
      try {
        return v.parse(deletedTransactionLinKDbSchema, item)
      } catch (e) {
        throw new DatabaseError('loadDeletedTransactionLinks', item, e as Error)
      }
    })
  }

  buildTransaction(
      item: DeletedTransactionLinkDb, 
      linkFundingTransactionNr: number,
      restAmount: GradidoUnit,
      senderKeyPair: KeyPairEd25519,
      linkFundingPublicKey: MemoryBlockPtr,       
    ): GradidoTransactionBuilder {
      return new GradidoTransactionBuilder()
        .setCreatedAt(item.deletedAt)
        .setRedeemDeferredTransfer(
          linkFundingTransactionNr,
          new GradidoTransfer(
            new TransferAmount(senderKeyPair.getPublicKey(), restAmount),
            linkFundingPublicKey,
          ),
        )
        .sign(senderKeyPair)
  }

  calculateBalances(
    item: DeletedTransactionLinkDb, 
    fundingTransaction: GradidoDeferredTransfer,
    senderLastBalance: Balance,
    communityContext: CommunityContext,
    senderPublicKey: MemoryBlockPtr,
  ): AccountBalances {
    const accountBalances = new AccountBalances()
    
    const fundingUserLastBalance = this.getLastBalanceForUser(fundingTransaction.getSenderPublicKey()!, communityContext.blockchain)
    fundingUserLastBalance.updateLegacyDecay(senderLastBalance.getBalance(), item.deletedAt)
    
    // account of link is set to zero, gdd will be send back to initiator
    accountBalances.add(new AccountBalance(senderPublicKey, GradidoUnit.zero(), ''))
    accountBalances.add(fundingUserLastBalance.getAccountBalance())
    return accountBalances
  }

  pushToBlockchain(item: DeletedTransactionLinkDb): void {
      const communityContext = this.context.getCommunityContextByUuid(item.user.communityUuid)
      const blockchain = communityContext.blockchain
  
      const senderKeyPair = deriveFromCode(item.code)
      const senderPublicKey = senderKeyPair.getPublicKey()
      
      if (!senderKeyPair || !senderPublicKey) {
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
      const linkFundingPublicKey = deferredTransfer.getSenderPublicKey()
      if (!linkFundingPublicKey) {
        throw new Error(`missing sender public key of transaction link founder`)
      }
      const senderLastBalance = this.getLastBalanceForUser(senderPublicKey, communityContext.blockchain)
      senderLastBalance.updateLegacyDecay(GradidoUnit.zero(), item.deletedAt)
  
      try {
        addToBlockchain(
          this.buildTransaction(
            item, transaction.getTransactionNr(), 
            senderLastBalance.getBalance(), 
            senderKeyPair, 
            linkFundingPublicKey,
          ),
          blockchain,
          item.id,
          this.calculateBalances(item, deferredTransfer, senderLastBalance, communityContext, senderPublicKey),
        )
      } catch(e) {
        throw new BlockchainError(`Error adding ${this.itemTypeName()}`, item, e as Error)
      }
    }
  
}
