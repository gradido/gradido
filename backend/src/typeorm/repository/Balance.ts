import { EntityRepository, Repository } from 'typeorm'
import { Balance } from '../entity/Balance'

@EntityRepository(Balance)
export class BalanceRepository extends Repository<Balance> {
  findByUser(userId: number): Promise<Balance | undefined> {
    return this.createQueryBuilder('balance').where('balance.userId = :userId', { userId }).getOne()
  }
}
