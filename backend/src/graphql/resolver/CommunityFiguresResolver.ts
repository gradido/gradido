// AI-GENERATED — not an architecture reference
import { CommunityFiguresArgs } from '@arg/CommunityFiguresArgs'
import { CommunityFigures } from '@model/CommunityFigures'
import { Args, Authorized, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { countCommunityFigures } from '@/data/CommunityFigures.logic'

@Resolver()
export class CommunityFiguresResolver {
  // Sums, never who: behind the right of the statistics page, which every member holds.
  @Authorized([RIGHTS.COMMUNITY_STATISTICS])
  @Query(() => CommunityFigures)
  async communityFigures(@Args() { since }: CommunityFiguresArgs): Promise<CommunityFigures> {
    return { since, rows: await countCommunityFigures(since, new Date()) }
  }
}
