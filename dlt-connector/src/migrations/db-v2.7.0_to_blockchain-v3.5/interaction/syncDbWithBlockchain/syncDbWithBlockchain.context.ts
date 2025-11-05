import { Context } from '../../Context'
import { Profiler } from 'gradido-blockchain-js'
import { TransactionsSyncRole } from './TransactionsSync.role'
import { DeletedTransactionLinksSyncRole } from './DeletedTransactionLinksSync.role'
import { TransactionLinksSyncRole } from './TransactionLinksSync.role'
import { UsersSyncRole } from './UsersSync.role'

export async function syncDbWithBlockchainContext(context: Context, batchSize: number) {
  const timeUsed = new Profiler()
  const containers = [
    new UsersSyncRole(context),
    new TransactionsSyncRole(context),
    new DeletedTransactionLinksSyncRole(context),
    new TransactionLinksSyncRole(context)
  ] 

  while (true) {    
    timeUsed.reset()    
    const results = await Promise.all(containers.map(c => c.ensureFilled(batchSize)))    
    const loadedItemsCount = results.reduce((acc, c) => acc + c, 0)
    // log only, if at least one new item was loaded
    if (loadedItemsCount && context.logger.isInfoEnabled()) {
      context.logger.info(`${loadedItemsCount} new items loaded from db in ${timeUsed.string()}`)
    }
    
    // remove empty containers
    const available = containers.filter(c => !c.isEmpty())
    if (available.length === 0) {
      break
    }

    // sort by date, to ensure container on index 0 is the one with the smallest date
    if (available.length > 0) {
      available.sort((a, b) => a.getDate().getTime() - b.getDate().getTime())
    }
    await available[0].toBlockchain()
  }
}
  
