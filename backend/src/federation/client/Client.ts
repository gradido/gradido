import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

import { ApiVersionType } from '@/federation/enum/apiVersionType'

// eslint-disable-next-line camelcase
import { Client_1_0 } from './Client_1_0'
// eslint-disable-next-line camelcase
import { Client_1_1 } from './Client_1_1'

// eslint-disable-next-line camelcase
type FederationClient = Client_1_0 | Client_1_1

interface ClientInstance {
  id: number
  // eslint-disable-next-line no-use-before-define
  client: FederationClient
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Client {
  private static instanceArray: ClientInstance[] = []

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  // eslint-disable-next-line no-useless-constructor, @typescript-eslint/no-empty-function
  private constructor() {}

  private static createFederationClient = (dbCom: DbFederatedCommunity) => {
    switch (dbCom.apiVersion) {
      case ApiVersionType.V1_0:
        return new Client_1_0(dbCom)
      case ApiVersionType.V1_1:
        return new Client_1_1(dbCom)
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
    const instance = Client.instanceArray.find((instance) => instance.id === dbCom.id)
    if (instance) {
      return instance.client
    }
    const client = Client.createFederationClient(dbCom)
    if (client) {
      Client.instanceArray.push({ id: dbCom.id, client } as ClientInstance)
    }
    return client
  }
}
