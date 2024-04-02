import { User as DbUser } from '@entity/User'

import { verifyAuthToken } from '@/apis/gms/GmsClient'
import { CONFIG } from '@/config'
import { GmsUserAuthenticationResult } from '@/graphql/model/GmsUserAuthenticationResult'
import { backendLogger as logger } from '@/server/logger'

export async function authenticateGmsUserPlayground(
  token: string,
  dbUser: DbUser,
): Promise<GmsUserAuthenticationResult> {
  const result = new GmsUserAuthenticationResult()
  result.url = CONFIG.GMS_URL.concat('/playground')
  result.token = await verifyAuthToken(dbUser.communityUuid, token)
  logger.info('GmsUserAuthenticationResult:', result)
  return result
}
