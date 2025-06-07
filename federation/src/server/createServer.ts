import 'reflect-metadata'

import { ApolloServer } from 'apollo-server-express'
import express, { Express } from 'express'

// server
import cors from './cors'
// import serverContext from './context'
import { plugins } from './plugins'

// graphql
import { schema } from '@/graphql/schema'

// webhooks
// import { elopageWebhook } from '@/webhook/elopage'

import { AppDatabase } from 'database'
import { slowDown } from 'express-slow-down'
import helmet from 'helmet'
import { Logger } from 'log4js'
import { DataSource } from 'typeorm'
import { apolloLogger } from './logger'
// i18n
// import { i18n } from './localization'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

type ServerDef = { apollo: ApolloServer; app: Express; con: DataSource }

export const createServer = async (
  // context: any = serverContext,
  logger: Logger = apolloLogger,
  // localization: i18n.I18n = i18n,
): Promise<ServerDef> => {
  logger.addContext('user', 'unknown')
  logger.debug('createServer...')

  // open mysql connection
  const db = AppDatabase.getInstance()
  await db.init()

  // Express Server
  const app = express()

  // cors
  app.use(cors)

  // Helmet helps secure Express apps by setting HTTP response headers.
  app.use(helmet())

  // rate limiter/ slow down to many requests
  const limiter = slowDown({
    windowMs: 1000, // 1 second
    delayAfter: 10, // Allow 10 requests per 1 second.
    delayMs: (hits) => hits * 50, // Add 100 ms of delay to every request after the 10th one.
    /**
     * So:
     *
     * - requests 1-10 are not delayed.
     * - request 11 is delayed by 550ms
     * - request 12 is delayed by 600ms
     * - request 13 is delayed by 650ms
     *
     * and so on. After 1 seconds, the delay is reset to 0.
     */
  })
  app.use(limiter)
  // because of nginx proxy, needed for limiter
  app.set('trust proxy', 1)

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

  return { apollo, app, con: db.getDataSource() }
}
