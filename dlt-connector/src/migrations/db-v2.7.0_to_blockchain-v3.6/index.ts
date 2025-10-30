import { 
  InMemoryBlockchain, 
  Filter,
  SearchDirection_ASC,
  HieroTransactionId,
  Timestamp,
  InteractionSerialize
} from 'gradido-blockchain-js'
import { Logger } from 'log4js'

import { CreatedUserDb, loadDeletedTransactionLinks, loadTransactionLinks, loadTransactions, loadUsers, TransactionDb, TransactionLinkDb } from './database'
import { addRegisterAddressTransaction, defaultHieroAccount } from './blockchain'
import { generateKeyPairUserAccount } from './keyPair'
import { transactionDbToTransaction, userDbToTransaction } from './convert'
import { Orderable, OrderedContainer } from './OrderedContainer'
import { Context } from './Context'
import { bootstrap } from './bootstrap'
import { RegisterAddressTransactionRole } from '../../interactions/sendToHiero/RegisterAddressTransaction.role'

async function main() {
  // prepare in memory blockchains
  const context = await bootstrap()

  // synchronize to blockchain
  const BATCH_SIZE = 10

  const users = new OrderedContainer(
    getNextUsers, 
    (user: CreatedUserDb) => user.createdAt,
    (context: Context, user: CreatedUserDb) => pushRegisterAddressTransaction(context, user)
  )

  await synchronizeToBlockchain(context, [users], BATCH_SIZE)

  // log blockchains
  for(const community of context.communities.values()) {
    context.logger.info(`Community '${community.communityId}', blockchain`)
    logBlogchain(context.logger, community.blockchain)
  }
  context.db.close()
  return Promise.resolve()
}

async function synchronizeToBlockchain(
  context: Context,
  containers: Orderable<Context>[],
  batchSize: number
): Promise<void> {
  let rounds = 20
  while (rounds-- > 0) {
    await Promise.all(containers.map(c => c.ensureFilled(context, batchSize)))
    // console.log(`filled containers, rounds left: ${rounds}`)
    // remove empty containers
    const available = containers.filter(c => !c.isEmpty())
    if (available.length === 0) break
    // console.log(`available containers: ${available.length}`)

    // find container with smallest date
    available.sort((a, b) => a.getDate().getTime() - b.getDate().getTime())
    // console.log(`smallest date: ${available[0].getDate()}`)
    
    if(rounds >= 0) {
      await available[0].pushToBlockchain(context)
    } else {
      const user = (available[0] as any as OrderedContainer<any, Context>).shift()
      console.log(JSON.stringify(user, null, 2))
      console.log(`context: ${JSON.stringify(context, null, 2)}`)
      const communityContext = context.getCommunityContextByUuid(user.communityUuid)
      const transactionBase = userDbToTransaction(user, communityContext.topicId)
      console.log(JSON.stringify(transactionBase, null, 2))
      const registerAddressRole = new RegisterAddressTransactionRole(transactionBase)
      const builder = await registerAddressRole.getGradidoTransactionBuilder()
      const transaction = builder.build()
      console.log(transaction.toJson(true))
      const createdAtTimestamp = new Timestamp(user.createdAt)
      console.log(`createdAtTimestamp: ${createdAtTimestamp.toJson()}`)
      const transactionId = new HieroTransactionId(createdAtTimestamp, defaultHieroAccount)
      const interactionSerialize = new InteractionSerialize(transactionId)
      const serializedTransactionId = interactionSerialize.run()
      if (serializedTransactionId) {
        console.log(`serialized transaction id: ${serializedTransactionId.convertToHex()}`)
      }
      console.log(communityContext.blockchain)
      try {
        communityContext.blockchain.createAndAddConfirmedTransaction(transaction, serializedTransactionId, createdAtTimestamp)
      } catch(e) {
        console.log(e)
      }
    }
    // console.log(`pushed to blockchain, rounds left: ${rounds}`)
  }
}

async function fillBlockchains(context: Context): Promise<void> {
  const BATCH_SIZE = 10

  const users = new OrderedContainer(
    getNextUsers, 
    (user: CreatedUserDb) => user.createdAt,
    (context: Context, user: CreatedUserDb) => pushRegisterAddressTransaction(context, user)
  )
  /*const transactions = new OrderedContainer(getNextTransactions, (transaction) => transaction.balanceDate)
  const transactionLinks = new OrderedContainer(getNextTransactionLinks, (transactionLink) => transactionLink.createdAt)
  const deletedTransactionLinks = new OrderedContainer(getNextDeletedTransactionLinks, (transactionLink) => transactionLink.balanceDate)
*/
  await synchronizeToBlockchain(context, [users], BATCH_SIZE)
}

// ---------------- load from db graiddo backend transactions format -----------------------------------------------
/// load next max ${count} users and calculate key pair for calculating signatures later
async function getNextUsers(context: Context, offset: number, count: number): Promise<CreatedUserDb[]> {
  const users = await loadUsers(context.db, offset, count)
  for (const user of users) {
    const communityContext = context.getCommunityContextByUuid(user.communityUuid)
    generateKeyPairUserAccount(user, context.cache, communityContext.topicId)
  }
  return users
}

// load next max ${count} transactions (contain also redeem transaction link transactions)
async function getNextTransactions(context: Context, offset: number, count: number): Promise<TransactionDb[]> {
  return loadTransactions(context.db, offset, count)
}

// load next max ${count} transaction links (freshly created links, in blockchain format this is a separate transaction)
async function getNextTransactionLinks(context: Context, offset: number, count: number): Promise<TransactionLinkDb[]> {
  return loadTransactionLinks(context.db, offset, count)
}

// load next max ${count} deleted transaction links (in blockchain format this is a separate transaction)
async function getNextDeletedTransactionLinks(context: Context, offset: number, count: number): Promise<TransactionDb[]> {
  return loadDeletedTransactionLinks(context.db, offset, count)
}

// ---------------- put into in memory blockchain -----------------------------------------------

async function pushRegisterAddressTransaction(context: Context, user: CreatedUserDb): Promise<void> {
  const communityContext = context.getCommunityContextByUuid(user.communityUuid)
  const transaction = userDbToTransaction(user, communityContext.topicId)
  return await addRegisterAddressTransaction(communityContext.blockchain, transaction)
}

/*
async function pushTransaction(context: Context, transactionDb: TransactionDb): Promise<void> {
  const senderCommunityContext = context.getCommunityContextByUuid(transactionDb.user.communityUuid)
  const recipientCommunityContext = context.getCommunityContextByUuid(transactionDb.linkedUser.communityUuid)
  // CreationTransactionRole will check that community topic id belongs to home community
  context.cache.setHomeCommunityTopicId(senderCommunityContext.topicId)
  const transaction = transactionDbToTransaction(transactionDb, senderCommunityContext.topicId, recipientCommunityContext.topicId)
  await addTransaction(senderCommunityContext.blockchain, transaction)
}
*/
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