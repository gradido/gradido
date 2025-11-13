import { 
  InMemoryBlockchain, 
  GradidoTransactionBuilder, 
  Timestamp, 
  HieroTransactionId, 
  HieroAccountId, 
  InteractionSerialize,
  Filter,
} from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import { RegisterAddressTransactionRole } from '../../interactions/sendToHiero/RegisterAddressTransaction.role'
import { CommunityRootTransactionRole } from '../../interactions/sendToHiero/CommunityRootTransaction.role'
import { CreationTransactionRole } from '../../interactions/sendToHiero/CreationTransaction.role'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { Community, Transaction } from '../../schemas/transaction.schema'
import { TransferTransactionRole } from '../../interactions/sendToHiero/TransferTransaction.role'
import { DeferredTransferTransactionRole } from '../../interactions/sendToHiero/DeferredTransferTransaction.role'
import { RedeemDeferredTransferTransactionRole } from '../../interactions/sendToHiero/RedeemDeferredTransferTransaction.role'
import { InputTransactionType } from '../../data/InputTransactionType.enum'
import { LinkedTransactionKeyPairRole } from '../../interactions/resolveKeyPair/LinkedTransactionKeyPair.role'
import { identifierSeedSchema } from '../../schemas/typeGuard.schema'
import * as v from 'valibot'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.6.blockchain`)
export const defaultHieroAccount = new HieroAccountId(0, 0, 2)

function addToBlockchain(builder: GradidoTransactionBuilder, blockchain: InMemoryBlockchain, createdAtTimestamp: Timestamp): boolean {
  const transaction = builder.build()
  const transactionId = new HieroTransactionId(createdAtTimestamp, defaultHieroAccount)
  const interactionSerialize = new InteractionSerialize(transactionId)

  try {
    const result = blockchain.createAndAddConfirmedTransaction(transaction, interactionSerialize.run(), createdAtTimestamp)
    return result
  } catch (error) {
    logger.error(`Transaction ${transaction.toJson(true)} not added: ${error}`)
    return false
  }
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
    logger.debug(`Register Address Transaction added for user ${transaction.user.account!.userUuid}`)
  } else {
    throw new Error(`Register Address Transaction not added for user ${transaction.user.account!.userUuid}`)
  }
}

export async function addTransaction(
  senderBlockchain: InMemoryBlockchain,
  _recipientBlockchain: InMemoryBlockchain,
  transaction: Transaction
): Promise<void> {
  const createdAtTimestamp = new Timestamp(transaction.createdAt)
  if (transaction.type === InputTransactionType.GRADIDO_CREATION) {
    const creationTransactionRole = new CreationTransactionRole(transaction)
    if(addToBlockchain(await creationTransactionRole.getGradidoTransactionBuilder(), senderBlockchain, createdAtTimestamp)) {
      logger.debug(`Creation Transaction added for user ${transaction.user.account!.userUuid}`)
    } else {
      throw new Error(`Creation Transaction not added for user ${transaction.user.account!.userUuid}`)
    }    
  } else if (transaction.type === InputTransactionType.GRADIDO_TRANSFER) {
    const transferTransactionRole = new TransferTransactionRole(transaction)
    // will crash with cross group transaction
    if(addToBlockchain(await transferTransactionRole.getGradidoTransactionBuilder(), senderBlockchain, createdAtTimestamp)) {
      logger.debug(`Transfer Transaction added for user ${transaction.user.account!.userUuid}`)
    } else {
      throw new Error(`Transfer Transaction not added for user ${transaction.user.account!.userUuid}`)
    }
  } else if (transaction.type === InputTransactionType.GRADIDO_DEFERRED_TRANSFER) {
    const transferTransactionRole = new DeferredTransferTransactionRole(transaction)
    if(addToBlockchain(await transferTransactionRole.getGradidoTransactionBuilder(), senderBlockchain, createdAtTimestamp)) {
      logger.debug(`Deferred Transfer Transaction added for user ${transaction.user.account!.userUuid}`)
    } else {

      throw new Error(`Deferred Transfer Transaction not added for user ${transaction.user.account!.userUuid}`)
    }
  } else if (transaction.type === InputTransactionType.GRADIDO_REDEEM_DEFERRED_TRANSFER) {
    const seedKeyPairRole = new LinkedTransactionKeyPairRole(v.parse(identifierSeedSchema, transaction.user.seed))
    const f = new Filter()
    f.involvedPublicKey = seedKeyPairRole.generateKeyPair().getPublicKey()
    const deferredTransaction = senderBlockchain.findOne(f)
    if (!deferredTransaction) {
      throw new Error(`redeem deferred transfer: couldn't find parent deferred transfer on Gradido Node for ${JSON.stringify(transaction, null, 2)} and public key from seed: ${f.involvedPublicKey?.convertToHex()}`)
    }
    const confirmedDeferredTransaction = deferredTransaction.getConfirmedTransaction()
    if (!confirmedDeferredTransaction) {
      throw new Error("redeem deferred transfer: invalid TransactionEntry")
    }
    const redeemTransactionRole = new RedeemDeferredTransferTransactionRole(transaction, confirmedDeferredTransaction)
    const involvedUser = transaction.user.account ? transaction.user.account.userUuid : transaction.linkedUser?.account?.userUuid
    if(addToBlockchain(await redeemTransactionRole.getGradidoTransactionBuilder(), senderBlockchain, createdAtTimestamp)) {
      logger.debug(`Redeem Deferred Transfer Transaction added for user ${involvedUser}`)
    } else {
      throw new Error(`Redeem Deferred Transfer Transaction not added for user ${involvedUser}`)
    }
  }
}
