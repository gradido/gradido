import { EntityRepository, Repository } from '@dbTools/typeorm'
import { Transaction } from '@entity/Transaction'

import { Order } from '@enum/Order'

@EntityRepository(Transaction)
export class TransactionRepository extends Repository<Transaction> {
  findByUserPaged(
    userId: number,
    limit: number,
    offset: number,
    order: Order,
  ): Promise<[Transaction[], number]> {
    const query = this.createQueryBuilder('userTransaction')
      .leftJoinAndSelect(
        'userTransaction.previousTransaction',
        'transaction',
        'userTransaction.previous = transaction.id',
      )
      .where('userTransaction.userId = :userId', { userId })

    return query
      .orderBy('userTransaction.balanceDate', order)
      .limit(limit)
      .offset(offset)
      .getManyAndCount()
  }
}
