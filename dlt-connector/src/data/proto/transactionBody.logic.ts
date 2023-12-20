import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'

import { CrossGroupType } from './3_3/enum/CrossGroupType'

export const determineCrossGroupType = ({
  senderUser,
  recipientUser,
  type,
}: TransactionDraft): CrossGroupType => {
  if (
    !recipientUser.communityUuid ||
    recipientUser.communityUuid === '' ||
    senderUser.communityUuid === recipientUser.communityUuid ||
    type === InputTransactionType.CREATION
  ) {
    return CrossGroupType.LOCAL
  } else if (type === InputTransactionType.SEND) {
    return CrossGroupType.INBOUND
  } else if (type === InputTransactionType.RECEIVE) {
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
    case CrossGroupType.CROSS:
      throw new TransactionError(TransactionErrorType.NOT_IMPLEMENTED_YET, 'not implemented yet')
  }
}
