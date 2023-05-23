import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

import { ApiVersionType } from '@/federation/enum/apiVersionType'

import { FederationClient_1_0 } from './FederationClient_1_0'
import { FederationClient_1_1 } from './FederationClient_1_1'

type FederationClientType = FederationClient_1_0 | FederationClient_1_1

interface ClientInstance {
  id: number
  // eslint-disable-next-line no-use-before-define
  client: FederationClientType
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class FederationClient {
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
        return new FederationClient_1_0(dbCom)
      case ApiVersionType.V1_1:
        return new FederationClient_1_1(dbCom)
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
  public static getInstance(dbCom: DbFederatedCommunity): FederationClientType | null {
    const instance = FederationClient.instanceArray.find((instance) => instance.id === dbCom.id)
    if (instance) {
      return instance.client
    }
    const client = FederationClient.createFederationClient(dbCom)
    if (client) {
      FederationClient.instanceArray.push({ id: dbCom.id, client } as ClientInstance)
    }
    return client
  }
}
