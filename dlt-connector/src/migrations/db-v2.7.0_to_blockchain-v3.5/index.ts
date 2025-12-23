import * as v from 'valibot'
import { onShutdown } from '../../../../shared/src/helper/onShutdown'
import { uuidv4Schema } from '../../schemas/typeGuard.schema'
import { exportAllCommunities } from './binaryExport'
import { bootstrap } from './bootstrap'
import { syncDbWithBlockchainContext } from './interaction/syncDbWithBlockchain/syncDbWithBlockchain.context'

const BATCH_SIZE = 500

async function main() {
  // prepare in memory blockchains
  const context = await bootstrap()
  onShutdown(async (reason, error) => {
    context.logger.info(`shutdown reason: ${reason}`)
    if (error) {
      context.logger.error(error)
    }
  })

  // synchronize to in memory blockchain
  try {
    await syncDbWithBlockchainContext(context, BATCH_SIZE)
  } catch(e) {
    console.error(e)
    //context.logBlogchain(v.parse(uuidv4Schema, 'e70da33e-5976-4767-bade-aa4e4fa1c01a'))
  }

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
