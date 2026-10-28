// AI-GENERATED — not an architecture reference
import { SetUserRemarkArgs } from '@arg/SetUserRemarkArgs'
import { UserRemark } from '@model/UserRemark'
import { databaseErrorCode } from 'core'
import {
  dbDeleteUserRemark,
  dbSelectUserRemark,
  dbUpsertUserRemark,
  remarkEditorName,
} from 'database'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { isEmptyRemark } from '@/data/UserRemark.logic'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { countRemark } from './util/countRemark'

/**
 * The moderation's remark on a member (Bernd, 28.10.2026): beside the pin and the arrow of an
 * opened contribution, a few words every moderator reads and writes -- "Bürgermeisterin von
 * Lieblingsstadt", "Tochter von Ramona" --, so that nobody has to search the member's history of
 * contributions for them again. One remark per member, and every moderator writes on it: the last
 * one to write wins, as for every field the admin interface saves.
 *
 * Only the moderation reads it: MANAGE_USER_REMARKS is in MODERATOR_RIGHTS and in no lesser set,
 * so the member it is about cannot ask for it. Nothing of it reaches the log (filterVariables, and
 * the answer of a request that read one).
 *
 * No event per change, unlike the other writes of the moderation: the admin interface saves while
 * the moderator types (after every pause), and an event for each would bury the others. Who wrote
 * the remark last, and when, stands in its row and beside it on the screen.
 */
@Resolver()
export class UserRemarkResolver {
  /** The remark on this member; null where the moderation keeps none. */
  @Authorized([RIGHTS.MANAGE_USER_REMARKS])
  @Query(() => UserRemark, { nullable: true })
  async userRemark(
    @Arg('userId', () => Int) userId: number,
    @Ctx() context: Context,
  ): Promise<UserRemark | null> {
    countRemark(context)
    return dbSelectUserRemark(userId)
  }

  /**
   * Writes the remark anew, by the signed-in moderator; an emptied remark takes it away. Answers
   * what it wrote -- the words, the time and the moderator's name -- and null where it took the
   * remark away: what the admin interface shows beside the field next.
   *
   * ⛔ What the database throws does not leave this method: a failed query carries its parameters
   * in its message, and one of them is the remark. Thrown on, it would be written to the request
   * log and sent back in the answer. The log gets the database's error code (as UserNoteResolver
   * does).
   */
  @Authorized([RIGHTS.MANAGE_USER_REMARKS])
  @Mutation(() => UserRemark, { nullable: true })
  async setUserRemark(
    @Args() { userId, remark }: SetUserRemarkArgs,
    @Ctx() context: Context,
  ): Promise<UserRemark | null> {
    const moderator = getUser(context)
    countRemark(context)
    try {
      if (isEmptyRemark(remark)) {
        await dbDeleteUserRemark(userId)
        return null
      }
      const updatedAt = new Date()
      await dbUpsertUserRemark(userId, remark, moderator.id, updatedAt)
      return {
        remark,
        updatedAt,
        updatedByName: remarkEditorName(moderator.firstName, moderator.lastName),
      }
    } catch (error) {
      throw new LogError('USER_REMARK_NOT_STORED', databaseErrorCode(error))
    }
  }
}
