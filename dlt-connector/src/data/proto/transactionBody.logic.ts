import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'

import { CrossGroupType } from './3_3/enum/CrossGroupType'

export const determineCrossGroupType = ({
  user,
  linkedUser,
  type,
}: TransactionDraft): CrossGroupType => {
  if (
    !linkedUser.communityUuid ||
    !user.communityUuid ||
    linkedUser.communityUuid === '' ||
    user.communityUuid === '' ||
    user.communityUuid === linkedUser.communityUuid ||
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
  { user, linkedUser }: TransactionDraft,
): string => {
  switch (type) {
    case CrossGroupType.LOCAL:
      return ''
    case CrossGroupType.INBOUND:
      if (!linkedUser.communityUuid || linkedUser.communityUuid === '') {
        throw new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing linkedUser community id for cross group transaction',
        )
      }
      return linkedUser.communityUuid
    case CrossGroupType.OUTBOUND:
      if (!user.communityUuid || user.communityUuid === '') {
        throw new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing user community id for cross group transaction',
        )
      }
      return user.communityUuid
    case CrossGroupType.CROSS:
      throw new TransactionError(TransactionErrorType.NOT_IMPLEMENTED_YET, 'not implemented yet')
  }
}
