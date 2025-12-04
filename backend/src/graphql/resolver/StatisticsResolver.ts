import { CommunityStatistics, DynamicStatisticsFields } from '@model/CommunityStatistics'
import { AppDatabase, Transaction as DbTransaction, User as DbUser } from 'database'
import { Decimal } from 'decimal.js-light'
import { calculateDecay } from 'shared'
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

  @FieldResolver(() => Decimal)
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
  async totalGradidoCreated(): Promise<Decimal> {
    const queryRunner = db.getDataSource().createQueryRunner()
    try {
      await queryRunner.connect()
      const { totalGradidoCreated } = await queryRunner.manager
        .createQueryBuilder()
        .select('SUM(transaction.amount) AS totalGradidoCreated')
        .from(DbTransaction, 'transaction')
        .where('transaction.typeId = 1')
        .getRawOne()
      return totalGradidoCreated
    } finally {
      await queryRunner.release()
    }
  }

  @FieldResolver()
  async totalGradidoDecayed(): Promise<Decimal> {
    const queryRunner = db.getDataSource().createQueryRunner()
    try {
      await queryRunner.connect()
      const { totalGradidoDecayed } = await queryRunner.manager
        .createQueryBuilder()
        .select('SUM(transaction.decay) AS totalGradidoDecayed')
        .from(DbTransaction, 'transaction')
        .where('transaction.decay IS NOT NULL')
        .getRawOne()
      return totalGradidoDecayed
    } finally {
      await queryRunner.release()
    }
  }

  @FieldResolver()
  async dynamicStatisticsFields(): Promise<DynamicStatisticsFields> {
    let totalGradidoAvailable: Decimal = new Decimal(0)
    let totalGradidoUnbookedDecayed: Decimal = new Decimal(0)

    const receivedCallDate = new Date()

    const queryRunner = db.getDataSource().createQueryRunner()
    try {
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

      return {
        activeUsers,
        totalGradidoAvailable,
        totalGradidoUnbookedDecayed,
      }
    } finally {
      await queryRunner.release()
    }
  }
}
