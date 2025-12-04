import { Paginated } from '@arg/Paginated'
import { ContributionMessageType } from '@enum/ContributionMessageType'
import { ContributionMessage as DbContributionMessage } from 'database'
import { In } from 'typeorm'

interface FindContributionMessagesOptions {
  contributionId: number
  pagination: Paginated
  showModeratorType?: boolean
}

export const findContributionMessages = async (
  options: FindContributionMessagesOptions,
): Promise<[DbContributionMessage[], number]> => {
  const { contributionId, pagination, showModeratorType } = options

  const messageTypes = [ContributionMessageType.DIALOG, ContributionMessageType.HISTORY]

  if (showModeratorType) {
    messageTypes.push(ContributionMessageType.MODERATOR)
  }
  const { currentPage, pageSize, order } = pagination
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
