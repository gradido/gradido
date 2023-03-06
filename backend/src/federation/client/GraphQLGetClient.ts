import { GraphQLClient } from 'graphql-request'
import { PatchedRequestInit } from 'graphql-request/dist/types'

type ClientInstance = {
  url: string
  // eslint-disable-next-line no-use-before-define
  client: GraphQLGetClient
}

export class GraphQLGetClient extends GraphQLClient {
  private static instanceArray: ClientInstance[] = []

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  // eslint-disable-next-line no-useless-constructor
  private constructor(url: string, options?: PatchedRequestInit) {
    super(url, options)
  }

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(url: string): GraphQLGetClient {
    GraphQLGetClient.instanceArray.forEach(function (instance) {
      if (instance.url === url) {
        return instance.client
      }
    })
    const client = new GraphQLGetClient(url, {
      method: 'GET',
      jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
    })
    GraphQLGetClient.instanceArray.push({ url, client } as ClientInstance)
    return client
  }
}
