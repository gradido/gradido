import 'reflect-metadata'

import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import express, { Express } from 'express'

// graphql
import { schema } from '@/graphql/schema'

import { logger as dltLogger } from './logger'
import { Logger } from 'log4js'
import cors from 'cors'
import bodyParser from 'body-parser'

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
  logger.addContext('user', 'unknown')
  logger.debug('createServer...')

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
