// https://www.npmjs.com/package/@apollo/protobufjs
import { AccountType } from '@dltConnector/enum/AccountType'
import { TransactionType } from '@dltConnector/enum/TransactionType'

import { AccountIdentifier } from './AccountIdentifier'
import { Community as DbCommunity, Contribution as DbContribution, User as DbUser } from 'database'
import { CommunityAccountIdentifier } from './CommunityAccountIdentifier'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

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
  // only for deferred transaction
  timeoutDuration?: number
  // only for register address
  accountType?: AccountType

  static createRegisterAddress(user: DbUser, community: DbCommunity): TransactionDraft | null {
    if (community.hieroTopicId) {
      const draft = new TransactionDraft()
      draft.user = new AccountIdentifier(community.hieroTopicId, new CommunityAccountIdentifier(user.gradidoID))
      draft.type = TransactionType.REGISTER_ADDRESS
      draft.createdAt = user.createdAt.toISOString()
      draft.accountType = AccountType.COMMUNITY_HUMAN
      return draft
    } else {
      logger.warn(`missing topicId for community ${community.id}`)    
    }
    return null
  }

  static createContribution(contribution: DbContribution, createdAt: Date, signingUser: DbUser, community: DbCommunity): TransactionDraft | null {
    if (community.hieroTopicId) {
      const draft = new TransactionDraft()
      draft.user = new AccountIdentifier(community.hieroTopicId, new CommunityAccountIdentifier(contribution.user.gradidoID))
      draft.linkedUser = new AccountIdentifier(community.hieroTopicId, new CommunityAccountIdentifier(signingUser.gradidoID))
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

  static createTransfer(sendingUser: DbUser, receivingUser: DbUser, amount: string, memo: string, createdAt: Date): TransactionDraft | null {
    if (!sendingUser.community  || !receivingUser.community) {
      throw new Error(`missing community for user ${sendingUser.id} and/or ${receivingUser.id}`)
    }
    const senderUserTopic = sendingUser.community.hieroTopicId
    const receiverUserTopic = receivingUser.community.hieroTopicId
    if (!senderUserTopic || !receiverUserTopic) {
      throw new Error(`missing topicId for community ${sendingUser.community.id} and/or ${receivingUser.community.id}`)
    }
    const draft = new TransactionDraft()
    draft.user = new AccountIdentifier(senderUserTopic, new CommunityAccountIdentifier(sendingUser.gradidoID))
    draft.linkedUser = new AccountIdentifier(receiverUserTopic, new CommunityAccountIdentifier(receivingUser.gradidoID))
    draft.type = TransactionType.GRADIDO_TRANSFER
    draft.createdAt = createdAt.toISOString()
    draft.amount = amount
    draft.memo = memo
    return draft
  }
}