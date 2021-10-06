import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import cors from './server/cors'
import context from './server/context'
import plugins from './server/plugins'
import CONFIG from './config'

// graphql
import schema from './graphql/schema'

const createTestServer = async () => {
  // Express Server
  const server = express()

  // cors
  server.use(cors)
  
  // Apollo Server
  const apollo = new ApolloServer({
    schema: await schema(),
    playground: CONFIG.GRAPHIQL,
    context,
    plugins,
  })
  apollo.applyMiddleware({ app: server })
  return apollo
}

export default createTestServer
