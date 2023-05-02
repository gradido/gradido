import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

export type PublicCommunityInfo = {
  name: string
  description: string
  createdAt: Date
  publicKey: string
}

export interface FederationClient {
  requestGetPublicKey(dbCom: DbFederatedCommunity): Promise<string | undefined>
  requestGetPublicCommunityInfo(
    dbCom: DbFederatedCommunity,
  ): Promise<PublicCommunityInfo | undefined>
}
