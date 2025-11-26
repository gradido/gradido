// https://www.npmjs.com/package/@apollo/protobufjs
import { AccountType } from '@dltConnector/enum/AccountType'
import { TransactionType } from '@dltConnector/enum/TransactionType'
import {
  Community as DbCommunity,
  Contribution as DbContribution,
  TransactionLink as DbTransactionLink,
  User as DbUser,
} from 'database'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { CODE_VALID_DAYS_DURATION } from '@/graphql/resolver/const/const'
import { AccountIdentifier } from './AccountIdentifier'
import { CommunityAccountIdentifier } from './CommunityAccountIdentifier'
import { IdentifierSeed } from './IdentifierSeed'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.dltConnector.model.TransactionDraft`)

export class TransactionDraft {
  user: AccountIdentifier
  // not used for simply register address
  linkedUser?: AccountIdentifier
  // not used for register address
  amount?: string
  memo?: string
  type: TransactionType
  createdAt: string
  // only for creation transaction
  targetDate?: string
  // only for deferred transaction, duration in seconds
  timeoutDuration?: number
  // only for register address
  accountType?: AccountType

  static createRegisterAddress(user: DbUser, community: DbCommunity): TransactionDraft | null {
    if (community.hieroTopicId) {
      const draft = new TransactionDraft()
      draft.user = new AccountIdentifier(
        community.hieroTopicId,
        new CommunityAccountIdentifier(user.gradidoID),
      )
      draft.type = TransactionType.REGISTER_ADDRESS
      draft.createdAt = user.createdAt.toISOString()
      draft.accountType = AccountType.COMMUNITY_HUMAN
      return draft
    } else {
      logger.warn(`missing topicId for community ${community.id}`)
    }
    return null
  }

  static createContribution(
    contribution: DbContribution,
    createdAt: Date,
    signingUser: DbUser,
    community: DbCommunity,
  ): TransactionDraft | null {
    if (community.hieroTopicId) {
      const draft = new TransactionDraft()
      draft.user = new AccountIdentifier(
        community.hieroTopicId,
        new CommunityAccountIdentifier(contribution.user.gradidoID),
      )
      draft.linkedUser = new AccountIdentifier(
        community.hieroTopicId,
        new CommunityAccountIdentifier(signingUser.gradidoID),
      )
      draft.type = TransactionType.GRADIDO_CREATION
      draft.createdAt = createdAt.toISOString()
      draft.amount = contribution.amount.toString()
      draft.memo = contribution.memo
      draft.targetDate = contribution.contributionDate.toISOString()
      return draft
    } else {
      logger.warn(`missing topicId for community ${community.id}`)
    }
    return null
  }

  static createTransfer(
    sendingUser: DbUser,
    receivingUser: DbUser,
    amount: string,
    memo: string,
    createdAt: Date,
  ): TransactionDraft | null {
    if (!sendingUser.community || !receivingUser.community) {
      throw new Error(`missing community for user ${sendingUser.id} and/or ${receivingUser.id}`)
    }
    const senderUserTopic = sendingUser.community.hieroTopicId
    const receiverUserTopic = receivingUser.community.hieroTopicId
    if (!senderUserTopic || !receiverUserTopic) {
      throw new Error(
        `missing topicId for community ${sendingUser.community.id} and/or ${receivingUser.community.id}`,
      )
    }
    const draft = new TransactionDraft()
    draft.user = new AccountIdentifier(
      senderUserTopic,
      new CommunityAccountIdentifier(sendingUser.gradidoID),
    )
    draft.linkedUser = new AccountIdentifier(
      receiverUserTopic,
      new CommunityAccountIdentifier(receivingUser.gradidoID),
    )
    draft.type = TransactionType.GRADIDO_TRANSFER
    draft.createdAt = createdAt.toISOString()
    draft.amount = amount
    draft.memo = memo
    return draft
  }

  static createDeferredTransfer(
    sendingUser: DbUser,
    transactionLink: DbTransactionLink,
  ): TransactionDraft | null {
    if (!sendingUser.community) {
      throw new Error(`missing community for user ${sendingUser.id}`)
    }
    const senderUserTopic = sendingUser.community.hieroTopicId
    if (!senderUserTopic) {
      throw new Error(`missing topicId for community ${sendingUser.community.id}`)
    }
    const draft = new TransactionDraft()
    draft.user = new AccountIdentifier(
      senderUserTopic,
      new CommunityAccountIdentifier(sendingUser.gradidoID),
    )
    draft.linkedUser = new AccountIdentifier(
      senderUserTopic,
      new IdentifierSeed(transactionLink.code),
    )
    draft.type = TransactionType.GRADIDO_DEFERRED_TRANSFER
    draft.createdAt = transactionLink.createdAt.toISOString()
    draft.amount = transactionLink.amount.toString()
    draft.memo = transactionLink.memo
    draft.timeoutDuration = CODE_VALID_DAYS_DURATION * 24 * 60 * 60
    return draft
  }

  static redeemDeferredTransfer(
    transactionLink: DbTransactionLink,
    amount: string,
    createdAt: Date,
    recipientUser: DbUser,
  ): TransactionDraft | null {
    if (!transactionLink.user.community) {
      throw new Error(`missing community for user ${transactionLink.user.id}`)
    }
    if (!recipientUser.community) {
      throw new Error(`missing community for user ${recipientUser.id}`)
    }
    const senderUserTopic = transactionLink.user.community.hieroTopicId
    if (!senderUserTopic) {
      throw new Error(`missing topicId for community ${transactionLink.user.community.id}`)
    }
    const recipientUserTopic = recipientUser.community.hieroTopicId
    if (!recipientUserTopic) {
      throw new Error(`missing topicId for community ${recipientUser.community.id}`)
    }
    const draft = new TransactionDraft()
    draft.user = new AccountIdentifier(senderUserTopic, new IdentifierSeed(transactionLink.code))
    draft.linkedUser = new AccountIdentifier(
      recipientUserTopic,
      new CommunityAccountIdentifier(recipientUser.gradidoID),
    )
    draft.type = TransactionType.GRADIDO_REDEEM_DEFERRED_TRANSFER
    draft.createdAt = createdAt.toISOString()
    draft.amount = amount
    return draft
  }
}
