import { Filter, Profiler, Timestamp, InteractionCreateTransactionByEvent, LedgerAnchor, Abstract } from 'gradido-blockchain-js'
import { callTime } from '../../blockchain'
import { Context } from '../../Context'
import { nanosBalanceForUser } from './AbstractSync.role'
import { ContributionLinkTransactionSyncRole } from './ContributionLinkTransactionSync.role'
import { CreationsSyncRole } from './CreationsSync.role'
import { DeletedTransactionLinksSyncRole } from './DeletedTransactionLinksSync.role'
import { LocalTransactionsSyncRole } from './LocalTransactionsSync.role'
import { RedeemTransactionLinksSyncRole } from './RedeemTransactionLinksSync.role'
import { RemoteTransactionsSyncRole } from './RemoteTransactionsSync.role'
import { TransactionLinkFundingsSyncRole } from './TransactionLinkFundingsSync.role'
import { UsersSyncRole } from './UsersSync.role'
import { CommunityContext } from '../../valibot.schema'
import { Logger } from 'log4js'

function processTransactionTrigger(context: CommunityContext, endDate: Date, logger: Logger) {
  while(true) {
    const lastTx = context.blockchain.findOne(Filter.LAST_TRANSACTION)
    let confirmedAt: Timestamp | undefined = undefined
    if (!lastTx) {
      // no transaction, no triggers
      return
    } else {
      const confirmedTx = lastTx.getConfirmedTransaction()
      if (!confirmedTx) {
        throw new Error("missing confirmed tx in transaction entry")
      }
      confirmedAt = confirmedTx.getConfirmedAt()
    }
    const triggerEvent = context.blockchain.findNextTransactionTriggerEventInRange(confirmedAt, new Timestamp(endDate))
    if (!triggerEvent) {
      // no trigger, we can exit here
      return
    }
    context.blockchain.removeTransactionTriggerEvent(triggerEvent)
    try {
      // InMemoryBlockchain extend Abstract, but between C++ -> Swig -> TypeScript it seems the info is gone, so I need to cheat a bit here
      const createTransactionByEvent = new InteractionCreateTransactionByEvent(context.blockchain as unknown as Abstract)
      if (!context.blockchain.createAndAddConfirmedTransaction(
        createTransactionByEvent.run(triggerEvent),
        new LedgerAnchor(triggerEvent.getLinkedTransactionId(), LedgerAnchor.Type_NODE_TRIGGER_TRANSACTION_ID),
        triggerEvent.getTargetDate()
      )) {
        throw new Error('Adding trigger created Transaction Failed')
      }
    } catch(e) {
      context.blockchain.addTransactionTriggerEvent(triggerEvent)
      logger.error(`Error processing transaction trigger event for transaction: ${triggerEvent.getLinkedTransactionId()}`)
      throw e
    }
  }
}

export async function syncDbWithBlockchainContext(context: Context, batchSize: number) {
  const timeUsedDB = new Profiler()
  const timeUsedBlockchain = new Profiler()
  const timeUsedAll = new Profiler()
  const timeBetweenPrints = new Profiler()
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
    const communityUuids = available[0].getCommunityUuids()
    for (let i = 0; i < communityUuids.length; ++i) {
      processTransactionTrigger(context.getCommunityContextByUuid(communityUuids[i]), available[0].getDate(), context.logger)
    }
    
    available[0].toBlockchain()
    transactionsCount++
    if (isDebug) {
      if (timeBetweenPrints.millis() > 100) {
        process.stdout.write(`successfully added to blockchain: ${transactionsCount}\r`)
        timeBetweenPrints.reset()
      }
      transactionsCountSinceLastLog++
      if (transactionsCountSinceLastLog >= batchSize) {
        context.logger.debug(
          `${transactionsCountSinceLastLog} transactions added to blockchain in ${timeUsedBlockchain.string()}`,
        )
        context.logger.info(
          `Time for createAndConfirm: ${((callTime - lastPrintedCallTime) / 1000 / 1000).toFixed(2)} milliseconds`,
        )
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
  context.logger.info(
    `Synced ${transactionsCount} transactions to blockchain in ${timeUsedAll.string()}`,
  )
  context.logger.info(
    `Time for createAndConfirm: ${(callTime / 1000 / 1000 / 1000).toFixed(2)} seconds`,
  )
  context.logger.info(
    `Time for call lastBalance of user: ${(nanosBalanceForUser / 1000 / 1000 / 1000).toFixed(2)} seconds`,
  )
}
