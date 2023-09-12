import 'reflect-metadata'
import { DataSource as DBDataSource } from '@dbTools/typeorm'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import express, { Express } from 'express'

// graphql
import { schema } from '@/graphql/schema'
import { DataSource } from '@/typeorm/DataSource'
import { checkDBVersion } from '@/typeorm/DBVersion'

import { logger as dltLogger } from './logger'
import { Logger } from 'log4js'
import cors from 'cors'
import bodyParser from 'body-parser'
import { CONFIG } from '@/config'

type ServerDef = { apollo: ApolloServer; app: Express; con: DBDataSource }

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

  // open mysql connection
  try {
    await DataSource.initialize()
  } catch (error) {
    // try and catch for logging
    logger.fatal(`Couldn't open connection to database!`)
    throw error
  }

  // check for correct database version
  const dbVersion = await checkDBVersion(CONFIG.DB_VERSION)
  if (!dbVersion) {
    logger.fatal('Fatal: Database Version incorrect')
    throw new Error('Fatal: Database Version incorrect')
  }

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

  return { apollo, app, con: DataSource }
}

export default createServer
