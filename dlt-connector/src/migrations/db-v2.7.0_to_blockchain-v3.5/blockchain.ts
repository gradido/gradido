import {
  Filter,
  GradidoTransactionBuilder,
  HieroAccountId,
  HieroTransactionId,
  InMemoryBlockchain,
  InteractionSerialize,
  Pagination,
  Profiler,
  SearchDirection_DESC,
  Timestamp,
  TransactionType_DEFERRED_TRANSFER,
} from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { InputTransactionType } from '../../data/InputTransactionType.enum'
import { LinkedTransactionKeyPairRole } from '../../interactions/resolveKeyPair/LinkedTransactionKeyPair.role'
import { CommunityRootTransactionRole } from '../../interactions/sendToHiero/CommunityRootTransaction.role'
import { CreationTransactionRole } from '../../interactions/sendToHiero/CreationTransaction.role'
import { DeferredTransferTransactionRole } from '../../interactions/sendToHiero/DeferredTransferTransaction.role'
import { RedeemDeferredTransferTransactionRole } from '../../interactions/sendToHiero/RedeemDeferredTransferTransaction.role'
import { RegisterAddressTransactionRole } from '../../interactions/sendToHiero/RegisterAddressTransaction.role'
import { TransferTransactionRole } from '../../interactions/sendToHiero/TransferTransaction.role'
import { Community, Transaction } from '../../schemas/transaction.schema'
import { identifierSeedSchema } from '../../schemas/typeGuard.schema'
import { AbstractTransactionRole } from '../../interactions/sendToHiero/AbstractTransaction.role'
import * as v from 'valibot'
import * as fs from 'node:fs'

const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.6.blockchain`,
)
export const defaultHieroAccount = new HieroAccountId(0, 0, 2)
let transactionAddedToBlockchainSum = 0
const sizeBuffer = Buffer.alloc(2)

function addToBlockchain(
  builder: GradidoTransactionBuilder,
  blockchain: InMemoryBlockchain,
  createdAtTimestamp: Timestamp,
): boolean {
  const transaction = builder.build()
  /* const transactionSerializer = new InteractionSerialize(transaction)
  const binTransaction = transactionSerializer.run()
  if (!binTransaction) {
    logger.error(`Failed to serialize transaction ${transaction.toJson(true)}`)
    return false
  }
  const filePath = `${blockchain.getCommunityId()}.bin`
  sizeBuffer.writeUInt16LE(binTransaction.size(), 0)
  fs.appendFileSync(filePath, sizeBuffer)
  fs.appendFileSync(filePath, binTransaction.data())
  */
  // TODO: use actual transaction id if exist in dlt_transactions table
  const transactionId = new HieroTransactionId(createdAtTimestamp, defaultHieroAccount)
  const interactionSerialize = new InteractionSerialize(transactionId)

  try {    
    const result = blockchain.createAndAddConfirmedTransaction(
      transaction,
      interactionSerialize.run(),
      createdAtTimestamp,
    )
    return result
  } catch (error) {
    logger.error(`Transaction ${transaction.toJson(true)} not added: ${error}`)
    return true
  }
}

export async function addCommunityRootTransaction(
  blockchain: InMemoryBlockchain,
  community: Community,
): Promise<void> {
  const communityRootTransactionRole = new CommunityRootTransactionRole(community)
  if (
    addToBlockchain(
      await communityRootTransactionRole.getGradidoTransactionBuilder(),
      blockchain,
      new Timestamp(community.creationDate),
    )
  ) {
    logger.info(`Community Root Transaction added`)
  } else {
    throw new Error(`Community Root Transaction not added`)
  }
}

export async function addTransaction(
  senderBlockchain: InMemoryBlockchain,
  _recipientBlockchain: InMemoryBlockchain,
  transaction: Transaction,
): Promise<void> {

  let debugTmpStr = ''

  const createdAtTimestamp = new Timestamp(transaction.createdAt)
  let role: AbstractTransactionRole
  if (transaction.type === InputTransactionType.GRADIDO_CREATION) {
    role = new CreationTransactionRole(transaction)
  } else if (transaction.type === InputTransactionType.GRADIDO_TRANSFER) {
    role = new TransferTransactionRole(transaction)
  } else if (transaction.type == InputTransactionType.REGISTER_ADDRESS) {
    role = new RegisterAddressTransactionRole(transaction)
  } else if (transaction.type === InputTransactionType.GRADIDO_DEFERRED_TRANSFER) {
    role = new DeferredTransferTransactionRole(transaction)
  } else if (transaction.type === InputTransactionType.GRADIDO_REDEEM_DEFERRED_TRANSFER) {
    const seedKeyPairRole = new LinkedTransactionKeyPairRole(
      v.parse(identifierSeedSchema, transaction.user.seed),
    )
    const f = new Filter()
    f.involvedPublicKey = seedKeyPairRole.generateKeyPair().getPublicKey()
    f.transactionType = TransactionType_DEFERRED_TRANSFER
    const deferredTransactions = senderBlockchain.findAll(f)
    if (!deferredTransactions) {
      throw new Error(
        `redeem deferred transfer: couldn't find parent deferred transfer on Gradido Node for ${JSON.stringify(transaction, null, 2)} and public key from seed: ${f.involvedPublicKey?.convertToHex()}`,
      )
    }
    if (deferredTransactions.size() != 1) {
      logger.error(
        `redeem deferred transfer: found ${deferredTransactions.size()} parent deferred transfer on Gradido Node for ${JSON.stringify(transaction, null, 2)} and public key from seed: ${f.involvedPublicKey?.convertToHex()}`,
      )
      for(let i = 0; i < deferredTransactions.size(); i++) {
        logger.error(`deferred transaction ${i}: ${deferredTransactions.get(i)?.getConfirmedTransaction()?.toJson(true)}`)
      }
      throw new Error(
        `redeem deferred transfer: found ${deferredTransactions.size()} parent deferred transfer on Gradido Node for ${JSON.stringify(transaction, null, 2)} and public key from seed: ${f.involvedPublicKey?.convertToHex()}`,
      )
    }
    const deferredTransaction = deferredTransactions.get(0)!
    const confirmedDeferredTransaction = deferredTransaction.getConfirmedTransaction()
    if (!confirmedDeferredTransaction) {
      throw new Error('redeem deferred transfer: invalid TransactionEntry')
    }
    debugTmpStr += `\nconfirmed deferred transaction: ${confirmedDeferredTransaction.toJson(true)} with filter: ${f.toJson(true)}`
    role = new RedeemDeferredTransferTransactionRole(
      transaction,
      confirmedDeferredTransaction,
    )
  } else {
    throw new Error(`Transaction type ${transaction.type} not supported`)
  }
  const involvedUser = transaction.user.account
    ? transaction.user.account.userUuid
    : transaction.linkedUser?.account?.userUuid
  if (addToBlockchain(await role.getGradidoTransactionBuilder(), senderBlockchain, createdAtTimestamp)) {
    logger.debug(`${transaction.type} Transaction added for user ${involvedUser}`)
    transactionAddedToBlockchainSum++
  } else {
    logger.error(debugTmpStr)
    /*const f = new Filter()
    f.searchDirection = SearchDirection_DESC
    f.pagination = new Pagination(15)
    const transactions = senderBlockchain.findAll(f)
    for(let i = transactions.size() - 1; i >= 0; i--) {
      logger.error(`transaction ${i}: ${transactions.get(i)?.getConfirmedTransaction()?.toJson(true)}`)
    }*/
    logger.error(`transaction: ${JSON.stringify(transaction, null, 2)}`)
    throw new Error(`${transaction.type} Transaction not added for user ${involvedUser}, after ${transactionAddedToBlockchainSum} transactions`)
  }
}
