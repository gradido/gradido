/* eslint-disable @typescript-eslint/no-explicit-any */

import 'reflect-metadata'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'

// config
import CONFIG from './config'

// database
import connection from './typeorm/connection'
import getDBVersion from './typeorm/getDBVersion'

// server
import cors from './server/cors'
import context from './server/context'
import plugins from './server/plugins'

// graphql
import schema from './graphql/schema'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

const DB_VERSION = '0003-add_blockchain_type.js'

async function main() {
  // open mysql connection
  const con = await connection()
  if (!con || !con.isConnected) {
    throw new Error(`Couldn't open connection to database`)
  }

  // check for correct database version
  const dbVersion = await getDBVersion()
  if (!dbVersion || dbVersion.indexOf(DB_VERSION) === -1) {
    throw new Error(
      `Wrong database version - the backend requires '${DB_VERSION}' but found '${
        dbVersion || 'None'
      }'`,
    )
  }

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

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
