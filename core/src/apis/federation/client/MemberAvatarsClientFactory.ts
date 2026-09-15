// AI-GENERATED — not an architecture reference
import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { ApiVersionType } from '../enum/apiVersionType'
import { MemberAvatarsClient as V1_0_MemberAvatarsClient } from './1_0/MemberAvatarsClient'
import { MemberAvatarsClient as V1_1_MemberAvatarsClient } from './1_1/MemberAvatarsClient'

type MemberAvatarsClient = V1_0_MemberAvatarsClient | V1_1_MemberAvatarsClient

interface MemberAvatarsClientInstance {
  id: number

  client: MemberAvatarsClient
}

/** The same shape as SendCoinsClientFactory: one client per federated community entry. */
export class MemberAvatarsClientFactory {
  private static instanceArray: MemberAvatarsClientInstance[] = []

  private constructor() {}

  private static createMemberAvatarsClient = (dbCom: DbFederatedCommunity) => {
    switch (dbCom.apiVersion) {
      case ApiVersionType.V1_0:
        return new V1_0_MemberAvatarsClient(dbCom)
      case ApiVersionType.V1_1:
        return new V1_1_MemberAvatarsClient(dbCom)
      default:
        return null
    }
  }

  public static getInstance(dbCom: DbFederatedCommunity): MemberAvatarsClient | null {
    const instance = MemberAvatarsClientFactory.instanceArray.find(
      (instance) => instance.id === dbCom.id,
    )
    if (instance) {
      return instance.client
    }
    const client = MemberAvatarsClientFactory.createMemberAvatarsClient(dbCom)
    if (client) {
      MemberAvatarsClientFactory.instanceArray.push({
        id: dbCom.id,
        client,
      } as MemberAvatarsClientInstance)
    }
    return client
  }
}
