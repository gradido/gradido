import { ApolloServer } from 'apollo-server-express'
import express, { Express, json, urlencoded } from 'express'
import { slowDown } from 'express-slow-down'
import helmet from 'helmet'
import { Logger } from 'log4js'
import { Connection as DbConnection } from 'typeorm'

import { CONFIG } from '@/config'
import { schema } from '@/graphql/schema'
import { checkDBVersionUntil } from '@/typeorm/DBVersion'
import { elopageWebhook } from '@/webhook/elopage'
import { gmsWebhook } from '@/webhook/gms'

import { context as serverContext } from './context'
import { cors } from './cors'
import { i18n } from './localization'
import { apolloLogger } from './logger'
import { plugins } from './plugins'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

interface ServerDef {
  apollo: ApolloServer
  app: Express
  con: DbConnection
}

export const createServer = async (
  context: any = serverContext,
  logger: Logger = apolloLogger,
  localization: i18n.I18n = i18n,
): Promise<ServerDef> => {
  logger.addContext('user', 'unknown')
  logger.debug('createServer...')

  // open mariadb connection, retry connecting with mariadb
  // check for correct database version
  // retry max CONFIG.DB_CONNECT_RETRY_COUNT times, wait CONFIG.DB_CONNECT_RETRY_DELAY ms between tries
  const con = await checkDBVersionUntil(
    CONFIG.DB_CONNECT_RETRY_COUNT,
    CONFIG.DB_CONNECT_RETRY_DELAY_MS,
  )

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
  app.use(json())
  // bodyparser urlencoded for elopage
  app.use(urlencoded({ extended: true }))

  // i18n
  app.use(localization.init)

  // Elopage Webhook

  app.post('/hook/elopage/' + CONFIG.WEBHOOK_ELOPAGE_SECRET, elopageWebhook)

  // GMS Webhook

  app.get('/hook/gms/' + CONFIG.GMS_WEBHOOK_SECRET, gmsWebhook)

  // Apollo Server
  const apollo = new ApolloServer({
    schema: await schema(),
    playground: CONFIG.GRAPHIQL,
    introspection: CONFIG.GRAPHIQL,
    context,
    plugins,
    logger,
  })
  apollo.applyMiddleware({ app, path: '/' })
  logger.info(
    `running with PRODUCTION=${CONFIG.PRODUCTION}, sending EMAIL enabled=${CONFIG.EMAIL} and EMAIL_TEST_MODUS=${CONFIG.EMAIL_TEST_MODUS} ...`,
  )
  logger.debug('createServer...successful')

  return { apollo, app, con }
}
