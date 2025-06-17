import 'reflect-metadata'

import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Express } from 'express'
// graphql
import { slowDown } from 'express-slow-down'
import helmet from 'helmet'
import { Logger } from 'log4js'

import { schema } from '@/graphql/schema'
import { logger as dltLogger } from '@/logging/logger'
import { Connection } from '@/typeorm/DataSource'

type ServerDef = { apollo: ApolloServer; app: Express }

interface MyContext {
  token?: string
}

const createServer = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // context: any = serverContext,
  logger: Logger = dltLogger,
  // localization: i18n.I18n = i18n,
): Promise<ServerDef> => {
  logger.debug('createServer...')

  // connect to db and test db version
  await Connection.getInstance().init()
  // Express Server
  const app = express()

  // Apollo Server
  const apollo = new ApolloServer<MyContext>({
    schema: await schema(),
    introspection: true,
    // context,
    // plugins
    logger,
  })
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

  await apollo.start()
  app.use(
    '/',
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    expressMiddleware(apollo, {
      context: async ({ req }) => ({ token: req.headers.token }),
    }),
  )
  logger.debug('createServer...successful')

  return { apollo, app }
}

export default createServer
