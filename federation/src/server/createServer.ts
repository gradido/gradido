import 'reflect-metadata'

import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import { ElysiaApolloServer } from '@elysia/apollo'
import { AppDatabase } from 'database'
import { type AnyElysia, Elysia, status } from 'elysia'
import { helmet } from 'elysia-helmet'
import { Logger } from 'log4js'
import { DataSource } from 'typeorm'
// graphql
import { schema } from '@/graphql/schema'
// server
import { cors } from './cors'
// import serverContext from './context'
import { plugins } from './plugins'

// i18n
// import { i18n } from './localization'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

// What express.json() accepted at most; Bun on its own would take 128 MB.
const MAX_REQUEST_BODY_SIZE = 100 * 1024

type ServerDef = { apollo: ApolloServer; app: AnyElysia; con: DataSource }

export const createServer = async (
  // context: any = serverContext,
  apolloLogger: Logger,
  // localization: i18n.I18n = i18n,
): Promise<ServerDef> => {
  // open mysql connection
  const db = AppDatabase.getInstance()
  await db.init()

  // Apollo Server
  const apollo = new ElysiaApolloServer({
    schema: await schema(),
    // Without it a browser would be shown Apollo's own landing page instead of nothing.
    plugins: [...plugins, ApolloServerPluginLandingPageDisabled()],
    logger: apolloLogger,
  })

  // Elysia Server
  const app = new Elysia({ serve: { maxRequestBodySize: MAX_REQUEST_BODY_SIZE } })
    // cors
    .use(cors)
    // Helmet helps secure Elysia apps by setting HTTP response headers.
    // Without originAgentCluster: elysia-helmet 3.1.0 writes its value into
    // Cross-Origin-Resource-Policy instead (tobias-kaerst-software/elysia-helmet#12).
    .use(helmet({ originAgentCluster: false }))
    // starts apollo and answers a POST with it
    .use(await apollo.createHandler({ path: '/', enablePlayground: false }))
    // The plugin answers a GET with a landing page of its own, whatever the plugins above say.
    .get('/', () => status(404))
  return { apollo, app, con: db.getDataSource() }
}
