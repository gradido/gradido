// AI-GENERATED — not an architecture reference
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-express'
import { AppDatabase } from 'database'
import { Logger } from 'log4js'
import { DataSource } from 'typeorm'
import { CONFIG } from '@/config'
import { schema } from '@/graphql/schema'
import { context as serverContext } from './context'
import { plugins } from './plugins'

export interface ApolloServerDef {
  apollo: ApolloServer
  con: DataSource
  db: AppDatabase
}

/**
 * The database connection and the started Apollo Server on it, without anything of HTTP:
 * what createServer mounts into Express, and all a test needs that only runs operations
 * (`apollo.executeOperation`).
 */
export const createApolloServer = async (
  apolloLogger: Logger,
  context: any = serverContext,
): Promise<ApolloServerDef> => {
  // open mariadb connection, retry connecting with mariadb
  // check for correct database version
  // retry max CONFIG.DB_CONNECT_RETRY_COUNT times, wait CONFIG.DB_CONNECT_RETRY_DELAY ms between tries
  const db = AppDatabase.getInstance()
  await db.init()
  
  const apollo = new ApolloServer({
    schema: await schema(),
    introspection: CONFIG.GRAPHIQL,
    context,
    // Apollo Server 3 has no `playground` option any more: the page a browser is shown is a
    // plugin, and without one it would show Apollo's own landing page instead of nothing.
    plugins: [
      ...plugins,
      CONFIG.GRAPHIQL
        ? ApolloServerPluginLandingPageGraphQLPlayground()
        : ApolloServerPluginLandingPageDisabled(),
    ],
    logger: apolloLogger,
  })
  await apollo.start()

  return { apollo, con: db.getDataSource(), db }
}
