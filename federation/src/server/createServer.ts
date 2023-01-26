import 'reflect-metadata'

import { ApolloServer } from 'apollo-server-express'
import express, { Express } from 'express'

// database
import connection from '@/typeorm/connection'
import { checkDBVersion } from '@/typeorm/DBVersion'

// server
import cors from './cors'
// import serverContext from './context'
import plugins from './plugins'

// config
import CONFIG from '@/config'

// graphql
import schema from '@/graphql/schema'

// webhooks
// import { elopageWebhook } from '@/webhook/elopage'
import { Connection } from '@dbTools/typeorm'

import { apolloLogger } from './logger'
import { Logger } from 'log4js'

// i18n
// import { i18n } from './localization'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

type ServerDef = { apollo: ApolloServer; app: Express; con: Connection }

const createServer = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // context: any = serverContext,
  logger: Logger = apolloLogger,
  // localization: i18n.I18n = i18n,
): Promise<ServerDef> => {
  logger.addContext('user', 'unknown')
  logger.debug('createServer...')

  // open mysql connection
  const con = await connection()
  if (!con || !con.isConnected) {
    logger.fatal(`Couldn't open connection to database!`)
    throw new Error(`Fatal: Couldn't open connection to database`)
  }

  // check for correct database version
  const dbVersion = await checkDBVersion(CONFIG.DB_VERSION)
  if (!dbVersion) {
    logger.fatal('Fatal: Database Version incorrect')
    throw new Error('Fatal: Database Version incorrect')
  }

  // Express Server
  const app = express()

  // cors
  app.use(cors)

  // bodyparser json
  app.use(express.json())
  // bodyparser urlencoded for elopage
  app.use(express.urlencoded({ extended: true }))

  // i18n
  // app.use(localization.init)

  // Elopage Webhook
  // app.post('/hook/elopage/' + CONFIG.WEBHOOK_ELOPAGE_SECRET, elopageWebhook)

  // Apollo Server
  const apollo = new ApolloServer({
    schema: await schema(),
    // playground: CONFIG.GRAPHIQL,
    // introspection: CONFIG.GRAPHIQL,
    // context,
    plugins,
    logger,
  })
  apollo.applyMiddleware({ app, path: '/' })
  logger.debug('createServer...successful')

  return { apollo, app, con }
}

export default createServer
