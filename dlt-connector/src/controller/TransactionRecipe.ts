import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionType } from '@/graphql/enum/TransactionType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { GradidoTransaction } from '@/proto/3_3/GradidoTransaction'
import { TransactionBody } from '@/proto/3_3/TransactionBody'
import { LogError } from '@/server/LogError'
import { logger } from '@/server/logger'
import { getDataSource } from '@/typeorm/DataSource'
import { timestampToDate } from '@/utils/typeConverter'
import { TransactionRecipe } from '@entity/TransactionRecipe'
import { IsNull, Not } from 'typeorm'
import { verify } from './GradidoTransaction'

export const create = (
  transaction: GradidoTransaction,
  transactionDraft?: TransactionDraft,
): TransactionRecipe => {
  const recipe = TransactionRecipe.create()
  if (transactionDraft) {
    recipe.amount = transactionDraft.amount
    recipe.backendTransactionId = transactionDraft.backendTransactionId
  }
  recipe.bodyBytes = transaction.bodyBytes
  let body: TransactionBody
  try {
    body = TransactionBody.decode(new Uint8Array(transaction.bodyBytes))
  } catch (error) {
    logger.error('error decoding body from gradido transaction: %s', error)
    throw new TransactionError(
      TransactionErrorType.PROTO_DECODE_ERROR,
      'cannot decode body from gradido transaction',
    )
  }

  recipe.protocolVersion = body.versionNumber
  recipe.createdAt = timestampToDate(body.createdAt)
  // TODO: adapt if transactions with more than one signatures where added
  if (transaction.sigMap.sigPair.length !== 1) {
    throw new LogError("signature count don't like expected")
  }
  recipe.signature = transaction.sigMap.sigPair[0].signature
  const transactionType = body.getTransactionType()
  if (!transactionType) {
    throw new LogError("invalid TransactionBody couldn't determine transaction type")
  }
  recipe.type = transactionType.valueOf()

  switch (transactionType) {
    case TransactionType.COMMUNITY_ROOT:
      break
    default:
      throw new TransactionError(
        TransactionErrorType.NOT_IMPLEMENTED_YET,
        'TransactionRecipe creation not yet implemented for: ' + transactionType.toString(),
      )
  }

  return recipe
}

export const getNextPendingTransaction = async (): Promise<TransactionRecipe | null> => {
  return await TransactionRecipe.findOne({
    where: { iotaMessageId: Not(IsNull()) },
    order: { createdAt: 'ASC' },
  })
}

export const decodeGradidoTransaction = (
  recipe: TransactionRecipe,
): { transaction: GradidoTransaction; body: TransactionBody } => {
  let body: TransactionBody
  try {
    body = TransactionBody.decode(new Uint8Array(recipe.bodyBytes))
  } catch (error) {
    logger.error('error decoding body from transaction receipt: %s', error)
    throw new TransactionError(
      TransactionErrorType.PROTO_DECODE_ERROR,
      'cannot decode body from transaction receipt',
    )
  }
  const transaction = new GradidoTransaction(body)
  if (!recipe.signature) {
    throw new TransactionError(
      TransactionErrorType.MISSING_PARAMETER,
      'missing signature in transaction recipe',
    )
  }
  transaction.sigMap.sigPair[0].signature = recipe.signature
  if (body.communityRoot) {
    const publicKey = recipe.senderCommunity.rootPubkey
    if (!publicKey) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'missing community public key for community root transaction',
      )
    }
    transaction.sigMap.sigPair[0].pubKey = publicKey
  } else {
    throw new TransactionError(
      TransactionErrorType.NOT_IMPLEMENTED_YET,
      'not implented yet getting public key from another transaction type as community root',
    )
  }
  if (!verify(transaction)) {
    throw new TransactionError(TransactionErrorType.INVALID_SIGNATURE, 'signature is invalid')
  }
  transaction.parentMessageId = recipe.paringTransactionRecipe?.iotaMessageId

  return { transaction, body }
}
