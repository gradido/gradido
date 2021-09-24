/* eslint-disable @typescript-eslint/no-explicit-any */

import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import { ApolloServer } from 'apollo-server-express'

// config
import CONFIG from './config'

// database
import connection from './typeorm/connection'
import getDBVersion from './typeorm/getDBVersion'

// graphql
import { schema } from './graphql'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

const DB_VERSION = '0001-init_db'

const context = (args: any) => {
  const authorization = args.req.headers.authorization
  let token = null
  if (authorization) {
    token = authorization.replace(/^Bearer /, '')
  }
  const context = {
    token,
    setHeaders: [],
  }
  return context
}

async function main() {
  // open mysql connection
  const con = await connection()
  if (!con.isConnected) {
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

  const corsOptions = {
    origin: '*',
    exposedHeaders: ['token'],
  }

  server.use(cors(corsOptions))

  const plugins = [
    {
      requestDidStart() {
        return {
          willSendResponse(requestContext: any) {
            const { setHeaders = [] } = requestContext.context
            setHeaders.forEach(({ key, value }: { [key: string]: string }) => {
              requestContext.response.http.headers.append(key, value)
            })
            return requestContext
          },
        }
      },
    },
  ]

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
