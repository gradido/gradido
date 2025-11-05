import { 
  InMemoryBlockchain, 
  Filter,
  SearchDirection_ASC,
  Profiler
} from 'gradido-blockchain-js'
import { Logger } from 'log4js'
import { 
  CreatedUserDb, 
  loadDeletedTransactionLinks, 
  loadTransactionLinks, 
  loadTransactions, 
  loadUsers, 
  TransactionDb, 
  TransactionLinkDb 
} from './database'
import { addRegisterAddressTransaction, addTransaction } from './blockchain'
import { generateKeyPairUserAccount } from './keyPair'
import { transactionDbToTransaction, transactionLinkDbToTransaction, userDbToTransaction } from './convert'
import { Orderable, OrderedContainer } from './OrderedContainer'
import { Context } from './Context'
import { bootstrap } from './bootstrap'
import { heapStats } from 'bun:jsc'
import { onShutdown } from '../../../../shared/src/helper/onShutdown'
import { sleep } from 'bun'

const publicKeyUserIdMap = new Map<string, string>()

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

  const users = new OrderedContainer(
    (context: Context, offset: number, count: number) => getNextUsers(context, offset, count), 
    (user: CreatedUserDb) => user.createdAt,
    (context: Context, user: CreatedUserDb) => pushRegisterAddressTransaction(context, user)
  )
  
  const transactions = new OrderedContainer(
    getNextTransactions, 
    (transaction: TransactionDb) => transaction.balanceDate,
    (context: Context, transaction: TransactionDb) => pushTransaction(context, transaction)
  )

  const transactionLinks = new OrderedContainer(
    getNextTransactionLinks, 
    (transactionLink: TransactionLinkDb) => transactionLink.createdAt,
    (context: Context, transactionLink: TransactionLinkDb) => pushTransactionLink(context, transactionLink)
  )

  const deletedTransactionLinks = new OrderedContainer(
    getNextDeletedTransactionLinks,
    (transaction: TransactionDb) => transaction.balanceDate,
    (context: Context, transaction: TransactionDb) => pushTransaction(context, transaction)
  )
    
  try {
    await synchronizeToBlockchain(context, [users, transactions, transactionLinks, deletedTransactionLinks], BATCH_SIZE)
  } catch (e) {
    console.error(e)
    throw e
  }
  context.logger.info(`${timeUsed.string()} for synchronizing to blockchain`)
  // timeUsed.reset()
  /*context.communities.forEach((communityContext) => {
    const f = new Filter()
    // hotfix for bug in gradido_blockchain for Filter::ALL_TRANSACTIONS
    f.pagination.size = 0 
    const transactions = communityContext.blockchain.findAll(f)
    context.logger.info(`Community '${communityContext.communityId}', transactions: ${transactions.size()}`)
    // logBlogchain(context.logger, communityContext.blockchain)
  })
  context.logger.info(`${timeUsed.string()} for logging blockchains`)
  */
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

async function synchronizeToBlockchain(
  context: Context,
  containers: Orderable<Context>[],
  batchSize: number
): Promise<void> {
  const timeUsed = new Profiler()
  while (true) {    
    timeUsed.reset()
    const results = await Promise.all(containers.map(c => c.ensureFilled(context, batchSize)))    
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

    // find container with smallest date
    if (available.length > 0) {
      available.sort((a, b) => a.getDate().getTime() - b.getDate().getTime())
    }
    
    try {
      await available[0].pushToBlockchain(context)
      // await sleep(1)
    } catch (e) {
      context.logger.error(e)
      // logBlogchain(context.logger, context.communities.values().next().value!.blockchain)
      throw e
    }
  }
}

// ---------------- load from db graiddo backend transactions format -----------------------------------------------

/// load next max ${count} users and calculate key pair for calculating signatures later
async function getNextUsers(context: Context, offset: number, count: number): Promise<CreatedUserDb[]> {
  const timeUsed = new Profiler()
  const users = await loadUsers(context.db, offset, count)
  for (const user of users) {
    const communityContext = context.getCommunityContextByUuid(user.communityUuid)
    const { userKeyPair, accountKeyPair } = await generateKeyPairUserAccount(user, context.cache, communityContext.topicId)
    publicKeyUserIdMap.set(userKeyPair.convertToHex(), user.gradidoId)
    publicKeyUserIdMap.set(accountKeyPair.convertToHex(), user.gradidoId)
  }
  if(users.length !== 0) {
    context.logger.info(`${timeUsed.string()} for loading ${users.length} users from db and calculate ed25519 KeyPairs for them`)
  }
  return users
}

// load next max ${count} transactions (contain also redeem transaction link transactions)
async function getNextTransactions(context: Context, offset: number, count: number): Promise<TransactionDb[]> {
  const timeUsed = new Profiler()
  const transactions = await loadTransactions(context.db, offset, count)
  if(transactions.length !== 0) {
    context.logger.debug(`${timeUsed.string()} for loading ${transactions.length} transactions from db`)
  } 
  return transactions
}

// load next max ${count} transaction links (freshly created links, in blockchain format this is a separate transaction)
async function getNextTransactionLinks(context: Context, offset: number, count: number): Promise<TransactionLinkDb[]> {
  const timeUsed = new Profiler()
  const transactionLinks = await loadTransactionLinks(context.db, offset, count)
  if(transactionLinks.length !== 0) {
    context.logger.debug(`${timeUsed.string()} for loading ${transactionLinks.length} transaction links from db`)
  }
  return transactionLinks
}

// load next max ${count} deleted transaction links (in blockchain format this is a separate transaction)
async function getNextDeletedTransactionLinks(context: Context, offset: number, count: number): Promise<TransactionDb[]> {
  const timeUsed = new Profiler()
  const deletedTransactionLinks = await loadDeletedTransactionLinks(context.db, offset, count)
  if(deletedTransactionLinks.length !== 0) {
    context.logger.debug(`${timeUsed.string()} for loading ${deletedTransactionLinks.length} deleted transaction links from db`)
  }
  return deletedTransactionLinks
}

// ---------------- put into in memory blockchain -----------------------------------------------

async function pushRegisterAddressTransaction(context: Context, user: CreatedUserDb): Promise<void> {
  const communityContext = context.getCommunityContextByUuid(user.communityUuid)
  const transaction = userDbToTransaction(user, communityContext.topicId)
  return await addRegisterAddressTransaction(communityContext.blockchain, transaction)
}

async function pushTransaction(context: Context, transactionDb: TransactionDb): Promise<void> {
  const senderCommunityContext = context.getCommunityContextByUuid(transactionDb.user.communityUuid)
  // context.logger.info(`before adding non register address and non link transaction:`)
  // logBlogchain(context.logger, senderCommunityContext.blockchain)
  const recipientCommunityContext = context.getCommunityContextByUuid(transactionDb.linkedUser.communityUuid)
  // CreationTransactionRole will check that community topic id belongs to home community
  context.cache.setHomeCommunityTopicId(senderCommunityContext.topicId)
  const transaction = transactionDbToTransaction(transactionDb, senderCommunityContext.topicId, recipientCommunityContext.topicId)
  await addTransaction(senderCommunityContext.blockchain, recipientCommunityContext.blockchain, transaction)
  // const firstTransaction = senderCommunityContext.blockchain.findOne(Filter.FIRST_TRANSACTION)
  // console.log(`first transaction: ${firstTransaction?.getConfirmedTransaction()?.toJson(true)}`)
}

async function pushTransactionLink(context: Context, transactionLinkDb: TransactionLinkDb): Promise<void> {
  const communityContext = context.getCommunityContextByUuid(transactionLinkDb.user.communityUuid)
  const transaction = transactionLinkDbToTransaction(transactionLinkDb, communityContext.topicId)
  await addTransaction(communityContext.blockchain, communityContext.blockchain, transaction)
}

// ---------------- utils ----------------------------------------------------------------------

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