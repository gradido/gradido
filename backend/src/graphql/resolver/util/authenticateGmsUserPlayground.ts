import { User as DbUser } from '@entity/User'

import { verifyAuthToken } from '@/apis/gms/GmsClient'
import { CONFIG } from '@/config'
import { GmsUserAuthenticationResult } from '@/graphql/model/GmsUserAuthenticationResult'
import { backendLogger as logger } from '@/server/logger'
import { ensureUrlEndsWithSlash } from '@/util/utilities'

export async function authenticateGmsUserPlayground(
  apiKey: string,
  token: string,
  dbUser: DbUser,
): Promise<GmsUserAuthenticationResult> {
  const result = new GmsUserAuthenticationResult()
  const dashboardUrl = ensureUrlEndsWithSlash(CONFIG.GMS_DASHBOARD_URL)

  result.url = dashboardUrl.concat('usersearch-playground')
  result.token = await verifyAuthToken(dbUser.communityUuid, token)
  logger.info('GmsUserAuthenticationResult:', result)
  return result
}
