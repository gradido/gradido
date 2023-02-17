import { GraphQLClient } from 'graphql-request'
import { PatchedRequestInit } from 'graphql-request/dist/types'

export class GraphQLGetClient extends GraphQLClient {
  private static instance: GraphQLGetClient

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
    if (!GraphQLGetClient.instance) {
      GraphQLGetClient.instance = new GraphQLGetClient(url, {
        method: 'GET',
        jsonSerializer: {
          parse: JSON.parse,
          stringify: JSON.stringify,
        },
      })
    }

    return GraphQLGetClient.instance
  }
}
