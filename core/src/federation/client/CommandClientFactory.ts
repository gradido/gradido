import { ApiVersionType } from 'core'
import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { CommandClient as V1_0_CommandClient } from './1_0/CommandClient'
import { CommandClient as V1_1_CommandClient } from './1_1/CommandClient'

type CommandClient = V1_0_CommandClient | V1_1_CommandClient

interface CommandClientInstance {
  id: number

  client: CommandClient
}

export class CommandClientFactory {
  private static instanceArray: CommandClientInstance[] = []

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */

  private constructor() {}

  private static createCommandClient = (dbCom: DbFederatedCommunity) => {
    switch (dbCom.apiVersion) {
      case ApiVersionType.V1_0:
        return new V1_0_CommandClient(dbCom)
      case ApiVersionType.V1_1:
        return new V1_1_CommandClient(dbCom)
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
  public static getInstance(dbCom: DbFederatedCommunity): CommandClient | null {
    const instance = CommandClientFactory.instanceArray.find((instance) => instance.id === dbCom.id)
    if (instance) {
      return instance.client
    }
    const client = CommandClientFactory.createCommandClient(dbCom)
    if (client) {
      CommandClientFactory.instanceArray.push({
        id: dbCom.id,
        client,
      } as CommandClientInstance)
    }
    return client
  }
}
