// AI-GENERATED — not an architecture reference
import {
  Community as DbCommunity,
  dbFindMemberAvatarTimestamps,
  dbUpsertForeignMemberAvatarDates,
  getCommunityByPublicKeyOrFail,
} from 'database'
import { getLogger } from 'log4js'
import { Ed25519PublicKey } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../../config/const'
import { EncryptedTransferArgs } from '../../../graphql/model/EncryptedTransferArgs'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.xcom.transferAvatarDate`)

/** The earliest picture date taken from another community. */
export const TRANSFER_AVATAR_DATE_EARLIEST = new Date('2020-01-01T00:00:00.000Z')
/** How far a picture date may lie ahead of this server's clock: the other clock may run fast. */
export const TRANSFER_AVATAR_DATE_MAX_AHEAD_MS = 24 * 60 * 60 * 1000

/**
 * A picture date as another server wrote it. It arrives as parsed JSON, so this checks what
 * came: a string exactly as `toISOString()` writes it (`2026-09-15T06:00:00.000Z`, the form both
 * senders use -- MemberAvatarsResolver and memberAvatarDateForTransfer), not before
 * TRANSFER_AVATAR_DATE_EARLIEST and at most TRANSFER_AVATAR_DATE_MAX_AHEAD_MS after `now`.
 * Anything else is null -- a missing field, null, a number, an object, text that is no date, the
 * year 1 or 9999.
 *
 * Only that one form, because Date.parse takes more: it rolls an impossible day over (February
 * 30th becomes March 2nd) and reads a string without an offset in the time zone of the server
 * reading it. A date that does not print back as the very same string is not taken.
 *
 * The window exists because a stored date goes out again: the booking list and the contact list
 * hand it to every wallet that shows the member (`avatarUpdatedAt`). The dates in an answer to
 * `memberAvatars` are read with the same function (xcomMemberAvatars), so both ways a picture
 * date arrives from another community -- with a transfer and with that answer -- share one rule.
 */
export const readTransferAvatarDate = (value: unknown, now = new Date()): Date | null => {
  if (typeof value !== 'string') {
    return null
  }
  const time = Date.parse(value)
  if (
    Number.isNaN(time) ||
    time < TRANSFER_AVATAR_DATE_EARLIEST.getTime() ||
    time > now.getTime() + TRANSFER_AVATAR_DATE_MAX_AHEAD_MS
  ) {
    return null
  }
  // After the checks above: toISOString throws for an invalid date, and this one is valid.
  const date = new Date(time)
  return date.toISOString() === value ? date : null
}

/**
 * When `userId`, a member of this community, last changed the picture members may see -- as an
 * ISO string for a transfer payload, or null. The rule is in the query
 * (dbFindMemberAvatarTimestamps, mayBeShownToMembers: switch on, not deleted, not foreign), so a
 * member who switched the picture off travels as null, like one without a picture.
 *
 * A failing read is logged and answers null; the transfer then goes out without a date.
 */
export async function memberAvatarDateForTransfer(
  userId: number,
  deps = { readDates: dbFindMemberAvatarTimestamps },
): Promise<string | null> {
  try {
    const dates = await deps.readDates([userId])
    return dates.get(userId)?.toISOString() ?? null
  } catch (err) {
    logger.warn('picture date for a transfer not read', err)
    return null
  }
}

/**
 * Files the picture date of ONE member of another community under the pair
 * (`communityUuid`, `gradidoId`) in `foreign_member_avatar_dates` -- the row the date refresh
 * keeps (refreshForeignMemberAvatarDates) and the booking list and the contact list read.
 *
 * ⛔ The pair is taken as given. Callers pass the community whose JWT key the date was verified
 * with -- never a community uuid read from the payload.
 *
 * Only a usable date is written (readTransferAvatarDate). A missing date (a server without the
 * field) and null (nothing to show) write nothing: a withdrawn picture reaches this community
 * with the date refresh. A failing write is logged and returns -- it runs after the money has
 * moved, and its callers carry on either way.
 */
export async function storeForeignMemberAvatarDate(
  communityUuid: string | null,
  gradidoId: unknown,
  value: unknown,
  deps = { upsert: dbUpsertForeignMemberAvatarDates },
): Promise<void> {
  if (!communityUuid || typeof gradidoId !== 'string') {
    logger.debug('picture date of a member of another community without a pair to file it under')
    return
  }
  const avatarUpdatedAt = readTransferAvatarDate(value)
  if (!avatarUpdatedAt) {
    if (value !== undefined && value !== null) {
      logger.warn(
        'unusable picture date of a member of another community discarded',
        typeof value === 'string' ? value.slice(0, 64) : typeof value,
      )
    }
    return
  }
  try {
    await deps.upsert([{ communityUuid, gradidoId, avatarUpdatedAt, checkedAt: new Date() }])
  } catch (err) {
    logger.warn('picture date of a member of another community not stored', err)
  }
}

/**
 * The receiving side of a settle (federation settleSendCoins): files the sender's picture date
 * under the community that SIGNED `args`. It is looked up by `args.publicKey`, the way
 * interpretEncryptedTransferArgs finds the community whose JWT key it verifies the envelope with,
 * and the date is filed only if that community has completed the authentication handshake
 * (`authenticatedAt`) -- the date refresh, too, asks only communities that have
 * (dbSelectAuthenticatedForeignCommunities).
 *
 * The community half of the pair comes from that community's own row; the payload's
 * `senderCommunityUuid` is not read. The member half is the payload's `senderUserUuid`.
 *
 * A signer that cannot be found is logged and returns. The write is storeForeignMemberAvatarDate,
 * which logs its own failure and returns.
 */
export async function storeTransferSenderAvatarDate(
  args: EncryptedTransferArgs,
  payload: { senderUserUuid: unknown; senderAvatarUpdatedAt?: unknown },
  deps = { findCommunity: getCommunityByPublicKeyOrFail, store: storeForeignMemberAvatarDate },
): Promise<void> {
  let requestingCom: DbCommunity
  try {
    requestingCom = await deps.findCommunity(new Ed25519PublicKey(args.publicKey))
  } catch (err) {
    logger.warn('community that signed the transfer not found, picture date not stored', err)
    return
  }
  if (!requestingCom.authenticatedAt) {
    logger.debug('community that signed the transfer has not completed the handshake')
    return
  }
  await deps.store(
    requestingCom.communityUuid,
    payload.senderUserUuid,
    payload.senderAvatarUpdatedAt,
  )
}
