import { EntityRepository, Repository } from 'typeorm'
import { Order } from '../../graphql/enum/Order'
import { UserTransaction } from '../entity/UserTransaction'

@EntityRepository(UserTransaction)
export class UserTransactionRepository extends Repository<UserTransaction> {
  findByUserPaged(
    userId: number,
    limit: number,
    offset: number,
    order: Order,
  ): Promise<[UserTransaction[], number]> {
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
