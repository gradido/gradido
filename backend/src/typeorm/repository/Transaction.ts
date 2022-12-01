import { EntityRepository, Repository } from '@dbTools/typeorm'
import { Contribution } from '@entity/Contribution'
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
    if (onlyCreation) {
      return this.createQueryBuilder('userTransaction')
        .innerJoinAndSelect(
          'userTransaction.contribution',
          'c',
          'userTransaction.id = c.transactionId',
        )
        .where('userTransaction.userId = :userId', { userId })
        .andWhere('userTransaction.typeId = :typeId', {
          typeId: TransactionTypeId.CREATION,
        })
        .orderBy('userTransaction.balanceDate', order)
        .limit(limit)
        .offset(offset)
        .getManyAndCount()
    }
    return this.createQueryBuilder('userTransaction')
      .innerJoinAndSelect(
        'userTransaction.contribution',
        'c',
        'userTransaction.id = c.transactionId',
      )
      .where('userTransaction.userId = :userId', { userId })
      .orderBy('userTransaction.balanceDate', order)
      .limit(limit)
      .offset(offset)
      .getManyAndCount()
  }

  findLastForUser(userId: number): Promise<Transaction | undefined> {
    return this.createQueryBuilder('userTransaction')
      .innerJoinAndMapOne(
        'userTransaction.contribution',
        Contribution,
        'c',
        'userTransaction.id = c.transactionId',
      )
      .where('userTransaction.userId = :userId', { userId })
      .orderBy('userTransaction.balanceDate', 'DESC')
      .getOne()
  }
}
