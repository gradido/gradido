import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

// eslint-disable-next-line camelcase
import { AuthenticationClient as V1_0_AuthenticationClient } from '@/federation/client/1_0/AuthenticationClient'
// eslint-disable-next-line camelcase
import { AuthenticationClient as V1_1_AuthenticationClient } from '@/federation/client/1_1/AuthenticationClient'
import { ApiVersionType } from '@/federation/enum/apiVersionType'

// eslint-disable-next-line camelcase
type AuthenticationClient = V1_0_AuthenticationClient | V1_1_AuthenticationClient

interface AuthenticationClientInstance {
  id: number
  // eslint-disable-next-line no-use-before-define
  client: AuthenticationClient
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AuthenticationClientFactory {
  private static instanceArray: AuthenticationClientInstance[] = []

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  // eslint-disable-next-line no-useless-constructor, @typescript-eslint/no-empty-function
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
