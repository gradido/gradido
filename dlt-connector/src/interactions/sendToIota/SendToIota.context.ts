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
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionRecipe } from '@/graphql/model/TransactionRecipe'
import { TransactionResult } from '@/graphql/model/TransactionResult'
import { logger } from '@/logging/logger'
import { LogError } from '@/server/LogError'
import { uuid4ToHash } from '@/utils/typeConverter'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { CommunityRootTransactionRole } from './CommunityRootTransaction.role'
import { CreationTransactionRole } from './CreationTransaction.role'
import { RegisterAddressTransactionRole } from './RegisterAddressTransaction.role'
import { TransferTransactionRole } from './TransferTransaction.role'

/**
 * @DCI-Context
 * Context for sending transaction to iota
 * send every transaction only once to iota!
 */
export async function SendToIotaContext(
  input: TransactionDraft | UserAccountDraft | CommunityDraft,
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
    if (input.type === InputTransactionType.CREATION) {
      role = new CreationTransactionRole(input)
    } else if (input.type === InputTransactionType.SEND) {
      role = new TransferTransactionRole(input)
    } else {
      throw new LogError('not supported transaction type')
    }
  } else if (input instanceof UserAccountDraft) {
    role = new RegisterAddressTransactionRole(input)
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
