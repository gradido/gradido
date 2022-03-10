import { Repository, EntityRepository } from '@dbTools/typeorm'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import Decimal from 'decimal.js-light'

@EntityRepository(dbTransactionLink)
export class TransactionLinkRepository extends Repository<dbTransactionLink> {
  async sumAmounts(
    userId: number,
    date: Date,
  ): Promise<{ sumHoldAvailableAmount: Decimal; sumAmount: Decimal }> {
    const { sumHoldAvailableAmount, sumAmount } = await this.createQueryBuilder('transactionLinks')
      .select('SUM(transactionLinks.holdAvailableAmount)', 'sumHoldAvailableAmount')
      .addSelect('SUM(transactionLinks.amount)', 'sumAmount')
      .where('transactionLinks.userId = :userId', { userId })
      .andWhere('transactionLinks.redeemedAt is NULL')
      .andWhere('transactionLinks.validUntil > :date', { date })
      .orderBy('transactionLinks.createdAt', 'DESC')
      .getRawOne()
    return {
      sumHoldAvailableAmount: sumHoldAvailableAmount
        ? new Decimal(sumHoldAvailableAmount)
        : new Decimal(0),
      sumAmount: sumAmount ? new Decimal(sumAmount) : new Decimal(0),
    }
  }
}
