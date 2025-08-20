import { Contribution } from 'database'
import { Decimal } from 'decimal.js-light'

import { OpenCreation } from '@model/OpenCreation'

import { FULL_CREATION_AVAILABLE, MAX_CREATION_AMOUNT } from '@/graphql/resolver/const/const'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'
import { getFirstDayOfPreviousNMonth } from 'core'
import { AppDatabase } from 'database'
import { getLogger } from 'log4js'

const db = AppDatabase.getInstance()
const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.creations`)

interface CreationMap {
  id: number
  creations: Decimal[]
}

export const validateContribution = (
  creations: Decimal[],
  amount: Decimal,
  creationDate: Date,
  timezoneOffset: number,
): void => {
  logger.trace('isContributionValid: ', creations, amount, creationDate)
  const index = getCreationIndex(creationDate.getMonth(), timezoneOffset)

  if (index < 0) {
    throw new LogError('No information for available creations for the given date', creationDate)
  }

  if (amount.greaterThan(creations[index].toString())) {
    throw new LogError(
      'The amount to be created exceeds the amount still available for this month',
      amount,

      creations[index],
    )
  }
}

export const getUserCreations = async (
  ids: number[],
  timezoneOffset: number,
  includePending = true,
): Promise<CreationMap[]> => {
  logger.trace('getUserCreations:', ids, includePending)
  const months = getCreationMonths(timezoneOffset)
  logger.trace('getUserCreations months', months)

  const queryRunner = db.getDataSource().createQueryRunner()
  await queryRunner.connect()

  const dateFilter = 'last_day(curdate() - interval 3 month) + interval 1 day'
  logger.trace('getUserCreations dateFilter=', dateFilter)

  const sumAmountContributionPerUserAndLast3MonthQuery = queryRunner.manager
    .createQueryBuilder(Contribution, 'c')
    .select('month(contribution_date)', 'month')
    .addSelect('user_id', 'userId')
    .addSelect('sum(amount)', 'sum')
    .where(`user_id in (${ids.toString()})`)
    .andWhere(`contribution_date >= ${dateFilter}`)
    .andWhere('deleted_at IS NULL')
    .andWhere('denied_at IS NULL')
    .groupBy('month')
    .addGroupBy('userId')
    .orderBy('month', 'DESC')

  if (!includePending) {
    sumAmountContributionPerUserAndLast3MonthQuery.andWhere('confirmed_at IS NOT NULL')
  }

  const sumAmountContributionPerUserAndLast3Month =
    await sumAmountContributionPerUserAndLast3MonthQuery.getRawMany()

  logger.trace(sumAmountContributionPerUserAndLast3Month)

  await queryRunner.release()

  return ids.map((id) => {
    return {
      id,
      creations: months.map((month) => {
        const creation = sumAmountContributionPerUserAndLast3Month.find(
          (raw: { month: string; userId: string; creation: number[] }) =>
            parseInt(raw.month) === month && parseInt(raw.userId) === id,
        )
        return MAX_CREATION_AMOUNT.minus(creation ? creation.sum : 0)
      }),
    }
  })
}

export const getUserCreation = async (
  id: number,
  timezoneOffset: number,
  includePending = true,
): Promise<Decimal[]> => {
  logger.trace('getUserCreation', id, includePending, timezoneOffset)
  const creations = await getUserCreations([id], timezoneOffset, includePending)
  logger.trace('getUserCreation  creations=', creations)
  return creations[0] ? creations[0].creations : FULL_CREATION_AVAILABLE
}

const getCreationMonths = (timezoneOffset: number): number[] => {
  return getCreationDates(timezoneOffset).map((date) => date.getMonth() + 1)
}

const getCreationDates = (timezoneOffset: number): Date[] => {
  const clientNow = new Date()
  clientNow.setTime(clientNow.getTime() - timezoneOffset * 60 * 1000)
  logger.info(
    `getCreationMonths -- offset: ${timezoneOffset} -- clientNow: ${clientNow.toISOString()}`,
  )
  return [
    getFirstDayOfPreviousNMonth(clientNow, 2),
    getFirstDayOfPreviousNMonth(clientNow, 1),
    clientNow,
  ]
}

const getCreationIndex = (month: number, timezoneOffset: number): number => {
  return getCreationMonths(timezoneOffset).findIndex((el) => el === month + 1)
}

export const isStartEndDateValid = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): void => {
  if (!startDate) {
    throw new LogError('A Start-Date must be set')
  }

  if (!endDate) {
    throw new LogError('An End-Date must be set')
  }

  // check if endDate is before startDate
  if (new Date(endDate).getTime() - new Date(startDate).getTime() < 0) {
    throw new LogError(`The value of validFrom must before or equals the validTo`)
  }
}

export const updateCreations = (
  creations: Decimal[],
  contribution: Contribution,
  timezoneOffset: number,
): Decimal[] => {
  const index = getCreationIndex(contribution.contributionDate.getMonth(), timezoneOffset)

  if (index < 0) {
    throw new LogError('You cannot create GDD for a month older than the last three months')
  }

  creations[index] = creations[index].plus(contribution.amount.toString())
  return creations
}

export const isValidDateString = (dateString: string): boolean => {
  return new Date(dateString).toString() !== 'Invalid Date'
}

export const getOpenCreations = async (
  userId: number,
  timezoneOffset: number,
): Promise<OpenCreation[]> => {
  const creations = await getUserCreation(userId, timezoneOffset)
  const creationDates = getCreationDates(timezoneOffset)
  return creationDates.map((date, index) => {
    return {
      month: date.getMonth(),
      year: date.getFullYear(),

      amount: creations[index],
    }
  })
}
