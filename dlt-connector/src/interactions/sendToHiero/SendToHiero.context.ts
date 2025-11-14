import {
  GradidoTransaction,
  HieroTransactionId,
  InteractionSerialize,
  InteractionValidate,
  ValidateType_SINGLE,
} from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import * as v from 'valibot'
import { ensureCommunitiesAvailable } from '../../client/GradidoNode/communities'
import { GradidoNodeClient } from '../../client/GradidoNode/GradidoNodeClient'
import { HieroClient } from '../../client/hiero/HieroClient'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { InputTransactionType } from '../../data/InputTransactionType.enum'
import {
  CommunityInput,
  communitySchema,
  TransactionInput,
  transactionSchema,
} from '../../schemas/transaction.schema'
import {
  HieroId,
  HieroTransactionIdString,
  hieroTransactionIdStringSchema,
  identifierSeedSchema,
} from '../../schemas/typeGuard.schema'
import { isTopicStillOpen } from '../../utils/hiero'
import { LinkedTransactionKeyPairRole } from '../resolveKeyPair/LinkedTransactionKeyPair.role'
import { AbstractTransactionRole } from './AbstractTransaction.role'
import { CommunityRootTransactionRole } from './CommunityRootTransaction.role'
import { CreationTransactionRole } from './CreationTransaction.role'
import { DeferredTransferTransactionRole } from './DeferredTransferTransaction.role'
import { RedeemDeferredTransferTransactionRole } from './RedeemDeferredTransferTransaction.role'
import { RegisterAddressTransactionRole } from './RegisterAddressTransaction.role'
import { TransferTransactionRole } from './TransferTransaction.role'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.interactions.sendToHiero.SendToHieroContext`)

/**
 * @DCI-Context
 * Context for sending transaction to hiero
 * send every transaction only once to hiero!
 */
export async function SendToHieroContext(
  input: TransactionInput | CommunityInput,
): Promise<HieroTransactionIdString> {
  const role = await chooseCorrectRole(input)
  const builder = await role.getGradidoTransactionBuilder()
  if (builder.isCrossCommunityTransaction()) {
    // build cross group transaction
    const outboundTransaction = builder.buildOutbound()
    validate(outboundTransaction)

    if (!isTopicStillOpen(role.getRecipientCommunityTopicId())) {
      throw new Error('recipient topic is not open long enough for sending messages')
    }

    // send outbound transaction to hiero at first, because we need the transaction id for inbound transaction
    const outboundHieroTransactionIdString = await sendViaHiero(
      outboundTransaction,
      role.getSenderCommunityTopicId(),
    )

    // serialize Hiero transaction ID and attach it to the builder for the inbound transaction
    const transactionIdSerializer = new InteractionSerialize(
      new HieroTransactionId(outboundHieroTransactionIdString),
    )
    builder.setParentMessageId(transactionIdSerializer.run())

    // build and validate inbound transaction
    const inboundTransaction = builder.buildInbound()
    validate(inboundTransaction)

    // send inbound transaction to hiero
    await sendViaHiero(inboundTransaction, role.getRecipientCommunityTopicId())
    return outboundHieroTransactionIdString
  } else {
    // build and validate local transaction
    const transaction = builder.build()
    validate(transaction)

    // send transaction to hiero
    const hieroTransactionIdString = await sendViaHiero(
      transaction,
      role.getSenderCommunityTopicId(),
    )
    return hieroTransactionIdString
  }
}

// let gradido blockchain validator run, it will throw an exception when something is wrong
function validate(transaction: GradidoTransaction): void {
  const validator = new InteractionValidate(transaction)
  validator.run(ValidateType_SINGLE)
}

// send transaction as hiero topic message
async function sendViaHiero(
  gradidoTransaction: GradidoTransaction,
  topic: HieroId,
): Promise<HieroTransactionIdString> {
  const client = HieroClient.getInstance()
  const transactionId = await client.sendMessage(topic, gradidoTransaction)
  if (!transactionId) {
    throw new Error('missing transaction id from hiero')
  }
  logger.debug('give Gradido Transaction to Hiero Client', {
    transactionId: transactionId.toString(),
  })
  return v.parse(hieroTransactionIdStringSchema, transactionId.toString())
}

// choose correct role based on transaction type and input type
async function chooseCorrectRole(
  input: TransactionInput | CommunityInput,
): Promise<AbstractTransactionRole> {
  const communityParsingResult = v.safeParse(communitySchema, input)
  if (communityParsingResult.success) {
    // make sure gradido node knows community
    await ensureCommunitiesAvailable([communityParsingResult.output.hieroTopicId])
    return new CommunityRootTransactionRole(communityParsingResult.output)
  }

  const transactionParsingResult = v.safeParse(transactionSchema, input)
  if (!transactionParsingResult.success) {
    logger.error("error validating transaction, doesn't match any schema", {
      transactionSchema: v.flatten<typeof transactionSchema>(transactionParsingResult.issues),
      communitySchema: v.flatten<typeof communitySchema>(communityParsingResult.issues),
    })
    throw new Error('invalid input')
  }
  // make sure gradido node knows communities
  const communityTopicIds = [
    transactionParsingResult.output.user.communityTopicId,
    transactionParsingResult.output.linkedUser?.communityTopicId,
  ].filter((id): id is HieroId => id !== undefined)
  await ensureCommunitiesAvailable(communityTopicIds)

  const transaction = transactionParsingResult.output
  switch (transaction.type) {
    case InputTransactionType.GRADIDO_CREATION:
      return new CreationTransactionRole(transaction)
    case InputTransactionType.GRADIDO_TRANSFER:
      return new TransferTransactionRole(transaction)
    case InputTransactionType.REGISTER_ADDRESS:
      return new RegisterAddressTransactionRole(transaction)
    case InputTransactionType.GRADIDO_DEFERRED_TRANSFER:
      return new DeferredTransferTransactionRole(transaction)
    case InputTransactionType.GRADIDO_REDEEM_DEFERRED_TRANSFER: {
      // load deferred transfer transaction from gradido node
      const seedKeyPairRole = new LinkedTransactionKeyPairRole(
        v.parse(identifierSeedSchema, transaction.user.seed),
      )
      const seedPublicKey = seedKeyPairRole.generateKeyPair().getPublicKey()
      if (!seedPublicKey) {
        throw new Error("redeem deferred transfer: couldn't generate seed public key")
      }
      const transactions = await GradidoNodeClient.getInstance().getTransactionsForAccount(
        { maxResultCount: 2, topic: transaction.user.communityTopicId },
        seedPublicKey.convertToHex(),
      )
      if (!transactions || transactions.length !== 1) {
        throw new Error(
          "redeem deferred transfer: couldn't find exactly one deferred transfer on Gradido Node",
        )
      }
      return new RedeemDeferredTransferTransactionRole(transaction, transactions[0])
    }
    default:
      throw new Error('not supported transaction type: ' + transaction.type)
  }
}
