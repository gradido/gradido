import 'reflect-metadata'

import { ApolloServer } from 'apollo-server-express'
import express, { Express } from 'express'

// database
import connection from '@/typeorm/connection'
import { checkDBVersion } from '@/typeorm/DBVersion'
import cors from './cors'
import CONFIG from '@/config'
import schema from '@/graphql/schema'
import { Connection } from '@dbTools/typeorm'
import { apolloLogger } from './logger'
import { Logger } from 'log4js'

type ServerDef = { apollo: ApolloServer; app: Express; con: Connection }

const createServer = async (logger: Logger = apolloLogger): Promise<ServerDef> => {
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

  // Apollo Server
  const apollo = new ApolloServer({
    schema: await schema(),
    playground: CONFIG.GRAPHIQL,
    introspection: CONFIG.GRAPHIQL,
    logger,
  })
  apollo.applyMiddleware({ app, path: '/' })
  logger.debug('createServer...successful')

  return { apollo, app, con }
}

export default createServer
