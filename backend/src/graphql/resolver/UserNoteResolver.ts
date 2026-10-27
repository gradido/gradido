// AI-GENERATED — not an architecture reference
import { SetUserNoteArgs } from '@arg/SetUserNoteArgs'
import { UserNoteSubjectInput } from '@input/UserNoteSubjectInput'
import { dbDeleteUserNote, dbSelectUserNote, dbUpsertUserNote, UserNoteSubject } from 'database'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { isEmptyNote, USER_NOTES_MAX_PER_REQUEST, userNoteSubjectOf } from '@/data/UserNote.logic'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { resolveCommunityUuid } from './util/communities'

/**
 * A member's own notes on a person or a group (Bernd, 27.10.2026): the button beside the
 * magnifier of a chat window. Only the member reads them -- every query here is the signed-in
 * member's own, by `user.id`, and nothing of a note reaches the person or the group it is about,
 * another community, or the log (filterVariables, and the answer of a request that read one).
 *
 * The right of the contacts: a note is the member's own, as the hearts are.
 */
@Resolver()
export class UserNoteResolver {
  /** The member's note on this person or group; null where they keep none. */
  @Authorized([RIGHTS.MANAGE_OWN_CONTACTS])
  @Query(() => String, { nullable: true })
  async userNote(
    @Arg('about', () => UserNoteSubjectInput) about: UserNoteSubjectInput,
    @Ctx() context: Context,
  ): Promise<string | null> {
    const user = getUser(context)
    countNote(context)
    return dbSelectUserNote(user.id, await subjectOf(about))
  }

  /** Writes the note anew; an emptied note takes it away. */
  @Authorized([RIGHTS.MANAGE_OWN_CONTACTS])
  @Mutation(() => Boolean)
  async setUserNote(
    @Args() { about, note }: SetUserNoteArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const user = getUser(context)
    countNote(context)
    const subject = await subjectOf(about)
    if (isEmptyNote(note)) {
      await dbDeleteUserNote(user.id, subject)
    } else {
      await dbUpsertUserNote(user.id, subject, note)
    }
    return true
  }
}

/**
 * ⛔ Counted in the HTTP request's budget: a document may repeat a field under any number of
 * aliases (RequestBudget). The count also keeps the answer of a request that read a note out of
 * the log (plugins.ts).
 */
const countNote = (context: Context): void => {
  context.requestBudget.userNotesServed += 1
  const served = context.requestBudget.userNotesServed
  if (served > USER_NOTES_MAX_PER_REQUEST) {
    throw new LogError('Too many notes asked for at once', served)
  }
}

const subjectOf = async (about: UserNoteSubjectInput): Promise<UserNoteSubject> => {
  const memberCommunityUuid = about.member
    ? await resolveCommunityUuid(about.member.communityUuid)
    : ''
  const subject = userNoteSubjectOf(about, memberCommunityUuid)
  if (!subject) {
    throw new LogError('A note is about one member or one group')
  }
  return subject
}
