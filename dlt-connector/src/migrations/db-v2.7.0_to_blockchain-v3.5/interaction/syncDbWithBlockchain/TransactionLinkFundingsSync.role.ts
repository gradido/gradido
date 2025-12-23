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
import { BlockchainError, DatabaseError } from '../../errors'
import { CommunityContext, TransactionLinkDb, transactionLinkDbSchema } from '../../valibot.schema'
import { AbstractSyncRole } from './AbstractSync.role'
import { deriveFromCode } from '../../../../data/deriveKeyPair'

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

      const senderLastBalance = this.getLastBalanceForUser(senderPublicKey, communityContext.blockchain)      
      if (senderLastBalance.getBalance().lt(blockedAmount)) {
        const f = new Filter()
        f.updatedBalancePublicKey = senderPublicKey
        f.pagination.size = 4
        f.searchDirection = SearchDirection_DESC
        const lastSenderTransactions = communityContext.blockchain.findAll(f)
        this.context.logger.error(`sender hasn't enough balance: ${senderPublicKey.convertToHex()}, last ${lastSenderTransactions.size()} balance changing transactions:`)
        for(let i = lastSenderTransactions.size() - 1; i >= 0; i--) {
          const lastSenderTransaction = lastSenderTransactions.get(i)          
          this.context.logger.error(`${lastSenderTransaction?.getConfirmedTransaction()?.toJson(true)}`)
        }
      }
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
    const blockedAmount = item.amount.calculateCompoundInterest(duration.getSeconds())
    
    try {
      addToBlockchain(
        this.buildTransaction(item, blockedAmount, duration, senderKeyPair, recipientKeyPair),
        blockchain,
        item.id,
        this.calculateBalances(item, blockedAmount, communityContext, senderPublicKey, recipientPublicKey),
      )
    } catch(e) {
      throw new BlockchainError(`Error adding ${this.itemTypeName()}`, item, e as Error)
    }
  }
}
