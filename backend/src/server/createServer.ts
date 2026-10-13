import { node } from '@elysia/node'
import { CONFIG as CORE_CONFIG } from 'core'
import { type AnyElysia, Elysia, status } from 'elysia'
import { helmet } from 'elysia-helmet'
import { getLogger, Logger } from 'log4js'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { openIdConnectRoutes } from '@/openIDConnect'
import { elopageWebhookRoutes } from '@/webhook/elopage'
import { gmsWebhookRoutes } from '@/webhook/gms'
import { context as serverContext } from './context'
import { cors } from './cors'
import { ApolloServerDef, createApolloServer } from './createApolloServer'
import { redeemPreviewRoutes } from './redeemPreview'
import { thankYouGreetingPictureRoutes } from './thankYouGreetingPicture'
import { versionRoutes } from './version'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

// What express.json() accepted at most.
const MAX_REQUEST_BODY_SIZE = 100 * 1024

// The address nginx hands on unchanged, and the one wallet and admin ask at.
const GRAPHQL_PATH = '/graphql'

interface ServerDef extends ApolloServerDef {
  app: AnyElysia
}

export async function createServer(apolloLogger: Logger): Promise<ServerDef> {
  const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.createServer`)
  logger.debug('createServer...')

  // the database connection and Apollo on it
  const { apollo, con, db } = await createApolloServer(apolloLogger)

  // Elysia Server, on node
  const app = new Elysia({ adapter: node() })
    .use(cors)

    // Helmet helps secure Elysia apps by setting HTTP response headers.
    // Without originAgentCluster: elysia-helmet 3.1.0 writes its value into
    // Cross-Origin-Resource-Policy instead (tobias-kaerst-software/elysia-helmet#12).
    .use(
      helmet({
        originAgentCluster: false,
        crossOriginEmbedderPolicy: true,
      }),
    )

    // A body is measured by the length it announces, so one that announces none (chunked) is
    // not taken: caps on what one request may ask for count on this limit
    // (data/MemberAvatars.logic.ts). nginx in front buffers a request and names its length.
    .onRequest(({ request }) => {
      if (request.headers.has('transfer-encoding')) {
        return status(411)
      }
      if (Number(request.headers.get('content-length')) > MAX_REQUEST_BODY_SIZE) {
        return status(413)
      }
    })

    // What a route throws is written to the log and answered without its message: Elysia on
    // its own would send the message to whoever asked. A request that fits no route or no
    // schema keeps Elysia's answer.
    .onError(({ code, error }) => {
      if (code === 'UNKNOWN' || code === 'INTERNAL_SERVER_ERROR') {
        logger.error('request failed', error)
        return status(500, 'Internal Server Error')
      }
    })

    // Elopage Webhook
    .use(elopageWebhookRoutes)

    // GMS Webhook
    .use(gmsWebhookRoutes)

    // OpenID Connect
    .use(openIdConnectRoutes)

    // Build version — lets a backend-only deploy be verified from outside (the frontend/
    // admin bundle hashes only track their own builds). Public, read-only, no secrets.
    .use(versionRoutes)

    // The picture of a thank-you greeting, for whoever holds the code of an OPEN link -- public
    // like the page of the link itself, a plain image for an <img>. Behind nginx's limiter for
    // /api; it has none of its own.
    .use(thankYouGreetingPictureRoutes)

    // What a messenger is shown of a redeem link: a small document with the title and the
    // picture of an OPEN link, for whoever holds its code -- public like the page of the link
    // itself. Behind the same limiter.
    .use(redeemPreviewRoutes)

    // Apollo Server, started by the plugin and answering a POST. One context per HTTP request.
    .use(
      await apollo.createHandler({
        path: GRAPHQL_PATH,
        enablePlayground: false,
        // the plugin types the argument as the context it returns; it hands on Elysia's own
        context: async (elysiaContext) =>
          serverContext(elysiaContext as unknown as { request: Request }),
      }),
    )
    // The plugin answers a GET with a landing page of its own, whatever Apollo's plugins say.
    .get(GRAPHQL_PATH, () => status(404))
  logger.info(
    `running with PRODUCTION=${CONFIG.PRODUCTION}, sending EMAIL enabled=${CORE_CONFIG.EMAIL} and EMAIL_TEST_MODUS=${CORE_CONFIG.EMAIL_TEST_MODUS} ...`,
  )
  logger.debug('createServer...successful')

  return { apollo, app, con, db }
}
