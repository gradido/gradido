import { addTransaction } from '../../blockchain'
import { userDbToTransaction } from '../../convert'
import { loadUsers } from '../../database'
import { generateKeyPairUserAccount } from '../../keyPair'
import { CreatedUserDb } from '../../valibot.schema'
import { AbstractSyncRole } from './AbstractSync.role'

export class UsersSyncRole extends AbstractSyncRole<CreatedUserDb> {
  getDate(): Date {
    return this.peek().createdAt
  }

  itemTypeName(): string {
    return 'users'
  }

  async loadFromDb(offset: number, count: number): Promise<CreatedUserDb[]> {
    const users = await loadUsers(this.context.db, offset, count)
    for (const user of users) {
      const communityContext = this.context.getCommunityContextByUuid(user.communityUuid)
      await generateKeyPairUserAccount(user, this.context.cache, communityContext.topicId)
    }
    return users
  }

  async pushToBlockchain(item: CreatedUserDb): Promise<void> {
    const communityContext = this.context.getCommunityContextByUuid(item.communityUuid)
    const transaction = userDbToTransaction(item, communityContext.topicId)
    return await addTransaction(communityContext.blockchain, communityContext.blockchain, transaction, item.id)
  }
}
