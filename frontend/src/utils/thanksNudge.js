// AI-GENERATED — not an architecture reference
import { chatMemberKey } from './chatMemberKey'

/**
 * The second ring of the waves of gratitude (W2, FEAT-25): two quiet suggestions to thank, each
 * at a moment where something has just happened between two people. The rule only -- no Vue, no
 * storage, and no clock of its own: the time always comes in as `now`, so the same moment gives
 * the same answer wherever it is asked.
 *
 * - After a video call: half an hour after the call began, for whoever went into it from this
 *   wallet. Bernd (26.10.2026): the end of a call cannot be measured -- it runs on a Jitsi server
 *   of its own --, its beginning can. Whoever invited is most likely in it; and since 05.11.2026
 *   (E-043 C) so is whoever was invited and clicked the invitation's link here -- for them the
 *   call begins with that click. And in a group's thread (Bernd, 28.10.2026): there the member
 *   chooses whom to thank among the members -- and a member thanked since the call began is no
 *   longer among them (E-043 B, 05.11.2026). In both kinds of conversation, what was thanked is
 *   what was booked.
 * - After a thank-you received: in the opened row of the booking, "pass it on" -- outwards, never
 *   back to the giver (the waves run outwards; a thank-you that expects one back is the market).
 *
 * Each occasion holds for seven days (F3) and then there is quiet, also for an occasion seen for
 * the first time after a long while. Whether it was answered on this device (`seen`) is the
 * caller's to say (useThanksNudges).
 *
 * And the third ring (W3), the moment of arrival: which thank-yous received the tile "Dein Dank
 * ist da." on the overview shows (`arrivalItems`), within the same seven days -- and only those
 * the member has not answered since: a message to the giver or Gradido sent back, the server's
 * word (`answered`, F E-046).
 */

/** From when on the line stands under an invitation: half an hour after the call began. */
export const THANKS_NUDGE_AFTER_CALL_MS = 30 * 60 * 1000

/** How long an occasion holds: seven days after the call began or the thank-you came. */
export const THANKS_NUDGE_HOLDS_MS = 7 * 24 * 60 * 60 * 1000

/** A moment as milliseconds: a Date or what the server sends (an ISO string). NaN for nothing. */
const at = (value) => new Date(value).getTime()

/**
 * When the call of a message began, where the line after it is due by its time -- or null where
 * the message is no such occasion now, whatever was sent since. What the thread asks the member's
 * own transfers from in a group, and the beginning the rule below counts a thank-you from.
 *
 * - `invitation`: the video invitation the message is, as the thread reads it -- one's own word
 *   for word (`readChatVideoInvite`), somebody else's by its link -- or null for every other
 *   message: that one gets no line.
 * - `message`: the message as the thread holds it now. Whoever went into the call from this
 *   wallet is asked (E-043 C): the one who invited, whose invitation is their own (`mine`), and the
 *   one invited, where the device knows their click (`videoJoinedAt`). Somebody else's invitation
 *   without that click gets no line: the link may have reached them another way, or another
 *   device. Not a copy forwarded from another conversation (E-059, W10): its words are somebody
 *   else's, and so was the call -- with a click as without. Not one's own that did not reach the
 *   other side (`FAILED`): the window does not open a room nobody else knows, so there was no
 *   call.
 * - `videoJoinedAt`: when the member clicked the link of this invitation of somebody else's here
 *   (utils/chatVideoJoined), in milliseconds -- null where they did not. Not read for one's own.
 * - `seen`: the member answered the line on this device already: "Nicht jetzt" -- and "Danke
 *   sagen" in a conversation of two whose thread holds no transfers (the member's switch off).
 *
 * The call began, for the one who invited, at the time the invitation names where it is planned,
 * else when the message was written; for the one invited, with their click -- for a planned call
 * at the later of the click and the planned time (Festlegung 3: a click days before the meeting is
 * no conversation). An invitation that was changed (E-060) is read as it stands now: its time is
 * the one it shows. The line is due from half an hour after that until seven days after it.
 *
 * @param {{ invitation: { when: { start: Date } | null } | null, message: { mine: boolean, forwarded?: boolean, createdAt: string, deliveryState?: string | null }, now: number, seen: boolean, videoJoinedAt?: number | null }} occasion
 * @returns {number | null} the beginning, in milliseconds
 */
export const callNudgeStart = ({ invitation, message, now, seen, videoJoinedAt = null }) => {
  if (!invitation || !message || message.forwarded || seen) return null
  let start
  if (message.mine) {
    if (message.deliveryState === 'FAILED') return null
    start = at(invitation.when?.start ?? message.createdAt)
  } else {
    if (videoJoinedAt === null || videoJoinedAt === undefined) return null
    start = invitation.when?.start
      ? Math.max(at(videoJoinedAt), at(invitation.when.start))
      : at(videoJoinedAt)
  }
  const since = now - start
  // Written so that a time nobody can read (NaN) is no occasion either.
  if (!(since >= THANKS_NUDGE_AFTER_CALL_MS && since <= THANKS_NUDGE_HOLDS_MS)) return null
  return start
}

/**
 * Whom the member may still thank after a call in a group (E-043 B, Bernd 05.11.2026: "Der
 * eine, der mir eben gedankt hat, steht da nicht mehr"): the members as the thread makes them
 * (`{ key, label, avatar, user }`), but those the member sent a transfer to since the call began.
 * What was thanked is what was booked, as in a conversation of two -- on every device, and a
 * thank-you begun and not sent leaves the member standing. In their order (W8): nobody is marked,
 * the thanked are simply not there.
 *
 * - `transfers`: the member's own bookings (useOwnTransfers). Only a `SEND` counts, from `start`
 *   on, and only to the person the booking names: what came in (`RECEIVE`) is the other one's
 *   thank-you. A booking that names nobody meets nobody -- every member offered carries both
 *   halves of the pair (the thread's `thanksMembers`).
 * - A person is named by the pair (KF-004), without regard to case (chatMemberKey); a booking
 *   with a member of this community may name no community, and then it is this one
 *   (`ownCommunityUuid`), as the server reads it.
 *
 * @param {{ members: Array<{ user: { gradidoID: string, communityUuid: string } }>, transfers: Array<{ typeId: string, balanceDate: string, linkedUser?: { gradidoID?: string, communityUuid?: string | null } | null }> | null, start: number, ownCommunityUuid?: string | null }} occasion
 * @returns {Array} the members still to thank, in their order
 */
export const membersToThank = ({ members, transfers, start, ownCommunityUuid = null }) => {
  const thanked = new Set(
    (transfers ?? [])
      .filter((booking) => booking.typeId === 'SEND' && at(booking.balanceDate) >= start)
      .map((booking) => chatMemberKey(booking.linkedUser, ownCommunityUuid)),
  )
  return (members ?? []).filter(
    (member) => !thanked.has(chatMemberKey(member.user, ownCommunityUuid)),
  )
}

/**
 * Whether the line "Möchtest Du Dich bei … für das Gespräch bedanken?" stands under a message:
 * where it is due by its time (`callNudgeStart`, with what that reads -- `videoJoinedAt` too),
 * and nothing was thanked for the call yet. Under somebody else's invitation the one to thank in
 * a conversation of two is the one who invited, the other person. What was thanked is what was
 * booked, in both kinds of conversation:
 *
 * - `transfers`: in a conversation of two, the transfers between the two as the thread holds
 *   them; in a group, the member's own bookings (useOwnTransfers). Null while they are not known
 *   yet, or where they could not be asked -- then no line, so none stands for a moment over a
 *   thank-you on its way.
 * - With one person, a thank-you sent to them since the call began ends the occasion: it was said.
 * - `group`: the invitation went to a group. There the line stands while somebody among the
 *   `members` is left to thank (`membersToThank`); once all are thanked, it goes.
 *   `ownCommunityUuid` is the member's own community, for a booking that names none.
 *
 * @param {{ invitation: { when: { start: Date } | null } | null, message: { mine: boolean, forwarded?: boolean, createdAt: string, deliveryState?: string | null }, now: number, transfers: Array<{ typeId: string, balanceDate: string }> | null, group?: boolean, members?: Array, ownCommunityUuid?: string | null, seen: boolean, videoJoinedAt?: number | null }} occasion
 * @returns {'hidden' | 'show'}
 */
export const callNudgeState = ({
  invitation,
  message,
  now,
  transfers,
  group = false,
  members = [],
  ownCommunityUuid = null,
  seen,
  videoJoinedAt = null,
}) => {
  const start = callNudgeStart({ invitation, message, now, seen, videoJoinedAt })
  if (start === null || !transfers) return 'hidden'
  if (group) {
    return membersToThank({ members, transfers, start, ownCommunityUuid }).length > 0
      ? 'show'
      : 'hidden'
  }
  const thanked = transfers.some(
    (booking) => booking.typeId === 'SEND' && at(booking.balanceDate) >= start,
  )
  return thanked ? 'hidden' : 'show'
}

/**
 * Whether the line "Dank weitergeben?" stands in the opened row of a booking: a thank-you the
 * member received from a person (`RECEIVE` with somebody on the other side, as the row names its
 * counterparty -- never a creation, never one's own sending), within seven days of its coming,
 * and not answered on this device yet.
 *
 * Only the seven days are a bound: a booking whose time lies a little ahead of the device's clock
 * has just come, and is no reason for silence.
 *
 * @param {{ transaction: { typeId: string, balanceDate: string, linkedUser?: { gradidoID?: string } | null }, now: number, seen: boolean }} occasion
 * @returns {'hidden' | 'show'}
 */
export const passOnNudgeState = ({ transaction, now, seen }) => {
  if (seen || transaction?.typeId !== 'RECEIVE' || !transaction.linkedUser?.gradidoID) {
    return 'hidden'
  }
  return now - at(transaction.balanceDate) <= THANKS_NUDGE_HOLDS_MS ? 'show' : 'hidden'
}

/** How many thank-yous the tile on the overview shows at most (F3); the rest is the booking list's. */
export const THANKS_ARRIVAL_MOST = 3

/**
 * The thank-yous the tile "Dein Dank ist da." on the overview shows (W3): of a list of bookings,
 * those the member received from a person (`RECEIVE` with somebody named on the other side, as
 * the row names its counterparty) and may react to (`canReact` -- the server's word, and the very
 * set a first reaction mails the giver about, W1), that have no reaction yet, that the member has
 * not answered since -- a message to the giver or Gradido sent back, the server's word
 * (`answered`, F E-046) --, came within the last seven days, and that the member did not put aside
 * on this device ("Später": `seen('arrival', id)`). The newest first, and at most
 * THANKS_ARRIVAL_MOST of them.
 *
 * As for the line in the opened row, only the seven days are a bound: a booking whose time lies a
 * little ahead of the device's clock has just come. A time nobody can read is no thank-you to show.
 * Two that came at the same moment stand in the order of their ids, the later one first. A booking
 * without `answered` -- from a server that does not say it yet -- counts as not answered, and the
 * tile shows it as it did before.
 *
 * @param {{ transactions: Array<{ id: number, typeId: string, balanceDate: string, canReact?: boolean, reaction?: string | null, answered?: boolean, linkedUser?: { gradidoID?: string } | null }> | null | undefined, now: number, seen: (kind: 'arrival', id: number) => boolean }} occasion
 * @returns {Array} the bookings themselves, as they came
 */
export const arrivalItems = ({ transactions, now, seen }) =>
  (transactions ?? [])
    .filter(
      (booking) =>
        booking?.typeId === 'RECEIVE' &&
        booking.canReact === true &&
        !booking.reaction &&
        !booking.answered &&
        Boolean(booking.linkedUser?.gradidoID) &&
        // Written so that a time nobody can read (NaN) is no thank-you either.
        now - at(booking.balanceDate) <= THANKS_NUDGE_HOLDS_MS &&
        !seen('arrival', booking.id),
    )
    .sort((one, other) => at(other.balanceDate) - at(one.balanceDate) || other.id - one.id)
    .slice(0, THANKS_ARRIVAL_MOST)
