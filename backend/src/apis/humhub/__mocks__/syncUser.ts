import type { User } from '@entity/User'

import { isHumhubUserIdenticalToDbUser } from '@/apis/humhub/compareHumhubUserDbUser'
import type { GetUser } from '@/apis/humhub/model/GetUser'

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
  const humhubUser = humhubUsers.get(user.emailContact.email.trim())
  if (humhubUser) {
    if (!user.humhubAllowed) {
      return Promise.resolve(ExecutedHumhubAction.DELETE)
    }
    if (!isHumhubUserIdenticalToDbUser(humhubUser, user)) {
      // if humhub allowed
      return Promise.resolve(ExecutedHumhubAction.UPDATE)
    }
  } else {
    if (user.humhubAllowed) {
      return Promise.resolve(ExecutedHumhubAction.CREATE)
    }
  }
  return Promise.resolve(ExecutedHumhubAction.SKIP)
}
