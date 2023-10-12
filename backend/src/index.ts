import { Community } from '@entity/Community'

import { DltConnectorClient } from './apis/DltConnectorClient'
import { CONFIG } from './config'
import { startValidateCommunities } from './federation/validateCommunities'
import { createServer } from './server/createServer'
import { backendLogger } from './server/logger'

async function main() {
  const { app } = await createServer()

  app.listen(CONFIG.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running at http://localhost:${CONFIG.PORT}`)
    if (CONFIG.GRAPHIQL) {
      // eslint-disable-next-line no-console
      console.log(`GraphIQL available at http://localhost:${CONFIG.PORT}`)
    }
  })
  const dlt = DltConnectorClient.getInstance()
  if (dlt) {
    if (!(await dlt.checkHomeCommunity())) {
      const homeCommunity = await Community.findOneOrFail({ where: { foreign: false } })
      await dlt.addCommunity(homeCommunity)
    } else {
      backendLogger.info('Home Community already exist on dlt-connector')
    }
  }
  void startValidateCommunities(Number(CONFIG.FEDERATION_VALIDATE_COMMUNITY_TIMER))
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  throw e
})
