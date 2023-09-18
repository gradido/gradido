import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionType } from '@/graphql/enum/TransactionType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { GradidoTransaction } from '@/proto/3_3/GradidoTransaction'
import { TransactionBody } from '@/proto/3_3/TransactionBody'
import { LogError } from '@/server/LogError'
import { logger } from '@/server/logger'
import { timestampToDate } from '@/utils/typeConverter'
import { TransactionRecipe } from '@entity/TransactionRecipe'

export const create = (
  transaction: GradidoTransaction,
  transactionDraft?: TransactionDraft,
): TransactionRecipe => {
  console.log('gradido transaction: %s', transaction.toJSON())
  const recipe = new TransactionRecipe()
  if (transactionDraft) {
    recipe.amount = transactionDraft.amount
    recipe.backendTransactionId = transactionDraft.backendTransactionId
  }
  recipe.bodyBytes = transaction.bodyBytes
  let body: TransactionBody
  try {
    body = TransactionBody.decode(new Uint8Array(transaction.bodyBytes))
    console.log('body: %s', body.toJSON())
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
