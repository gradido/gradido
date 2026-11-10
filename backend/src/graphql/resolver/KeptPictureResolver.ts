// AI-GENERATED — not an architecture reference
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { KeptPicture } from '@model/KeptPicture'
import { databaseErrorCode } from 'core'
import {
  dbCountUserKeptPicturesBesides,
  dbDeleteUserKeptPicture,
  dbSelectUserKeptPictureFull,
  dbSelectUserKeptPicturesSmall,
  dbUpsertUserKeptPicture,
  UserKeptPictureSubject,
} from 'database'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import {
  KEPT_PICTURE_LIST_COUNTS,
  KEPT_PICTURES_MAX_PER_MEMBER,
  KEPT_PICTURES_MAX_PER_REQUEST,
  keptPictureSubjectOf,
} from '@/data/KeptPictures.logic'
import { USER_AVATARS_ACCEPTED_MAX_PER_REQUEST } from '@/data/MemberAvatars.logic'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { acceptAvatarRenditions } from './util/acceptAvatarRenditions'
import { resolveCommunityUuid } from './util/communities'

/**
 * A member's own picture of a contact (Bernd, 10.11.2026, AS-023/AS-024): shown instead of the
 * contact's own face wherever that contact stands in the member's wallet, and seen by nobody else.
 *
 * ⛔ Only the member reads it. Every query here is the signed-in member's own, by `user.id`; none
 * takes whose pictures to read as an argument. Nothing of a kept picture reaches the person it
 * shows, another community, the admin, a mail or a printed card, and none of it is written to the
 * log: the request log writes no variables, and leaves out the answer of a request that read one
 * (plugins.ts, `keptPicturesServed`) -- WHO keeps a picture of WHOM is the member's alone as well.
 *
 * The right of the contacts: a picture is the member's own, as the hearts and the notes are.
 */
@Resolver()
export class KeptPictureResolver {
  /** Every picture the member keeps, small, for the lists of the wallet. */
  @Authorized([RIGHTS.MANAGE_OWN_CONTACTS])
  @Query(() => [KeptPicture])
  async keptPictures(@Ctx() context: Context): Promise<KeptPicture[]> {
    const user = getUser(context)
    countServed(context, KEPT_PICTURE_LIST_COUNTS)
    const rows = await fromDatabase(() => dbSelectUserKeptPicturesSmall(user.id))
    return rows.map((row) => {
      const picture = new KeptPicture()
      picture.gradidoID = row.subjectGradidoId
      picture.communityUuid = row.subjectCommunityUuid
      picture.picture = row.pictureSmall.toString('base64')
      return picture
    })
  }

  /** The member's picture of this person at full size, for the enlarged view; null where none. */
  @Authorized([RIGHTS.MANAGE_OWN_CONTACTS])
  @Query(() => String, { nullable: true })
  async keptPictureFull(
    @Arg('ref', () => MemberAvatarRefInput) ref: MemberAvatarRefInput,
    @Ctx() context: Context,
  ): Promise<string | null> {
    const user = getUser(context)
    countServed(context, 1)
    const subject = await subjectOf(ref)
    const full = await fromDatabase(() => dbSelectUserKeptPictureFull(user.id, subject))
    return full.success ? full.value.toString('base64') : null
  }

  /**
   * Sets the member's picture of this person, replacing the one before. Taken in as the member's
   * own profile picture is (acceptAvatarRenditions): both renditions decoded and encoded again,
   * once in an HTTP request -- counted together with that one.
   */
  @Authorized([RIGHTS.MANAGE_OWN_CONTACTS])
  @Mutation(() => Boolean)
  async setKeptPicture(
    @Arg('ref', () => MemberAvatarRefInput) ref: MemberAvatarRefInput,
    @Arg('pictureSmall') pictureSmall: string,
    @Arg('pictureFull') pictureFull: string,
    @Ctx() context: Context,
  ): Promise<boolean> {
    context.requestBudget.userAvatarsAccepted += 1
    const accepted = context.requestBudget.userAvatarsAccepted
    if (accepted > USER_AVATARS_ACCEPTED_MAX_PER_REQUEST) {
      throw new LogError('Too many avatar images sent at once', accepted)
    }
    const user = getUser(context)
    const subject = await subjectOf(ref)
    // Counted before the pictures are worked on. Two requests at the very same moment may both
    // pass at the last free place; the limit is there against endless growth, not to the picture.
    const others = await fromDatabase(() => dbCountUserKeptPicturesBesides(user.id, subject))
    if (others >= KEPT_PICTURES_MAX_PER_MEMBER) {
      throw new LogError('KEPT_PICTURES_FULL')
    }
    const { small, full } = await acceptAvatarRenditions(pictureSmall, pictureFull)
    await fromDatabase(() =>
      dbUpsertUserKeptPicture({
        userId: user.id,
        subjectCommunityUuid: subject.communityUuid,
        subjectGradidoId: subject.gradidoId,
        pictureSmall: small,
        pictureFull: full,
        mimeType: 'image/jpeg',
      }),
    )
    return true
  }

  /** Takes the member's picture of this person away; where there is none, nothing happens. */
  @Authorized([RIGHTS.MANAGE_OWN_CONTACTS])
  @Mutation(() => Boolean)
  async removeKeptPicture(
    @Arg('ref', () => MemberAvatarRefInput) ref: MemberAvatarRefInput,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const user = getUser(context)
    const subject = await subjectOf(ref)
    await fromDatabase(() => dbDeleteUserKeptPicture(user.id, subject))
    return true
  }
}

/**
 * ⛔ Counted in the HTTP request's budget: a document may repeat a field under any number of
 * aliases (RequestBudget). The count also keeps the answer of a request that read one out of the
 * log (plugins.ts).
 */
const countServed = (context: Context, weight: number): void => {
  context.requestBudget.keptPicturesServed += weight
  const served = context.requestBudget.keptPicturesServed
  if (served > KEPT_PICTURES_MAX_PER_REQUEST) {
    throw new LogError('Too many kept pictures asked for at once', served)
  }
}

/**
 * ⛔ What the database throws does not leave this resolver: a failed query carries its parameters
 * in its message, and they are the person a picture is of -- and, writing, the picture. Thrown on,
 * they would be written to the request log and sent back in the answer. The log gets the
 * database's error code (as UserNoteResolver does), reading as well as writing.
 */
const fromDatabase = async <T>(query: () => Promise<T>): Promise<T> => {
  try {
    return await query()
  } catch (error) {
    throw new LogError('KEPT_PICTURE_NOT_STORED', databaseErrorCode(error))
  }
}

const subjectOf = async (ref: MemberAvatarRefInput): Promise<UserKeptPictureSubject> =>
  keptPictureSubjectOf(ref.gradidoID, await resolveCommunityUuid(ref.communityUuid))
