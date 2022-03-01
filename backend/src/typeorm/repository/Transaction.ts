import { EntityRepository, Repository } from '@dbTools/typeorm'
import { Transaction } from '@entity/Transaction'
import { Order } from '../../graphql/enum/Order'
import { TypeId } from '../../graphql/enum/TypeId'

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
        .where('userTransaction.userId = :userId', { userId })
        .andWhere('userTransaction.typeId = :typeId', {
          typeId: TypeId.CREATION,
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

  findLastForUser(userId: number): Promise<Transaction | undefined> {
    return this.createQueryBuilder('userTransaction')
      .where('userTransaction.userId = :userId', { userId })
      .orderBy('userTransaction.balanceDate', 'DESC')
      .getOne()
  }
}
