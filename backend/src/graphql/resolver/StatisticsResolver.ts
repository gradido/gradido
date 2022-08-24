import { Resolver, Query, Authorized } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { CommunityStatistics } from '@model/CommunityStatistics'
import { User as DbUser } from '@entity/User'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { getConnection, IsNull, Not } from '@dbTools/typeorm'
import Decimal from 'decimal.js-light'
import { calculateDecay } from '@/util/decay'

@Resolver()
export class StatisticsResolver {
  @Authorized([RIGHTS.COMMUNITY_STATISTICS])
  @Query(() => CommunityStatistics)
  async communityStatistics(): Promise<CommunityStatistics> {
    const oneDay = 24 * 60 * 60 * 1000

    const allUsers = await DbUser.count({ withDeleted: true, cache: oneDay })
    const totalUsers = await DbUser.count({ cache: oneDay })
    const deletedUsers = allUsers - totalUsers

    let totalGradidoAvailable: Decimal = new Decimal(0)
    let totalGradidoUnbookedDecayed: Decimal = new Decimal(0)

    const receivedCallDate = new Date()

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()

    const lastUserTransactions = await queryRunner.manager
      .createQueryBuilder(DbUser, 'user')
      .select('transaction.balance', 'balance')
      .addSelect('transaction.balance_date', 'balanceDate')
      .innerJoin(DbTransaction, 'transaction', 'user.id = transaction.user_id')
      .where(
        `transaction.balance_date = (SELECT MAX(t.balance_date) FROM transactions AS t WHERE t.user_id = user.id)`,
      )
      .orderBy('transaction.balance_date', 'DESC')
      .addOrderBy('transaction.id', 'DESC')
      .cache(oneDay)
      .getRawMany()

    console.log('time', new Date().getTime() - receivedCallDate.getTime())

    const activeUsers = lastUserTransactions.length

    lastUserTransactions.forEach(({ balance, balanceDate }) => {
      const decay = calculateDecay(new Decimal(balance), new Date(balanceDate), receivedCallDate)
      if (decay) {
        totalGradidoAvailable = totalGradidoAvailable.plus(decay.balance.toString())
        totalGradidoUnbookedDecayed = totalGradidoUnbookedDecayed.plus(decay.decay.toString())
      }
    })

    const { totalGradidoCreated } = await queryRunner.manager
      .createQueryBuilder()
      .select('SUM(transaction.amount) AS totalGradidoCreated')
      .from(DbTransaction, 'transaction')
      .where('transaction.typeId = 1')
      .cache(oneDay)
      .getRawOne()

    const { totalGradidoDecayed } = await queryRunner.manager
      .createQueryBuilder()
      .select('SUM(transaction.decay) AS totalGradidoDecayed')
      .from(DbTransaction, 'transaction')
      .where('transaction.decay IS NOT NULL')
      .cache(oneDay)
      .getRawOne()

    return {
      totalUsers,
      activeUsers,
      deletedUsers,
      totalGradidoCreated,
      totalGradidoDecayed,
      totalGradidoAvailable,
      totalGradidoUnbookedDecayed,
    }
  }
}
