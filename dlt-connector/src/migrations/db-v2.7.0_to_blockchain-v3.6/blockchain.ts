import { sql, SQL } from 'bun'
import { 
  InMemoryBlockchain, 
  InMemoryBlockchainProvider, 
  GradidoTransactionBuilder, 
  KeyPairEd25519, 
  MemoryBlock, 
  Timestamp, 
  HieroTransactionId, 
  HieroAccountId, 
  InteractionSerialize, 
  loadCryptoKeys, 
  Filter,
  SearchDirection_ASC
} from 'gradido-blockchain-js'
import { Logger, getLogger } from 'log4js'
import { CONFIG } from '../../config'
import { amountSchema, HieroId, hieroIdSchema, memoSchema, uuidv4Schema, Uuidv4, gradidoAmountSchema } from '../../schemas/typeGuard.schema'
import { dateSchema } from '../../schemas/typeConverter.schema'
import * as v from 'valibot'
import { RegisterAddressTransactionRole } from '../../interactions/sendToHiero/RegisterAddressTransaction.role'
import { KeyPairCacheManager } from '../../cache/KeyPairCacheManager'
import { InputTransactionType } from '../../data/InputTransactionType.enum'
import { AccountType } from '../../data/AccountType.enum'
import { CommunityRootTransactionRole } from '../../interactions/sendToHiero/CommunityRootTransaction.role'
import { UserKeyPairRole } from '../../interactions/resolveKeyPair/UserKeyPair.role'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { AccountKeyPairRole } from '../../interactions/resolveKeyPair/AccountKeyPair.role'
import { loadConfig } from '../../bootstrap/init'
import { CreationTransactionRole } from '../../interactions/sendToHiero/CreationTransaction.role'
import { CommunityDb, loadCommunities, TransactionDb, TransactionTypeId, UserDb } from './database'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { Community, Transaction } from '../../schemas/transaction.schema'
import { communityDbToCommunity, userDbToTransaction } from './convert'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.6.blockchain`)
export const defaultHieroAccount = new HieroAccountId(0, 0, 2)

function addToBlockchain(builder: GradidoTransactionBuilder, blockchain: InMemoryBlockchain, createdAtTimestamp: Timestamp): boolean {
  const transaction = builder.build()
  const transactionId = new HieroTransactionId(createdAtTimestamp, defaultHieroAccount)
  const interactionSerialize = new InteractionSerialize(transactionId)
  return blockchain.createAndAddConfirmedTransaction(transaction, interactionSerialize.run(), createdAtTimestamp)
}

export async function addCommunityRootTransaction(blockchain: InMemoryBlockchain, community: Community): Promise<void> {
  const communityRootTransactionRole = new CommunityRootTransactionRole(community)
  if(addToBlockchain(await communityRootTransactionRole.getGradidoTransactionBuilder(), blockchain, new Timestamp(community.creationDate))) {
    logger.info(`Community Root Transaction added`)
  } else {
    throw new Error(`Community Root Transaction not added`)
  }
}

export async function addRegisterAddressTransaction(blockchain: InMemoryBlockchain, transaction: Transaction): Promise<void> {
  const registerAddressRole = new RegisterAddressTransactionRole(transaction)
  if(addToBlockchain(await registerAddressRole.getGradidoTransactionBuilder(), blockchain, new Timestamp(transaction.createdAt))) {
    logger.info(`Register Address Transaction added for user ${transaction.user.account!.userUuid}`)
  } else {
    throw new Error(`Register Address Transaction not added for user ${transaction.user.account!.userUuid}`)
  }
}
/*


export async function addTransaction(blockchain: InMemoryBlockchain, transactionDb: TransactionDb): Promise<void> {

  let transactionRole: AbstractTransactionRole
  switch (transactionDb.typeId) {
    case TransactionTypeId.CREATION:
      transactionRole = new CreationTransactionRole({
        user: {
          communityTopicId: transactionDb.user.communityTopicId,
          account: {
            userUuid: transactionDb.user.gradidoId,
            accountNr: 0,
      },
    },
    linkedUser: {
      communityTopicId: transactionDb.linkedUser.communityTopicId,
      account: {
        userUuid: transactionDb.linkedUser.gradidoId,
        accountNr: 0,
      },
    },
    amount: v.parse(gradidoAmountSchema, transactionDb.amount),
    memo: v.parse(memoSchema, transactionDb.memo),
    createdAt: transactionDb.creationDate,
    targetDate: transactionDb.balanceDate,
    type: getInputTransactionTypeFromTypeId(transactionDb.typeId),
  })
  if(addToBlockchain(await transactionRole.getGradidoTransactionBuilder(), blockchain, new Timestamp(transactionDb.creationDate))) {
    logger.info(`Transaction added for user ${transactionDb.user.gradidoId}`)
  } else {
    throw new Error(`Transaction not added for user ${transactionDb.user.gradidoId}`)
  }
}
*/