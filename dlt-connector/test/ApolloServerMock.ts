import { ApolloServer } from '@apollo/server'
import { addMocksToSchema } from '@graphql-tools/mock'

import { schema } from '@/graphql/schema'

let apolloTestServer: ApolloServer

export async function createApolloTestServer() {
  if (apolloTestServer === undefined) {
    apolloTestServer = new ApolloServer({
      // addMocksToSchema accepts a schema instance and provides
      // mocked data for each field in the schema
      schema: addMocksToSchema({
        schema: await schema(),
        preserveResolvers: true,
      }),
    })
  }
  return apolloTestServer
}
