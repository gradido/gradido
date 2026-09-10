import { CommunityStatistics, DynamicStatisticsFields } from '@model/CommunityStatistics'
import {
  AppDatabase,
  Transaction as DbTransaction,
  User as DbUser,
  dbSelectLatestUserBalances,
} from 'database'
import { GradidoUnit } from 'shared'
import { Authorized, FieldResolver, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'

const db = AppDatabase.getInstance()

@Resolver(() => CommunityStatistics)
export class StatisticsResolver {
  @Authorized([RIGHTS.COMMUNITY_STATISTICS])
  @Query(() => CommunityStatistics)
  communityStatistics(): CommunityStatistics {
    return new CommunityStatistics()
  }

  @FieldResolver(() => Number)
  async allUsers(): Promise<number> {
    return await DbUser.count({ withDeleted: true })
  }

  @FieldResolver()
  async totalUsers(): Promise<number> {
    return await DbUser.count()
  }

  @FieldResolver()
  async deletedUsers(): Promise<number> {
    return (await this.allUsers()) - (await this.totalUsers())
  }

  @FieldResolver()
  async totalGradidoCreated(): Promise<GradidoUnit> {
    const queryRunner = db.getDataSource().createQueryRunner()
    try {
      await queryRunner.connect()
      const { totalGradidoCreated } = await queryRunner.manager
        .createQueryBuilder()
        .select('SUM(transaction.amount) AS totalGradidoCreated')
        .from(DbTransaction, 'transaction')
        .where('transaction.typeId = 1')
        .getRawOne()
      return GradidoUnit.fromGradidoCent(BigInt(totalGradidoCreated))
    } finally {
      await queryRunner.release()
    }
  }

  @FieldResolver()
  async totalGradidoDecayed(): Promise<GradidoUnit> {
    const queryRunner = db.getDataSource().createQueryRunner()
    try {
      await queryRunner.connect()
      const { totalGradidoDecayed } = await queryRunner.manager
        .createQueryBuilder()
        .select('SUM(transaction.decay) AS totalGradidoDecayed')
        .from(DbTransaction, 'transaction')
        .where('transaction.decay IS NOT NULL')
        .getRawOne()
      return GradidoUnit.fromGradidoCent(BigInt(totalGradidoDecayed))
    } finally {
      await queryRunner.release()
    }
  }

  @FieldResolver()
  async dynamicStatisticsFields(): Promise<DynamicStatisticsFields> {
    let totalGradidoAvailable: GradidoUnit = new GradidoUnit(0n)
    let totalGradidoUnbookedDecayed: GradidoUnit = new GradidoUnit(0n)

    const receivedCallDate = new Date()

    const lastUserTransactions = await dbSelectLatestUserBalances()

    const activeUsers = lastUserTransactions.length

    lastUserTransactions.forEach(({ balance, balanceDate }) => {
      if (balance) {
        const decay = balance.calculateDecay(new Date(balanceDate), receivedCallDate)
        if (decay) {
          totalGradidoAvailable = totalGradidoAvailable.add(decay.balance)
          totalGradidoUnbookedDecayed = totalGradidoUnbookedDecayed.add(decay.decay)
        }
      }
    })

    return {
      activeUsers,
      totalGradidoAvailable,
      totalGradidoUnbookedDecayed,
    }
  }
}
