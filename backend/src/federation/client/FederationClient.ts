import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

export type PublicInfo = {
  name: string
  description: string
  createdAt: Date
  publicKey: string
}

export interface FederationClient {
  requestGetPublicKey(dbCom: DbFederatedCommunity): Promise<string | undefined>
  requestGetPublicInfo(dbCom: DbFederatedCommunity): Promise<PublicInfo | undefined>
}
