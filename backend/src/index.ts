import { schema as federationSchema } from '@/federation/server/schema'
import { schema } from '@/graphql/schema'
import { checkDBVersion } from '@/typeorm/DBVersion'

import { CONFIG } from './config'
import { startValidateCommunities } from './federation/validateCommunities'
import { createServer } from './server/createServer'
import { apolloLogger, federationLogger } from './server/logger'
import { Connection } from './typeorm/connection'
import { elopageWebhook } from './webhook/elopage'

async function main() {
  // open mysql connection
  const con = await Connection.getInstance()
  if (!con?.isConnected) {
    apolloLogger.fatal(`Couldn't open connection to database!`)
    throw new Error(`Fatal: Couldn't open connection to database`)
  }

  // check for correct database version
  const dbVersion = await checkDBVersion(CONFIG.DB_VERSION)
  if (!dbVersion) {
    apolloLogger.fatal('Fatal: Database Version incorrect')
    throw new Error('Fatal: Database Version incorrect')
  }

  const { app } = createServer(apolloLogger, await schema(), 'backend')
  // Elopage Webhook
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.post('/hook/elopage/' + CONFIG.WEBHOOK_ELOPAGE_SECRET, elopageWebhook)

  apolloLogger.info(
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    `running with PRODUCTION=${CONFIG.PRODUCTION}, sending EMAIL enabled=${CONFIG.EMAIL} and EMAIL_TEST_MODUS=${CONFIG.EMAIL_TEST_MODUS} ...`,
  )

  app.listen(CONFIG.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running at http://localhost:${CONFIG.PORT}`)
    if (CONFIG.GRAPHIQL) {
      // eslint-disable-next-line no-console
      console.log(`GraphIQL available at http://localhost:${CONFIG.PORT}`)
    }
  })
  // start federation server
  const apiVersions = CONFIG.FEDERATION_PORTS_APIS.split(',')
  await Promise.all(
    apiVersions.map(async (apiVersion: string) => {
      const [port, apiVersionString] = apiVersion.split(':')
      const { app } = createServer(
        federationLogger,
        await federationSchema(apiVersionString),
        'federation api ' + apiVersionString,
        undefined,
      )
      app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(
          `Federation Server with version ${apiVersionString} is running at http://localhost:${port}`,
        )
        if (CONFIG.GRAPHIQL) {
          // eslint-disable-next-line no-console
          console.log(`GraphIQL available at http://localhost:${port}`)
        }
      })
    }),
  )

  void startValidateCommunities(Number(CONFIG.FEDERATION_VALIDATE_COMMUNITY_TIMER))
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  throw e
})
