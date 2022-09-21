import { backendLogger as logger } from '@/server/logger'
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
): void => {
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
}

export const getUserCreations = async (
  ids: number[],
  includePending = true,
): Promise<CreationMap[]> => {
  logger.trace('getUserCreations:', ids, includePending)
  const months = getCreationMonths()
  logger.trace('getUserCreations months', months)

  const queryRunner = getConnection().createQueryRunner()
  await queryRunner.connect()

  const dateFilter = 'last_day(curdate() - interval 3 month) + interval 1 day'
  logger.trace('getUserCreations dateFilter', dateFilter)

  /** 
  SELECT MONTH(contribution_date) as month, user_id, created_at, sum(amount), confirmed_at, deleted_at 
   FROM `contributions`
   where user_id = 776
   and contribution_date >= last_day(curdate() - interval 3 month) + interval 1 day
   and deleted_at IS NULL
   and denied_at IS NULL
   if(!includePending) and confirmed_at IS NOT NULL
   group by month, user_id; 
  */
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
  if (!includePending) {
    sumAmountContributionPerUserAndLast3MonthQuery.andWhere('confirmed_at IS NOT NULL')
  }
  const sumAmountContributionPerUserAndLast3Month =
    await sumAmountContributionPerUserAndLast3MonthQuery.getRawMany()

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
    // const creations = months.map((month) => {
    //   const creation = openCreation.find(
    //     (raw: { month: string; userId: string; creation: number[] }) =>
    //       parseInt(raw.month) === month && parseInt(raw.userId) === id,
    //   )
    //   return MAX_CREATION_AMOUNT.minus(creation ? creation.sum : 0)
    // })
    // // eslint-disable-next-line no-console
    // console.log('id: ', id, 'creations: ', creations.toString())
    // return { id, creations }
  })
}

export const getUserCreation = async (id: number, includePending = true): Promise<Decimal[]> => {
  logger.trace('getUserCreation', id, includePending)
  const creations = await getUserCreations([id], includePending)
  return creations[0] ? creations[0].creations : FULL_CREATION_AVAILABLE
}

export const getCreationMonths = (): number[] => {
  const now = new Date(Date.now())
  return [
    now.getMonth() + 1,
    new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth() + 1,
    new Date(now.getFullYear(), now.getMonth() - 2, 1).getMonth() + 1,
  ].reverse()
}

export const getCreationIndex = (month: number): number => {
  return getCreationMonths().findIndex((el) => el === month + 1)
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

export const updateCreations = (creations: Decimal[], contribution: Contribution): Decimal[] => {
  const index = getCreationIndex(contribution.contributionDate.getMonth())

  if (index < 0) {
    throw new Error('You cannot create GDD for a month older than the last three months.')
  }
  creations[index] = creations[index].plus(contribution.amount.toString())
  return creations
}
