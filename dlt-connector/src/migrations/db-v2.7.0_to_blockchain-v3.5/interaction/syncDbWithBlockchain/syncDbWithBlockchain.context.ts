import { Profiler } from 'gradido-blockchain-js'
import { Context } from '../../Context'
import { ContributionLinkTransactionSyncRole } from './ContributionLinkTransactionSync.role'
import { DeletedTransactionLinksSyncRole } from './DeletedTransactionLinksSync.role'
import { InvalidContributionTransactionSyncRole } from './InvalidContributionTransactionSync.role'
import { TransactionLinksSyncRole } from './TransactionLinksSync.role'
import { TransactionsSyncRole } from './TransactionsSync.role'
import { UsersSyncRole } from './UsersSync.role'

export async function syncDbWithBlockchainContext(context: Context, batchSize: number) {
  const timeUsedDB = new Profiler()
  const timeUsedBlockchain = new Profiler()
  const timeUsedAll = new Profiler()
  const containers = [
    new UsersSyncRole(context),
    new TransactionsSyncRole(context),
    new DeletedTransactionLinksSyncRole(context),
    new TransactionLinksSyncRole(context),
    new InvalidContributionTransactionSyncRole(context),
    new ContributionLinkTransactionSyncRole(context),
  ]
  let transactionsCount = 0
  let transactionsCountSinceLastLog = 0
  let available = containers
  while (true) {
    timeUsedDB.reset()
    const results = await Promise.all(available.map((c) => c.ensureFilled(batchSize)))
    const loadedItemsCount = results.reduce((acc, c) => acc + c, 0)
    // log only, if at least one new item was loaded
    if (loadedItemsCount && context.logger.isDebugEnabled()) {
      context.logger.debug(`${loadedItemsCount} new items loaded from db in ${timeUsedDB.string()}`)      
    }

    // remove empty containers
    available = available.filter((c) => !c.isEmpty())
    if (available.length === 0) {
      break
    }

    // sort by date, to ensure container on index 0 is the one with the smallest date
    if (available.length > 0) {
      available.sort((a, b) => a.getDate().getTime() - b.getDate().getTime())
    }
    await available[0].toBlockchain()
    process.stdout.write(`successfully added to blockchain: ${transactionsCount}\r`)
    transactionsCount++
    transactionsCountSinceLastLog++
    if (transactionsCountSinceLastLog >= batchSize) {
      context.logger.debug(`${transactionsCountSinceLastLog} transactions added to blockchain in ${timeUsedBlockchain.string()}`)
      timeUsedBlockchain.reset()
      transactionsCountSinceLastLog = 0
    }
  }
  process.stdout.write(`\n`)
  context.logger.info(`Synced ${transactionsCount} transactions to blockchain in ${(timeUsedAll.seconds() / 60).toFixed(2)} minutes`)
  context.logger.info(`Invalid contribution transactions: ${InvalidContributionTransactionSyncRole.allTransactionIds.length}`)
  if (context.logger.isDebugEnabled()) {
    context.logger.debug(InvalidContributionTransactionSyncRole.allTransactionIds.join(', '))
  }
  context.logger.info(`Double linked transactions: ${TransactionsSyncRole.doubleTransactionLinkCodes.length}`)
  if (context.logger.isDebugEnabled()) {
    context.logger.debug(TransactionsSyncRole.doubleTransactionLinkCodes.join(', '))
  }
}
