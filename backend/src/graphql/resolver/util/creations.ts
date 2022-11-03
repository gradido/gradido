import { backendLogger as logger } from '@/server/logger'
import {
  dateCompare,
  // eslint-disable-next-line camelcase
  getIsoDateStringAs_YYYYMMDD_String,
  getMonthDifference,
} from '@/util/utilities'
import { getConnection } from '@dbTools/typeorm'
import { Contribution } from '@entity/Contribution'
import Decimal from 'decimal.js-light'
import { FULL_CREATION_AVAILABLE, MAX_CREATION_AMOUNT } from '../const/const'

interface CreationMap {
  id: number
  creations: Decimal[]
}

export const validateContribution = (
  creations: Decimal[],
  amount: Decimal,
  creationDate: Date,
  clientRequestTime: Date,
): void => {
  logger.info('validateContribution', creations, amount, creationDate, clientRequestTime)
  const index = getCreationIndex(clientRequestTime, creationDate.getMonth())

  if (index < 0) {
    logger.error(
      'No information for available creations with the given creationDate=',
      creationDate.toISOString(),
    )
    throw new Error('No information for available creations for the given date')
  }

  if (getMonthDifference(creationDate, clientRequestTime) > 2) {
    logger.error(
      `It's not allowed to create a contribution with a creationDate=${getIsoDateStringAs_YYYYMMDD_String(
        creationDate.toISOString(),
      )} three month before clientRequestTime=${getIsoDateStringAs_YYYYMMDD_String(
        clientRequestTime.toISOString(),
      )}`,
    )
    throw new Error(
      `It's not allowed to create a contribution with a creationDate=${getIsoDateStringAs_YYYYMMDD_String(
        creationDate.toISOString(),
      )} three month before clientRequestTime=${getIsoDateStringAs_YYYYMMDD_String(
        clientRequestTime.toISOString(),
      )}`,
    )
  }

  if (amount.greaterThan(creations[index].toString())) {
    logger.error(
      `The amount (${amount} GDD) to be created exceeds the amount (${creations[index]} GDD) still available for this month.`,
    )
    throw new Error(
      `The amount (${amount} GDD) to be created exceeds the amount (${creations[index]} GDD) still available for this month.`,
    )
  }
}

export const getUserCreations = async (
  ids: number[],
  clientRequestTime: Date,
  includePending = true,
): Promise<CreationMap[]> => {
  logger.debug(
    `getUserCreations: ids='${ids}', clientRequestTime='${clientRequestTime}', includePending='${includePending}'`,
  )
  const usedDate = getAheadDate(clientRequestTime)
  const months = getCreationMonths(usedDate)
  logger.trace('getUserCreations months', months)

  const queryRunner = getConnection().createQueryRunner()
  await queryRunner.connect()
  const capturedCreationQuery = queryRunner.manager
    .createQueryBuilder(Contribution, 'c')
    .select('month(contribution_date)', 'month')
    .addSelect('user_id', 'userId')
    .addSelect('sum(amount)', 'sum')
    .where(`user_id in (${ids.toString()})`)
    .andWhere(
      `contribution_date > DATE_SUB(last_day('${usedDate.toISOString()}'), INTERVAL 4 MONTH)`,
    )
    .andWhere('deleted_at IS NULL')
    .andWhere('denied_at IS NULL')
    .groupBy('month')
    .addGroupBy('userId')
    .orderBy('month', 'DESC')
  if (!includePending) {
    logger.info(`query contributions include confirmed ones...`)
    capturedCreationQuery.andWhere('confirmed_at IS NOT NULL')
  }
  const capturedCreation = await capturedCreationQuery.getRawMany()
  logger.info('capturedCreation', capturedCreation)

  await queryRunner.release()

  return ids.map((id) => {
    return {
      id,
      creations: months.map((month) => {
        const creation = capturedCreation.find(
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
  clientRequestTime: Date,
  includePending = true,
): Promise<Decimal[]> => {
  logger.debug(
    `getUserCreations: id='${id}', clientRequestTime='${clientRequestTime}', includePending='${includePending}'`,
  )
  const creations = await getUserCreations([id], clientRequestTime, includePending)
  logger.debug('getUserCreation  creations=', creations)
  return creations[0] ? creations[0].creations : FULL_CREATION_AVAILABLE
}

export const getCreationMonths = (usedDate: Date): number[] => {
  return [
    new Date(usedDate.getFullYear(), usedDate.getMonth() - 2, 1).getMonth() + 1,
    new Date(usedDate.getFullYear(), usedDate.getMonth() - 1, 1).getMonth() + 1,
    usedDate.getMonth() + 1,
  ]
}

export const getCreationIndex = (usedDate: Date, month: number): number => {
  return getCreationMonths(usedDate).findIndex((el) => el === month + 1)
}

export const isStartEndDateValid = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): void => {
  if (!startDate) {
    logger.error('Start-Date is not initialized. A Start-Date must be set!')
    throw new Error('Start-Date is not initialized. A Start-Date must be set!')
  }

  if (!endDate) {
    logger.error('End-Date is not initialized. An End-Date must be set!')
    throw new Error('End-Date is not initialized. An End-Date must be set!')
  }

  // check if endDate is before startDate
  if (new Date(endDate).getTime() - new Date(startDate).getTime() < 0) {
    logger.error(`The value of validFrom must before or equals the validTo!`)
    throw new Error(`The value of validFrom must before or equals the validTo!`)
  }
}

export const updateCreations = (
  usedDate: Date,
  creations: Decimal[],
  contribution: Contribution,
): Decimal[] => {
  const index = getCreationIndex(usedDate, contribution.contributionDate.getMonth())

  if (index < 0) {
    throw new Error('You cannot create GDD for a month older than the last three months.')
  }
  creations[index] = creations[index].plus(contribution.amount.toString())
  return creations
}

export const getAheadDate = (clientRequestTime: Date): Date => {
  let usedDate = new Date()
  if (dateCompare(clientRequestTime, usedDate) > 0) {
    usedDate = clientRequestTime
  }
  logger.info(`getAheadDate(${clientRequestTime.toISOString()}) returns ${usedDate.toISOString()}`)
  return usedDate
}
