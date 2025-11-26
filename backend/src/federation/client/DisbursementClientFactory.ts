import { ApiVersionType } from 'core'
import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { DisbursementClient as V1_0_DisbursementClient } from '@/federation/client/1_0/DisbursementClient'
import { DisbursementClient as V1_1_DisbursementClient } from '@/federation/client/1_1/DisbursementClient'

type DisbursementClient = V1_0_DisbursementClient | V1_1_DisbursementClient

interface DisbursementClientInstance {
  id: number

  client: DisbursementClient
}

export class DisbursementClientFactory {
  private static instanceArray: DisbursementClientInstance[] = []

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */

  private constructor() {}

  private static createDisbursementClient = (dbCom: DbFederatedCommunity) => {
    switch (dbCom.apiVersion) {
      case ApiVersionType.V1_0:
        return new V1_0_DisbursementClient(dbCom)
      case ApiVersionType.V1_1:
        return new V1_1_DisbursementClient(dbCom)
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
  public static getInstance(dbCom: DbFederatedCommunity): DisbursementClient | null {
    const instance = DisbursementClientFactory.instanceArray.find(
      (instance) => instance.id === dbCom.id,
    )
    if (instance) {
      return instance.client
    }
    const client = DisbursementClientFactory.createDisbursementClient(dbCom)
    if (client) {
      DisbursementClientFactory.instanceArray.push({
        id: dbCom.id,
        client,
      } as DisbursementClientInstance)
    }
    return client
  }
}
