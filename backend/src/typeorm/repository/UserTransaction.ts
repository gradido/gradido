import { EntityRepository, Repository } from 'typeorm'
import { Order } from '../../graphql/enum/Order'
import { UserTransaction } from '@entity/UserTransaction'
import { TransactionTypeId } from '../../graphql/enum/TransactionTypeId'

@EntityRepository(UserTransaction)
export class UserTransactionRepository extends Repository<UserTransaction> {
  findByUserPaged(
    userId: number,
    limit: number,
    offset: number,
    order: Order,
    onlyCreation?: boolean,
  ): Promise<[UserTransaction[], number]> {
    if (onlyCreation) {
      return this.createQueryBuilder('userTransaction')
        .where('userTransaction.userId = :userId', { userId })
        .andWhere('userTransaction.transactionTypeId = :transactionTypeId', {
          transactionTypeId: TransactionTypeId.CREATION,
        })
        .orderBy('userTransaction.balanceDate', order)
        .limit(limit)
        .offset(offset)
        .getManyAndCount()
    }
    return this.createQueryBuilder('userTransaction')
      .where('userTransaction.userId = :userId', { userId })
      .orderBy('userTransaction.balanceDate', order)
      .limit(limit)
      .offset(offset)
      .getManyAndCount()
  }

  findLastForUser(userId: number): Promise<UserTransaction | undefined> {
    return this.createQueryBuilder('userTransaction')
      .where('userTransaction.userId = :userId', { userId })
      .orderBy('userTransaction.transactionId', 'DESC')
      .getOne()
  }
}
