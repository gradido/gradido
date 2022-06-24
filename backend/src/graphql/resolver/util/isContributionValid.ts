import { backendLogger as logger } from '@/server/logger'
import Decimal from 'decimal.js-light'
import { getCreationIndex } from '../AdminResolver'

export const isContributionValid = (
  creations: Decimal[],
  amount: Decimal,
  creationDate: Date,
): boolean => {
  logger.trace('isContributionValid', creations, amount, creationDate)
  const index = getCreationIndex(creationDate.getMonth())

  if (index < 0) {
    throw new Error('No information for available creations for the given date')
  }

  if (amount.greaterThan(creations[index].toString())) {
    throw new Error(
      `The amount (${amount} GDD) to be created exceeds the amount (${creations[index]} GDD) still available for this month.`,
    )
  }

  return true
}
