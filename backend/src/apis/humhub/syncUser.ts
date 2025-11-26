import { User } from 'database'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'
import { isHumhubUserIdenticalToDbUser } from './compareHumhubUserDbUser'
import { HumHubClient } from './HumHubClient'
import { GetUser } from './model/GetUser'
import { PostUser } from './model/PostUser'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.humhub.syncUser`)

export enum ExecutedHumhubAction {
  UPDATE,
  CREATE,
  SKIP,
  DELETE,
  VALIDATION_ERROR,
}

// todo: replace with full validation (schema)
function isValid(postUser: PostUser, userId: number): boolean {
  if (postUser.profile.firstname.length > 20) {
    logger.error('firstname too long for humhub, for user with id:', userId)
    return false
  }
  if (postUser.profile.lastname.length > 20) {
    logger.error('lastname too long for humhub, for user with id:', userId)
    return false
  }
  return true
}

/**
 * Trigger action according to conditions
 * | User exist on humhub | export to humhub allowed | changes in user data | ACTION
 * |      true            |         false            |       ignored        | DELETE
 * |      true            |         true             |        true          | UPDATE
 * |      true            |         true             |        false         | SKIP
 * |      false           |         false            |       ignored        | SKIP
 * |      false           |         true             |       ignored        | CREATE
 * @param user user entity
 * @param humhubUsers user map indices with username
 * @returns
 */
export async function syncUser(
  user: User,
  humhubUsers: Map<string, GetUser>,
): Promise<ExecutedHumhubAction> {
  const postUser = new PostUser(user)
  if (!isValid(postUser, user.id)) {
    return ExecutedHumhubAction.VALIDATION_ERROR
  }
  let humhubUser = humhubUsers.get(postUser.account.username)
  if (!humhubUser) {
    // fallback for legacy users
    humhubUser = humhubUsers.get(user.gradidoID)
  }
  const humHubClient = HumHubClient.getInstance()
  if (!humHubClient) {
    throw new LogError('Error creating humhub client')
  }

  if (humhubUser) {
    if (!user.humhubAllowed) {
      await humHubClient.deleteUser(humhubUser.id)
      return ExecutedHumhubAction.DELETE
    }
    if (!isHumhubUserIdenticalToDbUser(humhubUser, user)) {
      // if humhub allowed
      await humHubClient.updateUser(postUser, humhubUser.id)
      return ExecutedHumhubAction.UPDATE
    }
  } else {
    if (user.humhubAllowed) {
      await humHubClient.createUser(postUser)
      return ExecutedHumhubAction.CREATE
    }
  }
  return ExecutedHumhubAction.SKIP
}
