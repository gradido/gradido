import { User } from '@entity/User'
import { UserLoggingView } from '@logging/UserLogging.view'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { isHumhubUserIdenticalToDbUser } from './compareHumhubUserDbUser'
import { HumHubClient } from './HumHubClient'
import { GetUser } from './model/GetUser'
import { PostUser } from './model/PostUser'

function setHumhubUserUuid(user: User, humhubUser: GetUser): void {
  user.humhubUserUuid = humhubUser.guid
  // eslint-disable-next-line promise/prefer-await-to-callbacks
  user.save().catch((error) => {
    logger.error('Error saving user with humhub user uuid', {
      user: new UserLoggingView(user),
      error: JSON.stringify(error, null, 2),
    })
  })
}

export enum ExecutedHumhubAction {
  UPDATE,
  CREATE,
  SKIP,
  DELETE,
}
/**
 * Trigger action according to conditions
 * | User exist on humhub | export to humhub allowed | changes in user data | ACTION
 * |      true            |         false            |       ignored        | DELETE
 * |      true            |         true             |        true          | UPDATE
 * |      true            |         true             |        false         | SKIP
 * |      false           |         false            |       ignored        | SKIP
 * |      false           |         true             |       ignored        | CREATE
 * @param user
 * @param humHubClient
 * @param humhubUsers
 * @returns
 */
export async function syncUser(
  user: User,
  humhubUsers: Map<string, GetUser>,
): Promise<ExecutedHumhubAction> {
  const postUser = new PostUser(user)
  const humhubUser = humhubUsers.get(user.emailContact.email.trim())
  const humHubClient = HumHubClient.getInstance()
  if (!humHubClient) {
    throw new LogError('Error creating humhub client')
  }

  if (humhubUser) {
    if (!user.humhubAllowed) {
      await humHubClient.deleteUser(humhubUser.id)
      return ExecutedHumhubAction.DELETE
    }
    // sync back humhub user uuid in our own db
    if (user.humhubUserUuid !== humhubUser.guid) {
      setHumhubUserUuid(user, humhubUser)
    }
    if (!isHumhubUserIdenticalToDbUser(humhubUser, user)) {
      // if humhub allowed
      await humHubClient.updateUser(postUser, humhubUser.id)
      return ExecutedHumhubAction.UPDATE
    }
  } else {
    if (user.humhubAllowed) {
      const humhubUser = await humHubClient.createUser(postUser)
      setHumhubUserUuid(user, humhubUser)
      return ExecutedHumhubAction.CREATE
    }
  }
  return ExecutedHumhubAction.SKIP
}
