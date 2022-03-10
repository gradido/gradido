import { Repository, EntityRepository } from '@dbTools/typeorm'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import Decimal from 'decimal.js-light'

@EntityRepository(dbTransactionLink)
export class TransactionLinkRepository extends Repository<dbTransactionLink> {
  async sumAmountToHoldAvailable(userId: number, date: Date): Promise<Decimal> {
    const { sum } = await this.createQueryBuilder('transactionLinks')
      .select('SUM(transactionLinks.holdAvailableAmount)', 'sum')
      .where('transactionLinks.userId = :userId', { userId })
      .andWhere('transactionLinks.redeemedAt is NULL')
      .andWhere('transactionLinks.validUntil > :date', { date })
      .getRawOne()
    return sum ? new Decimal(sum) : new Decimal(0)
  }
}
