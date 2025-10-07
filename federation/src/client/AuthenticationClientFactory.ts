import { FederatedCommunity as DbFederatedCommunity } from 'database'

import { AuthenticationClient as V1_0_AuthenticationClient } from './1_0/AuthenticationClient'

import { AuthenticationClient as V1_1_AuthenticationClient } from './1_1/AuthenticationClient'
import { ApiVersionType } from 'core'

type AuthenticationClient = V1_0_AuthenticationClient | V1_1_AuthenticationClient

interface AuthenticationClientInstance {
  id: number

  client: AuthenticationClient
}

export class AuthenticationClientFactory {
  private static instanceArray: AuthenticationClientInstance[] = []

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */

  private constructor() {}

  private static createAuthenticationClient = (dbCom: DbFederatedCommunity) => {
    switch (dbCom.apiVersion) {
      case ApiVersionType.V1_0:
        return new V1_0_AuthenticationClient(dbCom)
      case ApiVersionType.V1_1:
        return new V1_1_AuthenticationClient(dbCom)
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
  public static getInstance(dbCom: DbFederatedCommunity): AuthenticationClient | null {
    const instance = AuthenticationClientFactory.instanceArray.find(
      (instance) => instance.id === dbCom.id,
    )
    if (instance) {
      return instance.client
    }
    const client = AuthenticationClientFactory.createAuthenticationClient(dbCom)
    if (client) {
      AuthenticationClientFactory.instanceArray.push({
        id: dbCom.id,
        client,
      } as AuthenticationClientInstance)
    }
    return client
  }
}
