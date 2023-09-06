import { CrossGroupType } from '@/graphql/enum/CrossGroupType'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionType } from '@/graphql/enum/TransactionType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { GradidoCreation } from '@/proto/3_3/GradidoCreation'
import { GradidoTransfer } from '@/proto/3_3/GradidoTransfer'
import { TransactionBody } from '@/proto/3_3/TransactionBody'

export const create = (transaction: TransactionDraft): TransactionBody => {
  const body = new TransactionBody(transaction)
  // TODO: load pubkeys for sender and recipient user from db
  switch (transaction.type) {
    case TransactionType.CREATION:
      body.creation = new GradidoCreation(transaction)
      body.data = 'gradidoCreation'
      break
    case TransactionType.SEND:
    case TransactionType.RECEIVE:
      body.transfer = new GradidoTransfer(transaction)
      body.data = 'gradidoTransfer'
      break
  }
  return body
}

export const determineCrossGroupType = ({
  senderUser,
  recipientUser,
  type,
}: TransactionDraft): CrossGroupType => {
  if (
    recipientUser.communityUuid === '' ||
    senderUser.communityUuid === recipientUser.communityUuid ||
    type === TransactionType.CREATION
  ) {
    return CrossGroupType.LOCAL
  } else if (type === TransactionType.SEND) {
    return CrossGroupType.INBOUND
  } else if (type === TransactionType.RECEIVE) {
    return CrossGroupType.OUTBOUND
  }
  throw new TransactionError(
    TransactionErrorType.NOT_IMPLEMENTED_YET,
    'cannot determine CrossGroupType',
  )
}

export const determineOtherGroup = (
  type: CrossGroupType,
  { senderUser, recipientUser }: TransactionDraft,
): string => {
  switch (type) {
    case CrossGroupType.LOCAL:
      return ''
    case CrossGroupType.INBOUND:
      if (!recipientUser.communityUuid) {
        throw new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing recipient user community id for cross group transaction',
        )
      }
      return recipientUser.communityUuid
    case CrossGroupType.OUTBOUND:
      if (!senderUser.communityUuid) {
        throw new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing sender user community id for cross group transaction',
        )
      }
      return senderUser.communityUuid
  }
}
