// AI-GENERATED — not an architecture reference

/**
 * A message the member sent to one person, said to whoever listens (W3b, F E-046): the tile "Dein
 * Dank ist da." on the overview hears it, and a thank-you of that person leaves the tile at once.
 * A conversation can stand OVER the overview -- opened from the column beside it, in the contact
 * window -- and a member who wrote there and closed the window would see the thank-you still
 * standing until the overview was opened anew.
 *
 * The server holds the truth: every booking says whether its thank-you was answered (`answered`),
 * and every opening of the overview asks again. This only saves the member that reopening.
 *
 * ⛔ An event, not a store, as onTransactionReaction is (useTransactionReactions): nothing of it
 * stays behind -- nothing in the store, nothing on the device.
 */

const listeners = new Set()

/**
 * Listens for the messages the member sends to one person: `{ gradidoID, communityUuid }`, the
 * pair as the thread names its person (a missing community is this one). Returns the function that
 * stops listening.
 */
export const onChatMessageSent = (listener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Says to everybody who listens that the member sent a message to this person. Only for a message
 * the server took, and never for one to a group: a group is no answer to one person.
 *
 * ⛔ Throws nothing, whatever a listener does: the thread says it while it settles what became of
 * the message, and a failure here would read as a message not sent -- its words kept in the bar,
 * where a second press would send them twice. A listener's failure is its own, and the others
 * still hear.
 */
export const noteChatMessageSent = ({ gradidoID, communityUuid = null }) => {
  for (const listener of [...listeners]) {
    try {
      listener({ gradidoID, communityUuid })
    } catch {
      // The listener's own: see above.
    }
  }
}
