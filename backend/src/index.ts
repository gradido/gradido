import 'reflect-metadata'
import express from 'express'
import { buildSchema } from 'type-graphql'
import { ApolloServer } from 'apollo-server-express'
import { RowDataPacket } from 'mysql2/promise'

import connection from './database/connection'
import CONFIG from './config'

// TODO move to extern
import { UserResolver } from './graphql/resolvers/UserResolver'
import { BalanceResolver } from './graphql/resolvers/BalanceResolver'
import { GdtResolver } from './graphql/resolvers/GdtResolver'
import { TransactionResolver } from './graphql/resolvers/TransactionResolver'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

const DB_VERSION = '0001-init_db'

async function main() {
  // check for correct database version
  const con = await connection()
  const [rows] = await con.query(`SELECT * FROM migrations ORDER BY version DESC LIMIT 1;`)
  if (
    (<RowDataPacket>rows).length === 0 ||
    !(<RowDataPacket>rows)[0].fileName ||
    (<RowDataPacket>rows)[0].fileName.indexOf(DB_VERSION) === -1
  ) {
    throw new Error(`Wrong database version - the backend requires '${DB_VERSION}'`)
  }

  // const connection = await createConnection()
  const schema = await buildSchema({
    resolvers: [UserResolver, BalanceResolver, TransactionResolver, GdtResolver],
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

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
