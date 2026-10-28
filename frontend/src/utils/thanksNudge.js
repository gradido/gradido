// AI-GENERATED — not an architecture reference

/**
 * The second ring of the waves of gratitude (W2, FEAT-25): two quiet suggestions to thank, each
 * at a moment where something has just happened between two people. The rule only -- no Vue, no
 * storage, and no clock of its own: the time always comes in as `now`, so the same moment gives
 * the same answer wherever it is asked.
 *
 * - After a video call: under one's own invitation in a conversation of two, half an hour after
 *   the call began. Bernd (26.10.2026): the end of a call cannot be measured -- it runs on a Jitsi
 *   server of its own --, its beginning can, and whoever invited is most likely in it. And in a
 *   group's thread (Bernd, 28.10.2026): there the member chooses whom to thank among the members.
 * - After a thank-you received: in the opened row of the booking, "pass it on" -- outwards, never
 *   back to the giver (the waves run outwards; a thank-you that expects one back is the market).
 *
 * Each occasion holds for seven days (F3) and then there is quiet, also for an occasion seen for
 * the first time after a long while. Whether it was answered on this device (`seen`) is the
 * caller's to say (useThanksNudges).
 *
 * And the third ring (W3), the moment of arrival: which thank-yous received the tile "Dein Dank
 * ist da." on the overview shows (`arrivalItems`), within the same seven days.
 */

/** From when on the line stands under an invitation: half an hour after the call began. */
export const THANKS_NUDGE_AFTER_CALL_MS = 30 * 60 * 1000

/** How long an occasion holds: seven days after the call began or the thank-you came. */
export const THANKS_NUDGE_HOLDS_MS = 7 * 24 * 60 * 60 * 1000

/** A moment as milliseconds: a Date or what the server sends (an ISO string). NaN for nothing. */
const at = (value) => new Date(value).getTime()

/**
 * Whether the line "Möchtest Du Dich bei … für das Gespräch bedanken?" stands under a message.
 *
 * - `invitation`: the video invitation the message is, as `readChatVideoInvite` reads it -- or
 *   null for every other message, and for an invitation the wallet does not read as its own
 *   words (another language, another clock): that one gets no line.
 * - `message`: the message as the thread holds it now. Only one's own (`mine`): the one who
 *   invited is the one asked, never the one invited. Not a copy forwarded from another
 *   conversation (E-059): its words are somebody else's, and so was the call. Not one that did
 *   not reach the other side (`FAILED`): the window does not open a room nobody else knows, so
 *   there was no call.
 * - `transfers`: the transfers between the two as the thread holds them, or null while they are
 *   not known yet -- then no line, so none stands for a moment over a thank-you on its way.
 * - `group`: the invitation went to a group. A group's thread holds no transfers (E-050 F6), and
 *   whom the member thanks is theirs to choose among the members: `transfers` is not asked there,
 *   and only the member's answer ends the line.
 * - `seen`: the member answered the line on this device already ("Danke sagen", "Jemandem
 *   danken", "Nicht jetzt").
 *
 * The call began at the time the invitation names where it is planned, else when the message was
 * written. An invitation that was changed (E-060) is read as it stands now: its time is the one
 * it shows. A thank-you sent to the person since the call began ends the occasion: it was said.
 *
 * @param {{ invitation: { when: { start: Date } | null } | null, message: { mine: boolean, forwarded?: boolean, createdAt: string, deliveryState?: string | null }, now: number, transfers: Array<{ typeId: string, balanceDate: string }> | null, group?: boolean, seen: boolean }} occasion
 * @returns {'hidden' | 'show'}
 */
export const callNudgeState = ({ invitation, message, now, transfers, group = false, seen }) => {
  if (!invitation || !message?.mine || message.forwarded || seen) return 'hidden'
  if (message.deliveryState === 'FAILED') return 'hidden'
  if (!group && !transfers) return 'hidden'
  const start = at(invitation.when?.start ?? message.createdAt)
  const since = now - start
  // Written so that a time nobody can read (NaN) is no occasion either.
  if (!(since >= THANKS_NUDGE_AFTER_CALL_MS && since <= THANKS_NUDGE_HOLDS_MS)) return 'hidden'
  if (group) return 'show'
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
 * set a first reaction mails the giver about, W1), that have no reaction yet, came within the last
 * seven days, and that the member did not put aside on this device ("Später": `seen('arrival',
 * id)`). The newest first, and at most THANKS_ARRIVAL_MOST of them.
 *
 * As for the line in the opened row, only the seven days are a bound: a booking whose time lies a
 * little ahead of the device's clock has just come. A time nobody can read is no thank-you to show.
 * Two that came at the same moment stand in the order of their ids, the later one first.
 *
 * @param {{ transactions: Array<{ id: number, typeId: string, balanceDate: string, canReact?: boolean, reaction?: string | null, linkedUser?: { gradidoID?: string } | null }> | null | undefined, now: number, seen: (kind: 'arrival', id: number) => boolean }} occasion
 * @returns {Array} the bookings themselves, as they came
 */
export const arrivalItems = ({ transactions, now, seen }) =>
  (transactions ?? [])
    .filter(
      (booking) =>
        booking?.typeId === 'RECEIVE' &&
        booking.canReact === true &&
        !booking.reaction &&
        Boolean(booking.linkedUser?.gradidoID) &&
        // Written so that a time nobody can read (NaN) is no thank-you either.
        now - at(booking.balanceDate) <= THANKS_NUDGE_HOLDS_MS &&
        !seen('arrival', booking.id),
    )
    .sort((one, other) => at(other.balanceDate) - at(one.balanceDate) || other.id - one.id)
    .slice(0, THANKS_ARRIVAL_MOST)
