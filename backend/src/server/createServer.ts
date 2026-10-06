import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-express'
import { CONFIG as CORE_CONFIG } from 'core'
import { AppDatabase } from 'database'
import express, { Express, json, urlencoded } from 'express'
import { slowDown } from 'express-slow-down'
import helmet from 'helmet'
import { getLogger, Logger } from 'log4js'
import { GRADIDO_REALM } from 'shared'
import { DataSource } from 'typeorm'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { schema } from '@/graphql/schema'
import { jwks, openidConfiguration } from '@/openIDConnect'
import { elopageWebhook } from '@/webhook/elopage'
import { gmsWebhook } from '@/webhook/gms'
import { context as serverContext } from './context'
import { cors } from './cors'
import { plugins } from './plugins'
import { apiRedeemPreview, REDEEM_PREVIEW_PATH } from './redeemPreview'
import {
  apiThankYouGreetingPicture,
  THANK_YOU_GREETING_PICTURE_PATH,
} from './thankYouGreetingPicture'
import { apiVersion } from './version'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

interface ServerDef {
  apollo: ApolloServer
  app: Express
  con: DataSource
  db: AppDatabase
}

export const createServer = async (
  apolloLogger: Logger,
  context: any = serverContext,
): Promise<ServerDef> => {
  const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.createServer`)
  logger.debug('createServer...')

  // open mariadb connection, retry connecting with mariadb
  // check for correct database version
  // retry max CONFIG.DB_CONNECT_RETRY_COUNT times, wait CONFIG.DB_CONNECT_RETRY_DELAY ms between tries
  const db = AppDatabase.getInstance()
  await db.init()

  // Express Server
  const app = express()

  // cors
  app.use(cors)

  // Helmet helps secure Express apps by setting HTTP response headers.

  app.use(helmet())

  // rate limiter/ slow down to many requests
  const limiter = slowDown({
    windowMs: 1000, // 1 second
    delayAfter: 10, // Allow 10 requests per 1 second.
    delayMs: (hits) => hits * 50, // Add 100 ms of delay to every request after the 10th one.
    /**
     * So:
     *
     * - requests 1-10 are not delayed.
     * - request 11 is delayed by 550ms
     * - request 12 is delayed by 600ms
     * - request 13 is delayed by 650ms
     *
     * and so on. After 1 seconds, the delay is reset to 0.
     */
  })
  app.use(limiter)
  // because of nginx proxy, needed for limiter
  app.set('trust proxy', 1)

  // bodyparser json
  app.use(json())
  // bodyparser urlencoded for elopage
  app.use(urlencoded({ extended: true }))

  // Elopage Webhook

  app.post('/hook/elopage/' + CONFIG.WEBHOOK_ELOPAGE_SECRET, elopageWebhook)

  // GMS Webhook

  app.get('/hook/gms/' + CONFIG.GMS_WEBHOOK_SECRET, gmsWebhook)

  // OpenID Connect
  app.get(`/realms/${GRADIDO_REALM}/.well-known/openid-configuration`, openidConfiguration)
  app.get(`/realms/${GRADIDO_REALM}/protocol/openid-connect/certs`, jwks)

  // Build version — lets a backend-only deploy be verified from outside (the frontend/
  // admin bundle hashes only track their own builds). Public, read-only, no secrets.
  app.get('/api/version', apiVersion)

  // The picture of a thank-you greeting, for whoever holds the code of an OPEN link -- public
  // like the page of the link itself, a plain image for an <img>. Behind the limiter above and
  // nginx's own for /api; it has none of its own. Mounted with `use`: everything below the
  // address is its own to answer, before Apollo, which stands under `/`.
  app.use(THANK_YOU_GREETING_PICTURE_PATH, apiThankYouGreetingPicture)

  // What a messenger is shown of a redeem link: a small document with the title and the
  // picture of an OPEN link, for whoever holds its code -- public like the page of the link
  // itself. Behind the same two limiters, mounted the same way and for the same reason.
  app.use(REDEEM_PREVIEW_PATH, apiRedeemPreview)

  // Apollo Server
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
  apollo.applyMiddleware({ app, path: '/' })
  logger.info(
    `running with PRODUCTION=${CONFIG.PRODUCTION}, sending EMAIL enabled=${CORE_CONFIG.EMAIL} and EMAIL_TEST_MODUS=${CORE_CONFIG.EMAIL_TEST_MODUS} ...`,
  )
  logger.debug('createServer...successful')

  return { apollo, app, con: db.getDataSource(), db }
}
