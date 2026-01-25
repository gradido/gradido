import { Profiler } from 'gradido-blockchain-js'
import { Context } from '../../Context'
import { CreationsSyncRole } from './CreationsSync.role'
import { LocalTransactionsSyncRole } from './LocalTransactionsSync.role'
import { UsersSyncRole } from './UsersSync.role'
import { TransactionLinkFundingsSyncRole } from './TransactionLinkFundingsSync.role'
import { RedeemTransactionLinksSyncRole } from './RedeemTransactionLinksSync.role'
import { ContributionLinkTransactionSyncRole } from './ContributionLinkTransactionSync.role'
import { DeletedTransactionLinksSyncRole } from './DeletedTransactionLinksSync.role'
import { RemoteTransactionsSyncRole } from './RemoteTransactionsSync.role'
import { callTime } from '../../blockchain'
import { nanosBalanceForUser } from './AbstractSync.role'

export async function syncDbWithBlockchainContext(context: Context, batchSize: number) {
  const timeUsedDB = new Profiler()
  const timeUsedBlockchain = new Profiler()
  const timeUsedAll = new Profiler()
  const containers = [
    new UsersSyncRole(context),
    new CreationsSyncRole(context),
    new LocalTransactionsSyncRole(context),
    new TransactionLinkFundingsSyncRole(context),
    new RedeemTransactionLinksSyncRole(context),
    new ContributionLinkTransactionSyncRole(context),
    new DeletedTransactionLinksSyncRole(context),
    new RemoteTransactionsSyncRole(context),
  ]
  let transactionsCount = 0
  let transactionsCountSinceLastLog = 0
  let transactionsCountSinceLastPrint = 0
  let available = containers
  const isDebug = context.logger.isDebugEnabled()
  let lastPrintedCallTime = 0
  while (true) {
    timeUsedDB.reset()
    const results = await Promise.all(available.map((c) => c.ensureFilled(batchSize)))
    const loadedItemsCount = results.reduce((acc, c) => acc + c, 0)
    // log only, if at least one new item was loaded
    if (loadedItemsCount && isDebug) {
      context.logger.debug(`${loadedItemsCount} new items loaded from db in ${timeUsedDB.string()}`)      
    }

    // remove empty containers
    available = available.filter((c) => !c.isEmpty())
    if (available.length === 0) {
      break
    }

    // sort by date, to ensure container on index 0 is the one with the smallest date
    if (available.length > 1) {
      // const sortTime = new Profiler()
      available.sort((a, b) => a.getDate().getTime() - b.getDate().getTime())
      // context.logger.debug(`sorted ${available.length} containers in ${sortTime.string()}`)
    }
    available[0].toBlockchain()    
    transactionsCount++
    if (isDebug) {      
      process.stdout.write(`successfully added to blockchain: ${transactionsCount}\r`)
      transactionsCountSinceLastLog++       
      if (transactionsCountSinceLastLog >= batchSize) {
        context.logger.debug(`${transactionsCountSinceLastLog} transactions added to blockchain in ${timeUsedBlockchain.string()}`)
        context.logger.info(`Time for createAndConfirm: ${((callTime - lastPrintedCallTime) / 1000 / 1000).toFixed(2)} milliseconds`) 
        lastPrintedCallTime = callTime
        timeUsedBlockchain.reset()
        transactionsCountSinceLastLog = 0
      }
    } else {
      transactionsCountSinceLastPrint++
      if (transactionsCountSinceLastPrint >= 100) {
        process.stdout.write(`successfully added to blockchain: ${transactionsCount}\r`)
        transactionsCountSinceLastPrint = 0
      }
    }
  }
  process.stdout.write(`successfully added to blockchain: ${transactionsCount}\n`)  
  context.logger.info(`Synced ${transactionsCount} transactions to blockchain in ${timeUsedAll.string()}`)
  context.logger.info(`Time for createAndConfirm: ${(callTime / 1000 / 1000 / 1000).toFixed(2)} seconds`) 
  context.logger.info(`Time for call lastBalance of user: ${(nanosBalanceForUser / 1000 / 1000 / 1000).toFixed(2)} seconds`)
}
