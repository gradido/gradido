// AI-GENERATED — not an architecture reference

/**
 * Why the server did not change a message (E-060), for the bar's and the dialog's own words --
 * read off the error's message, as `chatImageRefusal` reads a refused picture:
 * - NOT_CONFIRMED -- the message is one to a member of another community, and their server did
 *   not take the change: it refused, does not know changes yet, could not be reached, or there is
 *   no way to it (CHAT_MESSAGE_NOT_EDITED: NOT_CONFIRMED | NO_WAY_TO_DELIVER). Nothing changed, on
 *   either side.
 * - PENDING -- the message is still on its way to the other server; a moment later it can be
 *   changed.
 * - OTHER -- everything else: the server could not be reached, or refused for a reason the wallet
 *   does not offer a change for in the first place.
 */
export const chatEditProblem = (error) => {
  const message = String(error?.message ?? '')
  if (!message.includes('CHAT_MESSAGE_NOT_EDITED')) return 'OTHER'
  if (message.includes('NOT_CONFIRMED') || message.includes('NO_WAY_TO_DELIVER')) {
    return 'NOT_CONFIRMED'
  }
  if (message.includes('PENDING')) return 'PENDING'
  return 'OTHER'
}

/** When a message was changed last, as a number; NaN for one never changed. */
const changedAt = (message) => Date.parse(message.editedAt ?? '')

/**
 * Whether `now` is an earlier state of the message than `held`: changed before it -- or never,
 * where the held one was. Two answers of the server can pass each other on their way: the beat
 * read the message before one's own change of it and comes in after that change's answer.
 */
const isEarlierState = (now, held) => {
  const heldAt = changedAt(held)
  if (Number.isNaN(heldAt)) return false
  const nowAt = changedAt(now)
  return Number.isNaN(nowAt) || nowAt < heldAt
}

/**
 * A page of a thread with the changed messages in the place of the ones it holds (E-060), by
 * their id -- and which of them were in fact another message than the one held: the same change
 * comes again with the next beats for some seconds, and is no news then. Messages the page does
 * not hold are passed over: a page loaded later brings them as they stand. So is a state earlier
 * than the one the page holds (`isEarlierState`): the text never goes back to one it had before.
 * Of two states of the same message in `edited`, the last one counts.
 *
 * @param {object[]} held the messages of the page
 * @param {object[]} edited the changed messages, of any conversation
 * @returns {{ messages: object[], changed: object[] }} `messages` is `held` itself where nothing changed
 */
export const withChatMessagesEdited = (held, edited) => {
  const byId = new Map()
  for (const message of edited) {
    const before = byId.get(message.id)
    if (!before || !isEarlierState(message, before)) byId.set(message.id, message)
  }
  const changed = []
  const messages = held.map((message) => {
    const now = byId.get(message.id)
    if (!now || (now.body === message.body && now.editedAt === message.editedAt)) return message
    if (isEarlierState(now, message)) return message
    changed.push(now)
    return now
  })
  return { messages: changed.length > 0 ? messages : held, changed }
}
