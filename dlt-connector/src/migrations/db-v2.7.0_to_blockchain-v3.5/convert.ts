import { InputTransactionType } from '../../data/InputTransactionType.enum'
import { CommunityDb, TransactionDb, CreatedUserDb, TransactionLinkDb } from './valibot.schema'
import { Community, communitySchema, transactionSchema, Transaction, TransactionInput } from '../../schemas/transaction.schema'
import { AccountType } from '../../data/AccountType.enum'
import { gradidoAmountSchema, HieroId, memoSchema, timeoutDurationSchema } from '../../schemas/typeGuard.schema'
import * as v from 'valibot'
import { TransactionTypeId } from './TransactionTypeId'

export function getInputTransactionTypeFromTypeId(typeId: TransactionTypeId): InputTransactionType {
  switch (typeId) {
    case TransactionTypeId.CREATION:
      return InputTransactionType.GRADIDO_CREATION
    case TransactionTypeId.SEND:
      return InputTransactionType.GRADIDO_TRANSFER
    case TransactionTypeId.RECEIVE:
      throw new Error('not used')
    default:
      throw new Error('not implemented')
  }
}

export function communityDbToCommunity(topicId: HieroId, communityDb: CommunityDb, creationDate: Date): Community {
 return v.parse(communitySchema, {
    hieroTopicId: topicId,
    uuid: communityDb.communityUuid,
    foreign: communityDb.foreign,
    creationDate,  
 }) 
}

export function userDbToTransaction(userDb: CreatedUserDb, communityTopicId: HieroId): Transaction {
  return v.parse(transactionSchema, {
    user: {
      communityTopicId: communityTopicId,
      account: { userUuid: userDb.gradidoId },
    },
    type: InputTransactionType.REGISTER_ADDRESS,
    accountType: AccountType.COMMUNITY_HUMAN,
    createdAt: userDb.createdAt,
  })
}

export function transactionDbToTransaction(
  transactionDb: TransactionDb, 
  communityTopicId: HieroId, 
  recipientCommunityTopicId: HieroId
): Transaction {
  if (
    transactionDb.typeId !== TransactionTypeId.CREATION 
    && transactionDb.typeId !== TransactionTypeId.SEND 
    && transactionDb.typeId !== TransactionTypeId.RECEIVE) {
    throw new Error('not implemented')
  }
  
  const user = {
    communityTopicId: communityTopicId,
    account: { userUuid: transactionDb.user.gradidoId },
  }
  const linkedUser = {
    communityTopicId: recipientCommunityTopicId,
    account: { userUuid: transactionDb.linkedUser.gradidoId },
  }
  const transaction: TransactionInput = {
    user,
    linkedUser,
    amount: v.parse(gradidoAmountSchema, transactionDb.amount),
    memo: v.parse(memoSchema, transactionDb.memo),
    type: InputTransactionType.GRADIDO_TRANSFER,
    createdAt: transactionDb.balanceDate,
  }
  if (transactionDb.typeId === TransactionTypeId.CREATION) {
    if (!transactionDb.creationDate) {
      throw new Error('contribution transaction without creation date')
    }
    transaction.targetDate = transactionDb.creationDate
    transaction.type = InputTransactionType.GRADIDO_CREATION
  } else if (transactionDb.typeId === TransactionTypeId.RECEIVE) {
    transaction.user = linkedUser
    transaction.linkedUser = user
  }
  if (transactionDb.transactionLinkCode) {
    if (transactionDb.typeId !== TransactionTypeId.RECEIVE) {
      throw new Error('linked transaction which isn\'t receive, send will taken care of on link creation')
    }
    transaction.user = {
      communityTopicId: recipientCommunityTopicId,
      seed: transactionDb.transactionLinkCode,
    }
    transaction.type = InputTransactionType.GRADIDO_REDEEM_DEFERRED_TRANSFER
  }
  return v.parse(transactionSchema, transaction)
}

export function transactionLinkDbToTransaction(transactionLinkDb: TransactionLinkDb, communityTopicId: HieroId): Transaction {
  return v.parse(transactionSchema, {
    user: {
      communityTopicId: communityTopicId,
      account: { userUuid: transactionLinkDb.user.gradidoId },
    },
    linkedUser: {
      communityTopicId: communityTopicId,
      seed: transactionLinkDb.code,
    },
    type: InputTransactionType.GRADIDO_DEFERRED_TRANSFER,
    amount: v.parse(gradidoAmountSchema, transactionLinkDb.amount),
    memo: v.parse(memoSchema, transactionLinkDb.memo),
    createdAt: transactionLinkDb.createdAt,
    timeoutDuration: v.parse(timeoutDurationSchema, Math.round((transactionLinkDb.validUntil.getTime() - transactionLinkDb.createdAt.getTime()) / 1000)),
  })
}

