import 'reflect-metadata'
import express from 'express'
import { buildSchema } from 'type-graphql'
import { ApolloServer } from 'apollo-server-express'
// import { createConnection } from 'typeorm'
import CONFIG from './config'

// TODO move to extern
// import { BookResolver } from './graphql/resolvers/BookResolver'
import { UserResolver } from './graphql/resolvers/UserResolver'
// import { GroupResolver } from './graphql/resolvers/GroupResolver'
// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

async function main() {
  // const connection = await createConnection()
  const schema = await buildSchema({
    resolvers: [/* BookResolver , GroupResolver, */ UserResolver],
  })

  // Graphiql interface
  let playground = false
  if (CONFIG.GRAPHIQL) {
    playground = true
  }

  // Express Server
  const server = express()

  // Apollo Server
  const apollo = new ApolloServer({ schema, playground })
  apollo.applyMiddleware({ app: server })

  // Start Server
  server.listen(CONFIG.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running at http://localhost:${CONFIG.PORT}`)
    if (CONFIG.GRAPHIQL) {
      // eslint-disable-next-line no-console
      console.log(`GraphIQL available at http://localhost:${CONFIG.PORT}/graphql`)
    }
  })
}

main()
