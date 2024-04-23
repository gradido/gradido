import { User } from '@entity/User'

import { HumHubClient } from '@/apis/humhub/HumHubClient'
import { GetUser } from '@/apis/humhub/model/GetUser'
import { syncUser } from '@/apis/humhub/syncUser'
import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { backendLogger as logger } from '@/server/logger'

export async function syncHumhub(
  updateUserInfosArg: UpdateUserInfosArgs,
  user: User,
): Promise<void> {
  // check for humhub relevant changes
  if (
    !updateUserInfosArg.alias &&
    !updateUserInfosArg.firstName &&
    !updateUserInfosArg.lastName &&
    !updateUserInfosArg.humhubAllowed &&
    !updateUserInfosArg.humhubPublishName &&
    !updateUserInfosArg.language
  ) {
    return
  }
  logger.debug('changed user-settings relevant for humhub-user update...')
  const humhubClient = HumHubClient.getInstance()
  if (!humhubClient) {
    return
  }
  logger.debug('retrieve user from humhub')
  const humhubUser = await humhubClient.userByEmail(user.emailContact.email)
  const humhubUsers = new Map<string, GetUser>()
  if (humhubUser) {
    humhubUsers.set(user.emailContact.email, humhubUser)
  }
  logger.debug('update user at humhub')
  const result = await syncUser(user, humhubUsers)
  logger.info('finished sync user with humhub', {
    localId: user.id,
    externId: humhubUser?.id,
    result,
  })
}
