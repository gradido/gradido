import { ensureUrlEndsWithSlash } from 'core'
import { User as DbUser } from 'database'
import { getLogger } from 'log4js'
import { verifyAuthToken } from '@/apis/gms/GmsClient'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { GmsUserAuthenticationResult } from '@/graphql/model/GmsUserAuthenticationResult'

const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.authenticateGmsUserPlayground`,
)

export async function authenticateGmsUserPlayground(
  _apiKey: string,
  token: string,
  dbUser: DbUser,
): Promise<GmsUserAuthenticationResult> {
  const result = new GmsUserAuthenticationResult()
  const dashboardUrl = ensureUrlEndsWithSlash(CONFIG.GMS_DASHBOARD_URL)

  result.url = dashboardUrl.concat(CONFIG.GMS_USER_SEARCH_FRONTEND_ROUTE)
  result.token = await verifyAuthToken(dbUser.communityUuid, token)
  logger.info('GmsUserAuthenticationResult:', result)
  return result
}
