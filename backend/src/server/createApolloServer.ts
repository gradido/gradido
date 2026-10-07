// AI-GENERATED — not an architecture reference
import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import { AppDatabase } from 'database'
import { Logger } from 'log4js'
import { DataSource } from 'typeorm'
import { schema } from '@/graphql/schema'
import { Context } from './context'
import { plugins } from './plugins'

export interface ApolloServerDef {
  apollo: ApolloServer<Context>
  con: DataSource
  db: AppDatabase
}

/**
 * The database connection and the started Apollo Server on it, without anything of HTTP:
 * what createServer mounts into Express, and all a test needs that only runs operations
 * (`apollo.executeOperation`). The context is no part of it any more: Apollo Server 5 is
 * handed one with each request, by the middleware or by whoever runs an operation.
 */
export const createApolloServer = async (apolloLogger: Logger): Promise<ApolloServerDef> => {
  // open mariadb connection, retry connecting with mariadb
  // check for correct database version
  // retry max CONFIG.DB_CONNECT_RETRY_COUNT times, wait CONFIG.DB_CONNECT_RETRY_DELAY ms between tries
  const db = AppDatabase.getInstance()
  await db.init()

  const apollo = new ApolloServer<Context>({
    schema: await schema(),
    introspection: false,
    // Without it a browser would be shown Apollo's own landing page instead of nothing.
    plugins: [...plugins, ApolloServerPluginLandingPageDisabled()],
    logger: apolloLogger,
  })
  await apollo.start()

  return { apollo, con: db.getDataSource(), db }
}
