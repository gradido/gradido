import { In } from 'typeorm'
import { ContributionMessage as DbContributionMessage } from 'database'

import { ContributionMessageType } from '@enum/ContributionMessageType'
import { Order } from '@enum/Order'

interface FindContributionMessagesOptions {
  contributionId: number
  pageSize: number
  currentPage: number
  order: Order
  showModeratorType?: boolean
}

export const findContributionMessages = async (
  options: FindContributionMessagesOptions,
): Promise<[DbContributionMessage[], number]> => {
  const { contributionId, pageSize, currentPage, order, showModeratorType } = options

  const messageTypes = [ContributionMessageType.DIALOG, ContributionMessageType.HISTORY]

  if (showModeratorType) messageTypes.push(ContributionMessageType.MODERATOR)

  return DbContributionMessage.findAndCount({
    where: {
      contributionId,
      type: In(messageTypes),
    },
    relations: ['user'],
    order: {
      createdAt: order,
    },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })
}
