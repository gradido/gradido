/* eslint-disable camelcase */
import {
  GradidoTransaction,
  InteractionValidate,  
  MemoryBlock,  
  ValidateType_SINGLE,
} from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import { safeParse, parse } from 'valibot'
import { Community, communitySchema } from '../../client/backend/community.schema'
import { HieroClient } from '../../client/HieroClient'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { Transaction, transactionSchema } from '../../schemas/transaction.schema'
import { HieroId, HieroTransactionId, hieroTransactionIdSchema } from '../../schemas/typeGuard.schema'
import { AbstractTransactionRole } from './AbstractTransaction.role'
import { CommunityRootTransactionRole } from './CommunityRootTransaction.role'
import { CreationTransactionRole } from './CreationTransaction.role'
import { DeferredTransferTransactionRole } from './DeferredTransferTransaction.role'
import { RedeemDeferredTransferTransactionRole } from './RedeemDeferredTransferTransaction.role'
import { RegisterAddressTransactionRole } from './RegisterAddressTransaction.role'
import { TransferTransactionRole } from './TransferTransaction.role'
import { InputTransactionType } from '../../enum/InputTransactionType'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.interactions.sendToIota.SendToIotaContext`)

/**
 * @DCI-Context
 * Context for sending transaction to iota
 * send every transaction only once to iota!
 */
export async function SendToIotaContext(
  input: Transaction | Community,
): Promise<HieroTransactionId> {
  // let gradido blockchain validator run, it will throw an exception when something is wrong
  const validate = (transaction: GradidoTransaction): void => {
    const validator = new InteractionValidate(transaction)
    validator.run(ValidateType_SINGLE)
  }

  // send transaction as hiero topic message
  const sendViaHiero = async (
    gradidoTransaction: GradidoTransaction,
    topic: HieroId,
  ): Promise<string> => {
    const client = HieroClient.getInstance()
    const resultMessage = await client.sendMessage(topic, gradidoTransaction)
    const transactionId = resultMessage.response.transactionId.toString()
    logger.info('transmitted Gradido Transaction to Iota', { transactionId })
    return transactionId
  }

  // choose correct role based on transaction type and input type
  const chooseCorrectRole = (input: Transaction | Community): AbstractTransactionRole => {
    const transactionParsingResult = safeParse(transactionSchema, input)
    const communityParsingResult = safeParse(communitySchema, input)
    if (transactionParsingResult.success) {
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
        case InputTransactionType.GRADIDO_REDEEM_DEFERRED_TRANSFER:
          return new RedeemDeferredTransferTransactionRole(transaction)
        default:
          throw new Error('not supported transaction type: ' + transaction.type)
      }
    } else if (communityParsingResult.success) {
      return new CommunityRootTransactionRole(communityParsingResult.output)
    } else {
      throw new Error('not expected input')
    }
  }

  const role = chooseCorrectRole(input)  
  const builder = await role.getGradidoTransactionBuilder()
  if (builder.isCrossCommunityTransaction()) {
    const outboundTransaction = builder.buildOutbound()
    validate(outboundTransaction)
    const outboundIotaMessageId = await sendViaHiero(
      outboundTransaction,
      role.getSenderCommunityTopicId(),
    )
    builder.setParentMessageId(MemoryBlock.createPtr(new MemoryBlock(outboundIotaMessageId)))
    const inboundTransaction = builder.buildInbound()
    validate(inboundTransaction)
    await sendViaHiero(inboundTransaction, role.getRecipientCommunityTopicId())
    return parse(hieroTransactionIdSchema, outboundIotaMessageId)
  } else {
    const transaction = builder.build()
    validate(transaction)
    const iotaMessageId = await sendViaHiero(
      transaction,
      role.getSenderCommunityTopicId(),
    )
    return parse(hieroTransactionIdSchema, iotaMessageId)
  }
}
