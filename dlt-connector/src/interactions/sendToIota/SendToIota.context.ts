/* eslint-disable camelcase */
import {
  GradidoTransaction,
  InteractionSerialize,
  InteractionValidate,
  MemoryBlock,
  ValidateType_SINGLE,
} from 'gradido-blockchain-js'

import { sendMessage as iotaSendMessage } from '@/client/IotaClient'
import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionRecipe } from '@/graphql/model/TransactionRecipe'
import { TransactionResult } from '@/graphql/model/TransactionResult'
import { logger } from '@/logging/logger'
import { LogError } from '@/server/LogError'
import { uuid4ToHash } from '@/utils/typeConverter'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { CommunityRootTransactionRole } from './CommunityRootTransaction.role'
import { CreationTransactionRole } from './CreationTransaction.role'
import { DeferredTransferTransactionRole } from './DeferredTransferTransaction.role'
import { RegisterAddressTransactionRole } from './RegisterAddressTransaction.role'
import { TransferTransactionRole } from './TransferTransaction.role'

/**
 * @DCI-Context
 * Context for sending transaction to iota
 * send every transaction only once to iota!
 */
export async function SendToIotaContext(
  input: TransactionDraft | CommunityDraft,
): Promise<TransactionResult> {
  const validate = (transaction: GradidoTransaction): void => {
    try {
      // throw an exception when something is wrong
      const validator = new InteractionValidate(transaction)
      validator.run(ValidateType_SINGLE)
    } catch (e) {
      if (e instanceof Error) {
        throw new TransactionError(TransactionErrorType.VALIDATION_ERROR, e.message)
      } else if (typeof e === 'string') {
        throw new TransactionError(TransactionErrorType.VALIDATION_ERROR, e)
      } else {
        throw e
      }
    }
  }

  const sendViaIota = async (
    gradidoTransaction: GradidoTransaction,
    topic: string,
  ): Promise<MemoryBlock> => {
    // protobuf serializing function
    const serialized = new InteractionSerialize(gradidoTransaction).run()
    if (!serialized) {
      throw new TransactionError(
        TransactionErrorType.PROTO_ENCODE_ERROR,
        'cannot serialize transaction',
      )
    }
    const resultMessage = await iotaSendMessage(
      Uint8Array.from(serialized.data()),
      Uint8Array.from(Buffer.from(topic, 'hex')),
    )
    logger.info('transmitted Gradido Transaction to Iota', {
      messageId: resultMessage.messageId,
    })
    return MemoryBlock.fromHex(resultMessage.messageId)
  }

  let role: AbstractTransactionRole
  if (input instanceof TransactionDraft) {
    switch (input.type) {
      case InputTransactionType.GRADIDO_CREATION:
        role = new CreationTransactionRole(input)
        break
      case InputTransactionType.GRADIDO_TRANSFER:
        role = new TransferTransactionRole(input)
        break
      case InputTransactionType.REGISTER_ADDRESS:
        role = new RegisterAddressTransactionRole(input)
        break
      case InputTransactionType.GRADIDO_DEFERRED_TRANSFER:
        role = new DeferredTransferTransactionRole(input)
        break
      default:
        throw new TransactionError(
          TransactionErrorType.NOT_IMPLEMENTED_YET,
          'not supported transaction type: ' + input.type,
        )
    }
  } else if (input instanceof CommunityDraft) {
    role = new CommunityRootTransactionRole(input)
  } else {
    throw new LogError('not expected input')
  }
  const builder = await role.getGradidoTransactionBuilder()
  if (builder.isCrossCommunityTransaction()) {
    const outboundTransaction = builder.buildOutbound()
    validate(outboundTransaction)
    const outboundIotaMessageId = await sendViaIota(
      outboundTransaction,
      uuid4ToHash(role.getSenderCommunityUuid()).convertToHex(),
    )
    builder.setParentMessageId(outboundIotaMessageId)
    const inboundTransaction = builder.buildInbound()
    validate(inboundTransaction)
    await sendViaIota(
      inboundTransaction,
      uuid4ToHash(role.getRecipientCommunityUuid()).convertToHex(),
    )
    return new TransactionResult(new TransactionRecipe(outboundTransaction, outboundIotaMessageId))
  } else {
    const transaction = builder.build()
    validate(transaction)
    const iotaMessageId = await sendViaIota(
      transaction,
      uuid4ToHash(role.getSenderCommunityUuid()).convertToHex(),
    )
    return new TransactionResult(new TransactionRecipe(transaction, iotaMessageId))
  }
}
