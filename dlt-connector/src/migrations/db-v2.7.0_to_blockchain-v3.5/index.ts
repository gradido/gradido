import { bootstrap } from './bootstrap'
import { onShutdown } from '../../../../shared/src/helper/onShutdown'
import { syncDbWithBlockchainContext } from './interaction/syncDbWithBlockchain/syncDbWithBlockchain.context'
import { exportAllCommunities } from './binaryExport'
import { Filter } from 'gradido-blockchain-js'

const BATCH_SIZE = 100

async function main() {
  // prepare in memory blockchains
  const context = await bootstrap()
  onShutdown(async (reason, error) => {
    context.logger.info(`shutdown reason: ${reason}`)
    if(error) {
      context.logger.error(error)
    }
  })
  
  // synchronize to in memory blockchain
  await syncDbWithBlockchainContext(context, BATCH_SIZE)

  // write as binary file for GradidoNode
  exportAllCommunities(context, BATCH_SIZE)

  // log runtime statistics
  context.logRuntimeStatistics()

  // needed because of shutdown handler (TODO: fix shutdown handler)
  process.exit(0)
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: maybe logger isn't initialized here
  console.error(e)
  process.exit(1)
})