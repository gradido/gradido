import { ContributionMessage as DbContributionMessage } from '@entity/ContributionMessage'

import { Order } from '@enum/Order'

interface FindContributionMessagesOptions {
  contributionId: number
  pageSize: number
  currentPage: number
  order: Order
}

export const findContributionMessages = async (
  options: FindContributionMessagesOptions,
): Promise<[DbContributionMessage[], number]> => {
  const { contributionId, pageSize, currentPage, order } = options
  return DbContributionMessage.findAndCount({
    where: {
      contributionId,
    },
    relations: ['user'],
    order: {
      createdAt: order,
    },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })
}
