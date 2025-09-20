import { FederatedCommunity as DbFederatedCommunity } from 'database'

import { SendCoinsClient as V1_0_SendCoinsClient } from './1_0/SendCoinsClient'
import { SendCoinsClient as V1_1_SendCoinsClient } from './1_1/SendCoinsClient'
import { ApiVersionType } from '../enum/apiVersionType'

type SendCoinsClient = V1_0_SendCoinsClient | V1_1_SendCoinsClient

interface SendCoinsClientInstance {
  id: number

  client: SendCoinsClient
}

export class SendCoinsClientFactory {
  private static instanceArray: SendCoinsClientInstance[] = []

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */

  private constructor() {}

  private static createSendCoinsClient = (dbCom: DbFederatedCommunity) => {
    switch (dbCom.apiVersion) {
      case ApiVersionType.V1_0:
        return new V1_0_SendCoinsClient(dbCom)
      case ApiVersionType.V1_1:
        return new V1_1_SendCoinsClient(dbCom)
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
  public static getInstance(dbCom: DbFederatedCommunity): SendCoinsClient | null {
    const instance = SendCoinsClientFactory.instanceArray.find(
      (instance) => instance.id === dbCom.id,
    )
    if (instance) {
      return instance.client
    }
    const client = SendCoinsClientFactory.createSendCoinsClient(dbCom)
    if (client) {
      SendCoinsClientFactory.instanceArray.push({
        id: dbCom.id,
        client,
      } as SendCoinsClientInstance)
    }
    return client
  }
}
