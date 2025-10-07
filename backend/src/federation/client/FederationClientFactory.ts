import { FederatedCommunity as DbFederatedCommunity } from 'database'

import { FederationClient as V1_0_FederationClient } from '@/federation/client/1_0/FederationClient'
import { FederationClient as V1_1_FederationClient } from '@/federation/client/1_1/FederationClient'
import { ApiVersionType, ensureUrlEndsWithSlash } from 'core'

type FederationClient = V1_0_FederationClient | V1_1_FederationClient

interface FederationClientInstance {
  id: number

  client: FederationClient
}

export class FederationClientFactory {
  private static instanceArray: FederationClientInstance[] = []

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */

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
