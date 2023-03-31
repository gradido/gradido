/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/unbound-method */
import { Connection } from '@dbTools/typeorm'
import { ApolloServer } from 'apollo-server-express'
import express, { Express, json, urlencoded } from 'express'
import { Logger } from 'log4js'
import { checkDBVersion } from '@/typeorm/DBVersion'
import { cors } from './cors'
import { context as serverContext } from './context'
import { plugins } from './plugins'
import { apolloLogger } from './logger'
import { i18n } from './localization'
import { connection } from '@/typeorm/connection'
import { CONFIG } from '@/config'
import { schema } from '@/graphql/schema'
import { elopageWebhook } from '@/webhook/elopage'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

type ServerDef = { apollo: ApolloServer; app: Express; con: Connection }

export const createServer = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any = serverContext,
  logger: Logger = apolloLogger,
  localization: i18n.I18n = i18n,
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
  app.use(json())
  // bodyparser urlencoded for elopage
  app.use(urlencoded({ extended: true }))

  // i18n
  app.use(localization.init)

  // Elopage Webhook
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.post('/hook/elopage/' + CONFIG.WEBHOOK_ELOPAGE_SECRET, elopageWebhook)

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
