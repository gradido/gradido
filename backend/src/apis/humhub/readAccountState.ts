import { User } from '@entity/User'

import { CONFIG } from '@/config'
import { PublishNameLogic } from '@/data/PublishName.logic'
import { PublishNameType } from '@/graphql/enum/PublishNameType'
import { backendLogger as logger } from '@/server/logger'

import { HumHubClient } from './HumHubClient'

export const readAccountState = async (user: User): Promise<boolean> => {
  if (CONFIG.HUMHUB_ACTIVE && user.humhubAllowed) {
    const publishNameLogic = new PublishNameLogic(user)
    try {
      const result = await HumHubClient.getInstance()?.userByUsernameAsync(
        publishNameLogic.getUsername(user.humhubPublishName as PublishNameType),
      )
      return Promise.resolve(result?.result?.account.status === 1)
    } catch (e) {
      logger.error("couldn't reach out to humhub, disable for now", e)
    }
  }
  return Promise.resolve(false)
}
