// AI-GENERATED — not an architecture reference

/**
 * Words of a member's own note (useChatWindowNote) that a chat window sent and the server has not
 * yet confirmed, by owner and subject. A window that opens on the same note meanwhile -- the same
 * one, or the same person's window in another place -- shows them rather than what the server
 * answers, which may be older, and sends them once more: the same words twice are the same note.
 *
 * A module of its own, without imports: the store forgets them on logout, and the composable,
 * which reads the store, must not be imported by it.
 */
const unconfirmed = new Map()

export const keepUnconfirmedNote = (key, text) => {
  unconfirmed.set(key, text)
}

export const unconfirmedNote = (key) => unconfirmed.get(key)

/** Confirmed: gone, unless newer words have been kept since. */
export const confirmNote = (key, text) => {
  if (unconfirmed.get(key) === text) unconfirmed.delete(key)
}

/** On logout: the next member on this browser must not be handed them. */
export const forgetUserNotes = () => {
  unconfirmed.clear()
}
