import { EntityRepository, Repository } from '@dbTools/typeorm'
import { Transaction } from '@entity/Transaction'
import { Order } from '@enum/Order'
import { TransactionTypeId } from '@enum/TransactionTypeId'

@EntityRepository(Transaction)
export class TransactionRepository extends Repository<Transaction> {
  findByUserPaged(
    userId: number,
    limit: number,
    offset: number,
    order: Order,
    onlyCreation?: boolean,
  ): Promise<[Transaction[], number]> {
    const query = this.createQueryBuilder('userTransaction')
      .leftJoinAndSelect(
        'userTransaction.contribution',
        'contribution',
        'userTransaction.id = contribution.transactionId',
      )
      .where('userTransaction.userId = :userId', { userId })

    if (onlyCreation) {
      query.andWhere('userTransaction.typeId = :typeId', {
        typeId: TransactionTypeId.CREATION,
      })
    }

    return query
      .orderBy('userTransaction.balanceDate', order)
      .limit(limit)
      .offset(offset)
      .getManyAndCount()
  }
}
