import { CrossGroupType } from '@/proto/3_3/enum/CrossGroupType'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { InputTransactionType as TransactionType } from '@/graphql/enum/InputTransactionType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { GradidoCreation } from '@/proto/3_3/GradidoCreation'
import { GradidoTransfer } from '@/proto/3_3/GradidoTransfer'
import { TransactionBody } from '@/proto/3_3/TransactionBody'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { CommunityRoot } from '@/proto/3_3/CommunityRoot'
import { Community } from '@entity/Community'
import { Account } from '@entity/Account'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { RegisterAddress } from '@/proto/3_3/RegisterAddress'

export const create = (
  transaction: TransactionDraft | UserAccountDraft,
  signingAccount?: Account,
  recipientAccount?: Account,
): TransactionBody => {
  const body = new TransactionBody(transaction)
  // TODO: load pubkeys for sender and recipient user from db
  if (transaction instanceof TransactionDraft) {
    switch (transaction.type) {
      case TransactionType.CREATION:
        body.creation = new GradidoCreation(transaction, recipientAccount)
        body.data = 'gradidoCreation'
        break
      case TransactionType.SEND:
      case TransactionType.RECEIVE:
        body.transfer = new GradidoTransfer(transaction, signingAccount, recipientAccount)
        body.data = 'gradidoTransfer'
        break
    }
  } else if (transaction instanceof UserAccountDraft) {
    body.registerAddress = new RegisterAddress(transaction, signingAccount?.user)
    body.data = 'registerAddress'
  }
  return body
}

export const createCommunity = (
  community: CommunityDraft,
  communityObject: Community,
): TransactionBody => {
  const body = new TransactionBody(community)
  body.communityRoot = new CommunityRoot(communityObject)
  body.data = 'communityRoot'
  return body
}

export const determineCrossGroupType = ({
  senderUser,
  recipientUser,
  type,
}: TransactionDraft): CrossGroupType => {
  if (
    !recipientUser.communityUuid ||
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
