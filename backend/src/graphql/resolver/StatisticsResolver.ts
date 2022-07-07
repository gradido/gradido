import { Resolver, Query, Arg, Args, Authorized, Ctx, Int } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { CommunityStatistics } from '@model/CommunityStatistics'
import { User as DbUser } from '@entity/User'
import { getConnection } from '@dbTools/typeorm'
import Decimal from 'decimal.js-light'

@Resolver()
export class StatisticsResolver {
  @Authorized([RIGHTS.COMMUNITY_STATISTICS])
  @Query(() => CommunityStatistics)
  async communityStatistics(): Promise<CommunityStatistics> {
    const totalUsers = await DbUser.find({ withDeleted: true })
    console.log(totalUsers.length)

    return {
      totalUsers: 12,
      activeUsers: 6,
      deletedUsers: 1,
      totalGradidoCreated: new Decimal(3000),
      totalGradidoDecayed: new Decimal(200),
      totalGradidoAvailable: new Decimal(2800),
      totalGradidoUnbookedDecayed: new Decimal(200),
    }
  }
}
