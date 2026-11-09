import 'reflect-metadata'

import { apiRoutes } from 'core'
import { AppDatabase } from 'database'
import { Elysia } from 'elysia'
import { helmet } from 'elysia-helmet'
import { FEDERATION_REQUEST_MAX_BYTES, FEDERATION_REQUEST_TIMEOUT_S } from 'shared'
import { blockchainNotificationRoutes } from './blockchainNotification'
import { cors } from './cors'

export const createServer = async () => {
  // open mysql connection
  await AppDatabase.getInstance().init()

  return (
    new Elysia({
      serve: {
        maxRequestBodySize: FEDERATION_REQUEST_MAX_BYTES,
        idleTimeout: FEDERATION_REQUEST_TIMEOUT_S,
      },
    })
      .use(cors)
      // Helmet helps secure Elysia apps by setting HTTP response headers.
      // Without originAgentCluster: elysia-helmet 3.1.0 writes its value into
      // Cross-Origin-Resource-Policy instead (tobias-kaerst-software/elysia-helmet#12).
      .use(helmet({ originAgentCluster: false }))
      .use(apiRoutes)
      .use(blockchainNotificationRoutes)
  )
}
