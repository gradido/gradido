import { and, asc, eq, isNull, gt, or } from 'drizzle-orm'
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
  TransactionType_CREATION, 
  TransferAmount 
} from 'gradido-blockchain-js'
import * as v from 'valibot'
import { addToBlockchain } from '../../blockchain'
import { ContributionStatus } from '../../data/ContributionStatus'
import {
  contributionsTable,  
  usersTable
} from '../../drizzle.schema'
import { BlockchainError, DatabaseError } from '../../errors'
import { CommunityContext, CreationTransactionDb, creationTransactionDbSchema } from '../../valibot.schema'
import { AbstractSyncRole, IndexType } from './AbstractSync.role'
import { toMysqlDateTime } from '../../utils'

export class CreationsSyncRole extends AbstractSyncRole<CreationTransactionDb> {  

  getDate(): Date {
    return this.peek().confirmedAt
  }

  getLastIndex(): IndexType {
      const lastItem = this.peekLast()
      return { date: lastItem.confirmedAt, id: lastItem.transactionId }
    }

  itemTypeName(): string {
    return 'creationTransactions'
  }

  async loadFromDb(lastIndex: IndexType, count: number): Promise<CreationTransactionDb[]> {
    const confirmedByUsers = alias(usersTable, 'confirmedByUser')  
    const result = await this.context.db
      .select({
        contribution: contributionsTable,
        user: usersTable,
        confirmedByUser: confirmedByUsers,
      })
      .from(contributionsTable)
      .where(and(
        isNull(contributionsTable.contributionLinkId),
        eq(contributionsTable.contributionStatus, ContributionStatus.CONFIRMED),
        or(
          gt(contributionsTable.confirmedAt, toMysqlDateTime(lastIndex.date)),
          and(
            eq(contributionsTable.confirmedAt, toMysqlDateTime(lastIndex.date)),
            gt(contributionsTable.transactionId, lastIndex.id)
          )
        )
      ))
      .innerJoin(usersTable, eq(contributionsTable.userId, usersTable.id))
      .innerJoin(confirmedByUsers, eq(contributionsTable.confirmedBy, confirmedByUsers.id))
      .orderBy(asc(contributionsTable.confirmedAt), asc(contributionsTable.transactionId))
      .limit(count)
  
    return result.map((row) => {
      const item = {
        ...row.contribution,
        user: row.user,
        confirmedByUser: row.confirmedByUser,
      }
      try {
        return v.parse(creationTransactionDbSchema, item)
      } catch (e) {
        throw new DatabaseError('loadCreations', item, e as Error)
      }
    })
  }

  buildTransaction(
    item: CreationTransactionDb, 
    communityContext: CommunityContext, 
    recipientKeyPair: KeyPairEd25519, 
    signerKeyPair: KeyPairEd25519
  ): GradidoTransactionBuilder {
    return new GradidoTransactionBuilder()    
      .setCreatedAt(item.confirmedAt)
      .addMemo(
        new EncryptedMemo(
          item.memo,
          new AuthenticatedEncryption(communityContext.keyPair),
          new AuthenticatedEncryption(recipientKeyPair),
        ),
      )
      .setTransactionCreation(
        new TransferAmount(recipientKeyPair.getPublicKey(), item.amount),
        item.contributionDate,
      )
      .sign(signerKeyPair)
  }

  calculateAccountBalances(
    item: CreationTransactionDb, 
    communityContext: CommunityContext, 
    recipientPublicKey: MemoryBlockPtr
  ): AccountBalances {
    const accountBalances = new AccountBalances()
    const balance = this.getLastBalanceForUser(recipientPublicKey, communityContext.blockchain)

    // calculate decay since last balance with legacy calculation method
    balance.updateLegacyDecay(item.amount, item.confirmedAt)
    communityContext.aufBalance.updateLegacyDecay(item.amount, item.confirmedAt)
    communityContext.gmwBalance.updateLegacyDecay(item.amount, item.confirmedAt)

    accountBalances.add(balance.getAccountBalance())
    accountBalances.add(communityContext.aufBalance.getAccountBalance())
    accountBalances.add(communityContext.gmwBalance.getAccountBalance())
    return accountBalances
  }

  pushToBlockchain(item: CreationTransactionDb): void {
    const communityContext = this.context.getCommunityContextByUuid(item.user.communityUuid)
    const blockchain = communityContext.blockchain
    if (item.confirmedByUser.communityUuid !== item.user.communityUuid) {
      throw new Error(`contribution was confirmed from other community: ${JSON.stringify(item, null, 2)}`)
    }
    
    const recipientKeyPair = this.getAccountKeyPair(communityContext, item.user.gradidoId)
    const recipientPublicKey = recipientKeyPair.getPublicKey()
    const signerKeyPair = this.getAccountKeyPair(communityContext, item.confirmedByUser.gradidoId)
    if (!recipientKeyPair || !signerKeyPair || !recipientPublicKey) {
      throw new Error(`missing key for ${this.itemTypeName()}: ${JSON.stringify(item, null, 2)}`)
    }

    try {
      addToBlockchain(
        this.buildTransaction(item, communityContext, recipientKeyPair, signerKeyPair),
        blockchain,
        item.id,
        this.calculateAccountBalances(item, communityContext, recipientPublicKey),
      )
    } catch(e) {
      const f= new Filter()
      f.transactionType = TransactionType_CREATION
      f.searchDirection = SearchDirection_DESC
      f.pagination.size = 1
      const lastContribution = blockchain.findOne(f)
      if (lastContribution) {
        this.context.logger.warn(`last contribution: ${lastContribution.getConfirmedTransaction()?.toJson(true)}`)
      }
      throw new BlockchainError(`Error adding ${this.itemTypeName()}`, item, e as Error)
    }
  }
}
