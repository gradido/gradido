import { 
  InMemoryBlockchain, 
  Filter,
  SearchDirection_ASC,
  Profiler
} from 'gradido-blockchain-js'
import { Logger } from 'log4js'
import { bootstrap } from './bootstrap'
import { heapStats } from 'bun:jsc'
import { onShutdown } from '../../../../shared/src/helper/onShutdown'
import { syncDbWithBlockchainContext } from './interaction/syncDbWithBlockchain/syncDbWithBlockchain.context'


async function main() {
  const timeUsed = new Profiler()
  // prepare in memory blockchains
  const context = await bootstrap()
  onShutdown(async (reason, error) => {
    context.logger.info(`shutdown reason: ${reason}`)
    if(error) {
      context.logger.error(error)
    }
  })
  
  // synchronize to blockchain
  const BATCH_SIZE = 100

  try {
    await syncDbWithBlockchainContext(context, BATCH_SIZE)
  } catch (e) {
    console.error(e)
    throw e
  }
  context.logger.info(`${timeUsed.string()} for synchronizing to blockchain`)
  const runtimeStats = heapStats()
  context.logger.info(
    `Memory Statistics: heap size: ${bytesToMbyte(runtimeStats.heapSize)} MByte, heap capacity: ${bytesToMbyte(runtimeStats.heapCapacity)} MByte, extra memory: ${bytesToMbyte(runtimeStats.extraMemorySize)} MByte`
  )
  // needed because of shutdown handler (TODO: fix shutdown handler)
  process.exit(0)
}

function bytesToMbyte(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(4)
}

function logBlogchain(logger: Logger, blockchain: InMemoryBlockchain) {
  const f = new Filter()  
  f.pagination.size = 0
  f.searchDirection = SearchDirection_ASC
    
  const transactions = blockchain.findAll(f)
  for(let i = 0; i < transactions.size(); i++) {
    const transaction = transactions.get(i)
    const confirmedTransaction = transaction?.getConfirmedTransaction()
    logger.info(confirmedTransaction?.toJson(true))
  }
}


main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: maybe logger isn't initialized here
  console.error(e)
  process.exit(1)
})