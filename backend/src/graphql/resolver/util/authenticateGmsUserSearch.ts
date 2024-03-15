import { User as DbUser } from '@entity/User'

import { verifyAuthToken } from '@/apis/gms/GmsClient'

export async function authenticateGmsUserSearch(token: string, dbUser: DbUser): Promise<string> {
  const gmsPlaygroundUri = await verifyAuthToken(dbUser.communityUuid, token)

  return gmsPlaygroundUri
}
