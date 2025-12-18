import * as fs from 'node:fs'
import {
  AccountBalances,
  Filter,
  GradidoTransactionBuilder,
  HieroAccountId,
  InMemoryBlockchain,
  InteractionSerialize,
  TransactionType_DEFERRED_TRANSFER,
} from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { InputTransactionType } from '../../data/InputTransactionType.enum'
import { LinkedTransactionKeyPairRole } from '../../interactions/resolveKeyPair/LinkedTransactionKeyPair.role'
import { AbstractTransactionRole } from '../../interactions/sendToHiero/AbstractTransaction.role'
import { CommunityRootTransactionRole } from '../../interactions/sendToHiero/CommunityRootTransaction.role'
import { CreationTransactionRole } from '../../interactions/sendToHiero/CreationTransaction.role'
import { DeferredTransferTransactionRole } from '../../interactions/sendToHiero/DeferredTransferTransaction.role'
import { RedeemDeferredTransferTransactionRole } from '../../interactions/sendToHiero/RedeemDeferredTransferTransaction.role'
import { RegisterAddressTransactionRole } from '../../interactions/sendToHiero/RegisterAddressTransaction.role'
import { TransferTransactionRole } from '../../interactions/sendToHiero/TransferTransaction.role'
import { Community, Transaction } from '../../schemas/transaction.schema'
import { identifierSeedSchema } from '../../schemas/typeGuard.schema'
import { NotEnoughGradidoBalanceError } from './errors'

const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.6.blockchain`,
)
export const defaultHieroAccount = new HieroAccountId(0, 0, 2)
let transactionAddedToBlockchainSum = 0
let addToBlockchainSum = 0
const sizeBuffer = Buffer.alloc(2)

function addToBlockchain(
  builder: GradidoTransactionBuilder,
  blockchain: InMemoryBlockchain,
  transactionId: number,
  accountBalances: AccountBalances,
): boolean {
  const transaction = builder.build()
  const transactionSerializer = new InteractionSerialize(transaction)
  const binTransaction = transactionSerializer.run()
  if (!binTransaction) {
    logger.error(`Failed to serialize transaction ${transaction.toJson(true)}`)
    return false
  }
  const filePath = `${blockchain.getCommunityId()}.bin`
  if (!addToBlockchainSum) {
    // clear file
    fs.writeFileSync(filePath, Buffer.alloc(0))
  }
  sizeBuffer.writeUInt16LE(binTransaction.size(), 0)
  fs.appendFileSync(filePath, sizeBuffer)
  fs.appendFileSync(filePath, binTransaction.data())
  //
  
  try {    
    const result = blockchain.createAndAddConfirmedTransactionExtern(
      transaction,
      transactionId,
      accountBalances,
    )
    // logger.info(`${transactionTypeToString(transaction.getTransactionBody()?.getTransactionType()!)} Transaction added in ${timeUsed.string()}`)
    addToBlockchainSum++
    return result
  } catch (error) {
    if (error instanceof Error) {
      const matches = error.message.match(/not enough Gradido Balance for (send coins|operation), needed: -?(\d+\.\d+), exist: (\d+\.\d+)/)
      if (matches) {
        const needed = parseFloat(matches[2])
        const exist = parseFloat(matches[3])
        throw new NotEnoughGradidoBalanceError(needed, exist)
      }
    }
    const lastTransaction = blockchain.findOne(Filter.LAST_TRANSACTION)
    throw new Error(`Transaction ${transaction.toJson(true)} not added: ${error}, last transaction was: ${lastTransaction?.getConfirmedTransaction()?.toJson(true)}`)
  }
}

export async function addCommunityRootTransaction(
  blockchain: InMemoryBlockchain,
  community: Community,
  accountBalances: AccountBalances
): Promise<void> {
  const communityRootTransactionRole = new CommunityRootTransactionRole(community)
  if (
    addToBlockchain(
      await communityRootTransactionRole.getGradidoTransactionBuilder(),
      blockchain,
      0,
      accountBalances,
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
  transactionId: number,
  accountBalances: AccountBalances,
): Promise<void> {

  let debugTmpStr = ''
  let role: AbstractTransactionRole
  if (transaction.type === InputTransactionType.GRADIDO_CREATION) {
    role = new CreationTransactionRole(transaction)
  } else if (transaction.type === InputTransactionType.GRADIDO_TRANSFER) {
    role = new TransferTransactionRole(transaction)
  } else if (transaction.type === InputTransactionType.REGISTER_ADDRESS) {
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
    if (deferredTransactions.size() !== 1) {
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
  try {
    if (addToBlockchain(await role.getGradidoTransactionBuilder(), senderBlockchain, transactionId, accountBalances)) {
      // logger.debug(`${transaction.type} Transaction added for user ${involvedUser}`)
      transactionAddedToBlockchainSum++
    } else {
      logger.error(debugTmpStr)
      logger.error(`transaction: ${JSON.stringify(transaction, null, 2)}`)
      throw new Error(`${transaction.type} Transaction not added for user ${involvedUser}, after ${transactionAddedToBlockchainSum} transactions`)
    }
  } catch(e) {
    if (e instanceof NotEnoughGradidoBalanceError) {
      throw e
    }
    logger.error(`error adding transaction: ${JSON.stringify(transaction, null, 2)}`)
    throw e
  }
}
