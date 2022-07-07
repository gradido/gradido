import { Resolver, Query, Authorized } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { CommunityStatistics } from '@model/CommunityStatistics'
import { User as DbUser } from '@entity/User'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { getConnection } from '@dbTools/typeorm'
import Decimal from 'decimal.js-light'
import { calculateDecay } from '@/util/decay'

@Resolver()
export class StatisticsResolver {
  @Authorized([RIGHTS.COMMUNITY_STATISTICS])
  @Query(() => CommunityStatistics)
  async communityStatistics(): Promise<CommunityStatistics> {
    const allUsers = await DbUser.find({ withDeleted: true })

    let totalUsers = 0
    let activeUsers = 0
    let deletedUsers = 0

    let totalGradidoAvailable: Decimal = new Decimal(0)
    let totalGradidoUnbookedDecayed: Decimal = new Decimal(0)

    const receivedCallDate = new Date()

    for (let i = 0; i < allUsers.length; i++) {
      if (allUsers[i].deletedAt) {
        deletedUsers++
      } else {
        totalUsers++
        const lastTransaction = await DbTransaction.findOne({
          where: { userId: allUsers[i].id },
          order: { balanceDate: 'DESC' },
        })
        if (lastTransaction) {
          activeUsers++
          const decay = calculateDecay(
            lastTransaction.balance,
            lastTransaction.balanceDate,
            receivedCallDate,
          )
          if (decay) {
            totalGradidoAvailable = totalGradidoAvailable.plus(decay.balance.toString())
            totalGradidoUnbookedDecayed = totalGradidoUnbookedDecayed.plus(decay.decay.toString())
          }
        }
      }
    }

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()

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
