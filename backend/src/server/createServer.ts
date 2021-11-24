/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import 'reflect-metadata'
import 'module-alias/register'

import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import bodyParser from 'body-parser'

// database
import connection from '../typeorm/connection'
import getDBVersion from '../typeorm/getDBVersion'

// server
import cors from './cors'
import serverContext from './context'
import plugins from './plugins'

// config
import CONFIG from '../config'

// graphql
import schema from '../graphql/schema'

// webhooks
import { elopageWebhook } from '../webhook/elopage'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

const DB_VERSION = '0004-login_server_data'

const createServer = async (context: any = serverContext): Promise<any> => {
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
  const app = express()

  // cors
  app.use(cors)

  // bodyparser
  app.use(bodyParser.json())

  // Elopage Webhook
  app.post('/hook/elopage/' + CONFIG.WEBHOOK_ELOPAGE_SECRET, elopageWebhook)

  // Apollo Server
  const apollo = new ApolloServer({
    schema: await schema(),
    playground: CONFIG.GRAPHIQL,
    context,
    plugins,
  })
  apollo.applyMiddleware({ app })
  return { apollo, app, con }
}

export default createServer
