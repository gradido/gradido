/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { getConnection } from '@dbTools/typeorm'
import { TransactionLink as DbTransactionLink } from '@entity/TransactionLink'
import { Decimal } from 'decimal.js-light'

import { LogError } from '@/server/LogError'

export const transactionLinkSummary = async (
  userId: number,
  date: Date,
): Promise<{
  sumHoldAvailableAmount: Decimal
  sumAmount: Decimal
  lastDate: Date | null
  firstDate: Date | null
  transactionLinkcount: number
}> => {
  const queryRunner = getConnection().createQueryRunner()
  try {
    await queryRunner.connect()
    const { sumHoldAvailableAmount, sumAmount, lastDate, firstDate, count } =
      await queryRunner.manager
        .createQueryBuilder(DbTransactionLink, 'transactionLink')
        .select('SUM(transactionLink.holdAvailableAmount)', 'sumHoldAvailableAmount')
        .addSelect('SUM(transactionLink.amount)', 'sumAmount')
        .addSelect('MAX(transactionLink.validUntil)', 'lastDate')
        .addSelect('MIN(transactionLink.createdAt)', 'firstDate')
        .addSelect('COUNT(*)', 'count')
        .where('transactionLink.userId = :userId', { userId })
        .andWhere('transactionLink.redeemedAt is NULL')
        .andWhere('transactionLink.validUntil > :date', { date })
        .orderBy('transactionLink.createdAt', 'DESC')
        .getRawOne()
    return {
      sumHoldAvailableAmount: sumHoldAvailableAmount
        ? new Decimal(sumHoldAvailableAmount)
        : new Decimal(0),
      sumAmount: sumAmount ? new Decimal(sumAmount) : new Decimal(0),
      lastDate: lastDate || null,
      firstDate: firstDate || null,
      transactionLinkcount: count || 0,
    }
  } catch (err) {
    throw new LogError('Unable to get transaction link summary', err)
  } finally {
    await queryRunner.release()
  }
}
