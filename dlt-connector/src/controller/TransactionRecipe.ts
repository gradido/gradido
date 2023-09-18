import { TransactionType } from '@/graphql/enum/TransactionType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { GradidoTransaction } from '@/proto/3_3/GradidoTransaction'
import { TransactionBody } from '@/proto/3_3/TransactionBody'
import { LogError } from '@/server/LogError'
import { timestampToDate } from '@/utils'
import { TransactionRecipe } from '@entity/TransactionRecipe'

export const create = (
  transaction: GradidoTransaction,
  transactionDraft?: TransactionDraft,
): TransactionRecipe => {
  const recipe = new TransactionRecipe()
  if (transactionDraft) {
    recipe.amount = transactionDraft.amount
    recipe.backendTransactionId = transactionDraft.backendTransactionId
  }
  recipe.bodyBytes = transaction.bodyBytes
  const body = TransactionBody.decode(transaction.bodyBytes)
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
  /*
  switch (transactionType) {
    case TransactionType.GRADIDO_CREATION: 
       recipe.
  }
  */
  return recipe
}
