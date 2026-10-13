import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled'
import { ElysiaApolloServer } from '@elysia/apollo'
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
 * The database connection and the Apollo Server on it, not started yet: createServer has the
 * Elysia plugin start it (`apollo.createHandler`), which Apollo allows only once.
 */
export async function createApolloServer(
  apolloLogger: Logger,
): Promise<ApolloServerDef & { apollo: ElysiaApolloServer<Context> }> {
  // open mariadb connection, retry connecting with mariadb
  // check for correct database version
  // retry max CONFIG.DB_CONNECT_RETRY_COUNT times, wait CONFIG.DB_CONNECT_RETRY_DELAY ms between tries
  const db = AppDatabase.getInstance()
  await db.init()

  const apollo = new ElysiaApolloServer<Context>({
    schema: await schema(),
    introspection: false,
    // Without it a browser would be shown Apollo's own landing page instead of nothing.
    plugins: [...plugins, ApolloServerPluginLandingPageDisabled()],
    logger: apolloLogger,
  })

  return { apollo, con: db.getDataSource(), db }
}
