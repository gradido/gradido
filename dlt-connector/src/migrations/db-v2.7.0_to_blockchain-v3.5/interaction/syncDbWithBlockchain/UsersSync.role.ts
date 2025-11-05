import { CreatedUserDb } from '../../database'
import { AbstractSyncRole } from './AbstractSync.role'
import { loadUsers } from '../../database'
import { generateKeyPairUserAccount } from '../../keyPair'
import { userDbToTransaction } from '../../convert'
import { addRegisterAddressTransaction } from '../../blockchain'


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
    return await addRegisterAddressTransaction(communityContext.blockchain, transaction)
  }
}
