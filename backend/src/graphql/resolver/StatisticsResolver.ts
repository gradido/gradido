import { Resolver, Query, Authorized, Info } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { CommunityStatistics } from '@model/CommunityStatistics'
import { User as DbUser } from '@entity/User'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { getConnection } from '@dbTools/typeorm'
import Decimal from 'decimal.js-light'
import { calculateDecay } from '@/util/decay'

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

@Resolver()
export class StatisticsResolver {
  @Authorized([RIGHTS.COMMUNITY_STATISTICS])
  @Query(() => CommunityStatistics)
  async communityStatistics(@Info() info: any): Promise<CommunityStatistics> {
    const oneDay = 24 * 60 * 60

    info.cacheControl.setCacheHint({ maxAge: oneDay, scope: 'PUBLIC' })

    const allUsers = await DbUser.count({ withDeleted: true })
    const totalUsers = await DbUser.count()
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
      .getRawMany()

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
      .getRawOne()

    const { totalGradidoDecayed } = await queryRunner.manager
      .createQueryBuilder()
      .select('SUM(transaction.decay) AS totalGradidoDecayed')
      .from(DbTransaction, 'transaction')
      .where('transaction.decay IS NOT NULL')
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
