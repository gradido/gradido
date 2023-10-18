/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/unbound-method */
import { ApolloServer } from 'apollo-server-express'
import express, { Express, json, urlencoded } from 'express'
import { GraphQLSchema } from 'graphql'
import { Logger } from 'log4js'

import { CONFIG } from '@/config'

import { context as serverContext } from './context'
import { cors } from './cors'
import { i18n } from './localization'
import { plugins } from './plugins'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

interface ServerDef {
  apollo: ApolloServer
  app: Express
}

export const createServer = (
  logger: Logger,
  schema: GraphQLSchema,
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any = serverContext,
  localization: i18n.I18n = i18n,
): ServerDef => {
  logger.addContext('user', 'unknown')
  logger.debug('createServer...', name)

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

  // Apollo Server
  const apollo = new ApolloServer({
    schema,
    playground: CONFIG.GRAPHIQL,
    introspection: CONFIG.GRAPHIQL,
    context,
    plugins,
    logger,
  })
  apollo.applyMiddleware({ app, path: '/' })
  logger.debug('createServer...successful', name)

  return { apollo, app }
}
