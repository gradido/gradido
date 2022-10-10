import 'reflect-metadata'

import { ApolloServer } from 'apollo-server-express'
import express, { Express } from 'express'

// database
import connection from '@/typeorm/connection'
import { checkDBVersion } from '@/typeorm/DBVersion'

// server
import cors from './cors'
import serverContext from './context'
import plugins from './plugins'

// config
import CONFIG from '@/config'

// graphql
import schema from '@/graphql/schema'

// webhooks
import { elopageWebhook } from '@/webhook/elopage'
import { Connection } from '@dbTools/typeorm'

import { apolloLogger } from './logger'
import { Logger } from 'log4js'

// i18n
// Wolle: import { I18n } from 'i18n'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

type ServerDef = { apollo: ApolloServer; app: Express; con: Connection }

const createServer = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any = serverContext,
  logger: Logger = apolloLogger,
): Promise<ServerDef> => {
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

  // Elopage Webhook
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

  // i18n
  // const i18n = new I18n({
  //   locales: ['en', 'de'],
  //   directory: '/app/src/locales',
  // })
  // Wolle: const i18n = new I18n({
  //   // phrases: {},
  //   logDebugFn: logger.debug,
  //   logWarnFn: logger.info,
  //   logErrorFn: logger.error,
  //   directory: '/app/src/locales',
  //   locales: ['en', 'de'],
  //   // cookie: 'locale',
  //   // cookieOptions: {
  //   //   // Disable signed cookies in NODE_ENV=test
  //   //   signed: process.env.NODE_ENV !== 'test'
  //   // },
  //   // expiryMs: 31556952000, // one year in ms
  //   // indent: '  ',
  //   // defaultLocale: 'en',
  //   // // `process.env.I18N_SYNC_FILES`
  //   // syncFiles: true,
  //   // // `process.env.I18N_AUTO_RELOAD`
  //   // autoReload: false,
  //   // // `process.env.I18N_UPDATE_FILES`
  //   // updateFiles: true,
  //   // api: {
  //   //   __: 't',
  //   //   __n: 'tn',
  //   //   __l: 'tl',
  //   //   __h: 'th',
  //   //   __mf: 'tmf'
  //   // },
  //   // register: i18n.api,
  //   // lastLocaleField: 'last_locale',
  //   // ignoredRedirectGlobs: [],
  //   // redirectIgnoresNonGetMethods: true,
  //   // // <https://github.com/ljharb/qs>
  //   // stringify: {
  //   //   addQueryPrefix: true,
  //   //   format: 'RFC1738',
  //   //   arrayFormat: 'indices'
  //   // },
  //   // redirectTLDS: true,
  //   // // function that allows using a custom logic for locale detection (can return promise)
  //   // detectLocale: null
  // })

  return { apollo, app, con }
}

export default createServer
