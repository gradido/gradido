import { asc, and, gt, eq, or } from 'drizzle-orm'
import { 
  AccountBalance, 
  AccountBalances, 
  AddressType_COMMUNITY_HUMAN, 
  GradidoTransactionBuilder, 
  GradidoUnit, 
  KeyPairEd25519, 
  LedgerAnchor, 
  MemoryBlockPtr 
} from 'gradido-blockchain-js'
import * as v from 'valibot'
import { deriveFromKeyPairAndUuid } from '../../../../data/deriveKeyPair'
import { Uuidv4Hash } from '../../../../data/Uuidv4Hash'
import { addToBlockchain } from '../../blockchain'
import { usersTable } from '../../drizzle.schema'
import { BlockchainError, DatabaseError } from '../../errors'
import { CommunityContext, UserDb, userDbSchema } from '../../valibot.schema'
import { AbstractSyncRole, IndexType } from './AbstractSync.role'
import { toMysqlDateTime } from '../../utils'

export class UsersSyncRole extends AbstractSyncRole<UserDb> {

  getDate(): Date {
    return this.peek().createdAt
  }

  getLastIndex(): IndexType {
    const lastItem = this.peekLast()
    return { date: lastItem.createdAt, id: lastItem.id }
  }

  itemTypeName(): string {
    return 'users'
  }

  async loadFromDb(lastIndex: IndexType, count: number): Promise<UserDb[]> {
    const result = await this.context.db
        .select()
        .from(usersTable)
        .where(and(
          or(
            gt(usersTable.createdAt, toMysqlDateTime(lastIndex.date)),
            and(
              eq(usersTable.createdAt, toMysqlDateTime(lastIndex.date)),
              gt(usersTable.id, lastIndex.id)
            )
          )
        ))
        .orderBy(asc(usersTable.createdAt), asc(usersTable.id))
        .limit(count)
    
    return result.map((row) => {
      try {
        return v.parse(userDbSchema, row)
      } catch (e) {
        throw new DatabaseError('loadUsers', row, e as Error)
      }
    })
  }

  buildTransaction(
    communityContext: CommunityContext,
    item: UserDb, 
    communityKeyPair: KeyPairEd25519, 
    accountKeyPair: KeyPairEd25519, 
    userKeyPair: KeyPairEd25519
  ): GradidoTransactionBuilder {
    return new GradidoTransactionBuilder()
      .setCreatedAt(item.createdAt)
      .setRegisterAddress(
        userKeyPair.getPublicKey(),
        AddressType_COMMUNITY_HUMAN,
        new Uuidv4Hash(item.gradidoId).getAsMemoryBlock(),
        accountKeyPair.getPublicKey(),
      )
      .setSenderCommunity(communityContext.communityId)
      .sign(communityKeyPair)
      .sign(accountKeyPair)
      .sign(userKeyPair)
  }

  calculateAccountBalances(accountPublicKey: MemoryBlockPtr, communityContext: CommunityContext,): AccountBalances {
    const accountBalances = new AccountBalances()
    accountBalances.add(new AccountBalance(accountPublicKey, GradidoUnit.zero(), communityContext.communityId))
    return accountBalances
  }

  pushToBlockchain(item: UserDb): void {
    const communityContext = this.context.getCommunityContextByUuid(item.communityUuid)
    const userKeyPair = deriveFromKeyPairAndUuid(communityContext.keyPair, item.gradidoId)
    const accountKeyPair = this.getAccountKeyPair(communityContext, item.gradidoId)
    const accountPublicKey = accountKeyPair.getPublicKey()
    if (!userKeyPair || !accountKeyPair || !accountPublicKey) {
      throw new Error(`missing key for ${this.itemTypeName()}: ${JSON.stringify(item, null, 2)}`)
    }

    try {
      addToBlockchain(
        this.buildTransaction(communityContext, item, communityContext.keyPair, accountKeyPair, userKeyPair).build(),
        communityContext.blockchain,
        new LedgerAnchor(item.id, LedgerAnchor.Type_LEGACY_GRADIDO_DB_USER_ID),
        this.calculateAccountBalances(accountPublicKey, communityContext),
      )
    } catch (e) {
      throw new BlockchainError(`Error adding ${this.itemTypeName()}`, item, e as Error)
    }
  }
}
