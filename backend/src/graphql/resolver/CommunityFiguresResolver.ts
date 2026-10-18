// AI-GENERATED — not an architecture reference
import { CommunityFiguresArgs } from '@arg/CommunityFiguresArgs'
import { CommunityFigures } from '@model/CommunityFigures'
import { Args, Authorized, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { countCommunityFigures } from '@/data/CommunityFigures.logic'

@Resolver()
export class CommunityFiguresResolver {
  // Sums, never who -- for moderators: over a window chosen to the millisecond, a sum can tell
  // one person's step (RIGHTS.COMMUNITY_FIGURES).
  @Authorized([RIGHTS.COMMUNITY_FIGURES])
  @Query(() => CommunityFigures)
  async communityFigures(@Args() { since }: CommunityFiguresArgs): Promise<CommunityFigures> {
    return { since, rows: await countCommunityFigures(since, new Date()) }
  }
}
