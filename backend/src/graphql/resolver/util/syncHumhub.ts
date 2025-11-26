import { User } from 'database'
import { getLogger } from 'log4js'
import { HumHubClient } from '@/apis/humhub/HumHubClient'
import { GetUser } from '@/apis/humhub/model/GetUser'
import { PostUser } from '@/apis/humhub/model/PostUser'
import { ExecutedHumhubAction, syncUser } from '@/apis/humhub/syncUser'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { PublishNameLogic } from '@/data/PublishName.logic'
import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { PublishNameType } from '@/graphql/enum/PublishNameType'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.syncHumhub`)

/**
 * Syncs the user with humhub
 * @param updateUserInfosArg
 * @param user
 * @returns humhub user id or undefined
 */
export async function syncHumhub(
  updateUserInfosArg: UpdateUserInfosArgs | null,
  user: User,
  oldHumhubUsername: string,
  spaceId?: number | null,
): Promise<GetUser | null | undefined> {
  const logger = createLogger()
  logger.addContext('user', user.id)
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
  let humhubUser = await humhubClient.userByUsername(oldHumhubUsername)
  if (!humhubUser) {
    humhubUser = await humhubClient.userByEmail(user.emailContact.email)
  }
  const humhubUsers = new Map<string, GetUser>()
  if (humhubUser) {
    const publishNameLogic = new PublishNameLogic(user)
    const username = publishNameLogic.getUserIdentifier(user.humhubPublishName as PublishNameType)
    humhubUsers.set(username, humhubUser)
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
    const getUser = new PostUser(user)
    return await humhubClient.userByUsername(getUser.account.username)
  }
  return humhubUser
}
