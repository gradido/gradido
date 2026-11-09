// AI-GENERATED — not an architecture reference
import { CommunitiesSelect } from 'database'
import {
  AVATAR_FULL_MAX_BYTES,
  AVATAR_FULL_MAX_SIDE,
  AVATAR_SMALL_MAX_BYTES,
  AVATAR_SMALL_MAX_SIDE,
  Result,
  uuidv4Schema,
  XComRequestError,
} from 'shared'
import { probeImage } from 'shared-native'
import * as v from 'valibot'
import { readTransferAvatarDate } from '../../apis'
import { decodeJpegImage } from '../../logic/JpegImage.logic'
import { ApiClientCompleted } from '../ApiClient'
import { ApiClientCache } from '../ApiClientCache'

// Asks another community about the pictures of ITS members. This community stores none of the
// pictures that come back (AS-004).
//
// ★ Whatever the other community does wrong is a Result, never a throw: no answer in time, a
// refusal, an answer that does not hold up. For the caller that means no faces from there this
// time. A question that could never be right (no ids, too many) throws in ApiClient.
//
// ⛔ The other community is authenticated, not trusted: what passes here goes to the wallet as
// it is. So each answer is read against what was asked -- one date that does not parse would
// make GraphQL answer the member's whole request with null, this community's own faces
// included -- and one defect fails the whole answer.

const PICTURE_BOUNDS = {
  small: { maxBytes: AVATAR_SMALL_MAX_BYTES, maxSide: AVATAR_SMALL_MAX_SIDE },
  full: { maxBytes: AVATAR_FULL_MAX_BYTES, maxSide: AVATAR_FULL_MAX_SIDE },
}

/**
 * Why a picture is not handed on, or null: longer than a picture of its kind may be, not plain
 * base64, not begun and ended as a JPEG, a header that is no JPEG's, or more pixels on a side
 * than this community takes of its own members. It reads the header and no more -- it bounds
 * what a picture costs whoever shows it, and says nothing about what else the file carries.
 * The length is asked first and on the string: 100 members may be asked about at once.
 */
const pictureDefect = (avatar: string, kind: 'small' | 'full'): string | null => {
  const { maxBytes, maxSide } = PICTURE_BOUNDS[kind]
  if (avatar.length > Math.ceil(maxBytes / 3) * 4) {
    return 'is too long'
  }
  const decoded = decodeJpegImage(avatar, maxBytes)
  if (!decoded.success) {
    return `is ${decoded.error.reason}`
  }
  // Buffer.from skips what is no base64 instead of failing; the wallet puts the string into
  // an address, where it has to be exactly that.
  if (decoded.value.toString('base64') !== avatar) {
    return 'is not plain base64'
  }
  const probed = probeImage(decoded.value)
  if (!probed.success || probed.value.format !== 'jpeg') {
    return 'has no JPEG header'
  }
  if (probed.value.width > maxSide || probed.value.height > maxSide) {
    return 'has too many pixels'
  }
  return null
}

const pictureSchema = (kind: 'small' | 'full') =>
  v.pipe(
    v.string(),
    v.rawCheck(({ dataset, addIssue }) => {
      const defect = dataset.typed && pictureDefect(dataset.value, kind)
      if (defect) {
        // the reason, never the picture
        addIssue({ message: `a picture that ${defect}` })
      }
    }),
  )

// the same rule as for a date that travels with a transfer
const avatarDateSchema = v.pipe(
  v.string(),
  v.check((date) => readTransferAvatarDate(date) !== null, 'an unusable date'),
  v.transform((date) => new Date(date)),
)

/** Only members that were asked about, each at most once: that also bounds the answer. */
const onlyAsked = <TMember extends { gradidoId: string }>(gradidoIds: string[]) =>
  v.check((members: TMember[]) => {
    const open = new Set(gradidoIds)
    return members.every((member) => open.delete(member.gradidoId))
  }, 'a member nobody asked about, or one twice')

const memberDateSchema = v.object({ gradidoId: uuidv4Schema, avatarUpdatedAt: avatarDateSchema })
const memberSmallSchema = v.object({ ...memberDateSchema.entries, avatar: pictureSchema('small') })

export type ForeignMemberAvatar = v.InferOutput<typeof memberSmallSchema>
export type ForeignMemberAvatarDate = v.InferOutput<typeof memberDateSchema>

async function ask<TSchema extends v.GenericSchema>(
  community: CommunitiesSelect,
  call: (
    client: ApiClientCompleted,
  ) => Promise<{ data: unknown; error: { status: unknown } | null }>,
  answerSchema: TSchema,
): Promise<Result<v.InferOutput<TSchema>, XComRequestError>> {
  const failure = (reason: string) => ({
    success: false as const,
    error: new XComRequestError(community.communityUuid, reason),
  })
  const { data, error } = await call(ApiClientCache.getInstance().get(community))
  if (error) {
    return failure(`answered with status ${error.status}`)
  }
  const answer = v.safeParse(answerSchema, data)
  if (!answer.success) {
    return failure(`the answer carries ${answer.issues[0].message}`)
  }
  return { success: true, value: answer.output }
}

/** The small renditions, for a list. */
export const xcomMemberAvatarsSmall = (community: CommunitiesSelect, gradidoIds: string[]) =>
  ask(
    community,
    (client) => client.memberAvatarsSmall({ gradidoIds }),
    v.pipe(v.array(memberSmallSchema), onlyAsked<ForeignMemberAvatar>(gradidoIds)),
  )

/** Only the dates (AS-019). */
export const xcomMemberAvatarDates = (community: CommunitiesSelect, gradidoIds: string[]) =>
  ask(
    community,
    (client) => client.memberAvatarDates({ gradidoIds }),
    v.pipe(v.array(memberDateSchema), onlyAsked<ForeignMemberAvatarDate>(gradidoIds)),
  )

/** The full rendition of one member, for the zoom (AS-020), or null. */
export const xcomMemberAvatarFull = (community: CommunitiesSelect, gradidoId: string) =>
  ask(
    community,
    (client) => client.memberAvatarFull({ gradidoId }),
    v.nullable(pictureSchema('full')),
  )
