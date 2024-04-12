import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

// eslint-disable-next-line camelcase
import { FederationClient as V1_0_FederationClient } from '@/federation/client/1_0/FederationClient'
// eslint-disable-next-line camelcase
import { FederationClient as V1_1_FederationClient } from '@/federation/client/1_1/FederationClient'
import { ApiVersionType } from '@/federation/enum/apiVersionType'
import { ensureUrlEndsWithSlash } from '@/util/utilities'

// eslint-disable-next-line camelcase
type FederationClient = V1_0_FederationClient | V1_1_FederationClient

interface FederationClientInstance {
  id: number
  // eslint-disable-next-line no-use-before-define
  client: FederationClient
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class FederationClientFactory {
  private static instanceArray: FederationClientInstance[] = []

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  // eslint-disable-next-line no-useless-constructor, @typescript-eslint/no-empty-function
  private constructor() {}

  private static createFederationClient = (dbCom: DbFederatedCommunity) => {
    switch (dbCom.apiVersion) {
      case ApiVersionType.V1_0:
        return new V1_0_FederationClient(dbCom)
      case ApiVersionType.V1_1:
        return new V1_1_FederationClient(dbCom)
      default:
        return null
    }
  }

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(dbCom: DbFederatedCommunity): FederationClient | null {
    const instance = FederationClientFactory.instanceArray.find(
      (instance) => instance.id === dbCom.id,
    )
    const endpoint = ensureUrlEndsWithSlash(dbCom.endPoint).concat(dbCom.apiVersion)
    // check if endpoint is still the same and not changed meanwhile
    if (instance && instance.client.getEndpoint() === endpoint) {
      return instance.client
    }
    const client = FederationClientFactory.createFederationClient(dbCom)
    if (client) {
      // only update instance if we already have one
      if (instance) {
        instance.client = client
      } else {
        FederationClientFactory.instanceArray.push({
          id: dbCom.id,
          client,
        } as FederationClientInstance)
      }
    }
    return client
  }
}
