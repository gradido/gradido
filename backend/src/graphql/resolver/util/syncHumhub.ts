import { User } from '@entity/User'

import { HumHubClient } from '@/apis/humhub/HumHubClient'
import { GetUser } from '@/apis/humhub/model/GetUser'
import { ExecutedHumhubAction, syncUser } from '@/apis/humhub/syncUser'
import { PublishNameLogic } from '@/data/PublishName.logic'
import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { PublishNameType } from '@/graphql/enum/PublishNameType'
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
): Promise<GetUser | null | undefined> {
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
  const userNameLogic = new PublishNameLogic(user)
  const username = userNameLogic.getUserIdentifier(user.humhubPublishName as PublishNameType)
  let humhubUser = await humhubClient.userByUsername(username)
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

    result: ExecutedHumhubAction[result as ExecutedHumhubAction],
  })
  if (spaceId && humhubUser) {
    await humhubClient.addUserToSpace(humhubUser.id, spaceId)
    logger.debug(`user added to space ${spaceId}`)
  }
  if (result !== ExecutedHumhubAction.SKIP) {
    return await humhubClient.userByUsername(username)
  }
  return humhubUser
}
