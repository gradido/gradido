import { User } from '@entity/User'

import { HumHubClient } from '@/apis/humhub/HumHubClient'
import { GetUser } from '@/apis/humhub/model/GetUser'
import { ExecutedHumhubAction, syncUser } from '@/apis/humhub/syncUser'
import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { backendLogger as logger } from '@/server/logger'

/**
 * Syncs the user with humhub
 * @param updateUserInfosArg
 * @param user
 * @returns humhub user id or undefined
 */
export async function syncHumhub(
  updateUserInfosArg: UpdateUserInfosArgs | null,
  user: User,
  spaceId?: number | null,
): Promise<number | undefined> {
  // check for humhub relevant changes
  if (
    updateUserInfosArg &&
    updateUserInfosArg.alias === undefined &&
    updateUserInfosArg.firstName === undefined &&
    updateUserInfosArg.lastName === undefined &&
    updateUserInfosArg.humhubAllowed === undefined &&
    updateUserInfosArg.humhubPublishName === undefined &&
    updateUserInfosArg.language === undefined
  ) {
    logger.debug('no relevant changes')
    return
  }
  logger.debug('changed user-settings relevant for humhub-user update...')
  const humhubClient = HumHubClient.getInstance()
  if (!humhubClient) {
    return
  }
  logger.debug('retrieve user from humhub')
  let humhubUser = await humhubClient.userByUsername(user.alias ?? user.gradidoID)
  if (!humhubUser) {
    humhubUser = await humhubClient.userByEmail(user.emailContact.email)
  }
  const humhubUsers = new Map<string, GetUser>()
  if (humhubUser) {
    humhubUsers.set(user.emailContact.email, humhubUser)
  }
  logger.debug('update user at humhub')
  const result = await syncUser(user, humhubUsers)
  logger.info('finished sync user with humhub', {
    localId: user.id,
    externId: humhubUser?.id,
    // for preventing this warning https://github.com/eslint-community/eslint-plugin-security/blob/main/docs/rules/detect-object-injection.md
    // and possible danger coming with it
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    result: ExecutedHumhubAction[result as ExecutedHumhubAction],
  })
  if (spaceId && humhubUser) {
    await humhubClient.addUserToSpace(humhubUser.id, spaceId)
    logger.debug(`user added to space ${spaceId}`)
  }
  return user.id
}
