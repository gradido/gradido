// AI-GENERATED — not an architecture reference
import { reactive } from 'vue'
import { setUserNoteMutation } from '@/graphql/userNotes.graphql'

/**
 * The saving of the member's own notes (useChatWindowNote), one for every window of the page: the
 * contact window stands in six places, and a person's note may be written in one while a save
 * from another is still on its way. One save at a time over all of them, and for each note only
 * its latest words wait -- older words are never sent after newer ones.
 *
 * Keyed by owner and subject (`<gradidoID>|member:<community>/<id>`, `<gradidoID>|group:<uuid>`):
 *   `notes` (reactive, for the windows): the latest words and their state -- 'waiting' (to go
 *     out), 'sending', 'failed', 'saved';
 *   `wishes`: what a save needs that is no state -- what the note is about, the client, who is
 *     signed in now, whom to tell when it fails;
 *   `confirmed`: the words the server confirmed last, and a running count of confirmations. A
 *     note asked for before a confirmation may be older than it (noteConfirmationOf).
 *
 * A module of its own without the store: the store forgets all of it on logout (forgetUserNotes).
 */
const notes = reactive(new Map())
const wishes = new Map()
const confirmed = new Map()
let confirmations = 0
let sending = false
/** Bumped on logout: a save still on its way then belongs to nobody. */
let epoch = 0

export const noteSaveOf = (key) => notes.get(key) ?? null

/**
 * The words of this note's last confirmed save, and when it was confirmed (a running count over
 * all notes; 0 for none). A window compares `at` from before and after it asked for the note.
 */
export const noteConfirmationOf = (key) => ({
  text: confirmed.get(key)?.text,
  at: confirmed.get(key)?.at ?? 0,
})

const pump = async () => {
  if (sending) return
  sending = true
  const mine = epoch
  try {
    for (;;) {
      const key = [...wishes.keys()].find((candidate) => notes.get(candidate)?.state === 'waiting')
      if (key === undefined) break
      const wish = wishes.get(key)
      // ⛔ Words of a member who is no longer the one signed in go nowhere: the request would
      // carry the next member's session, and the words would become a note of theirs.
      if (wish.owner !== wish.ownerNow()) {
        wishes.delete(key)
        notes.delete(key)
        continue
      }
      const words = wish.words
      wish.again = false
      notes.set(key, { words, state: 'sending' })
      let stored = true
      try {
        await wish.client.mutate({
          mutation: setUserNoteMutation,
          variables: { about: wish.about, note: words },
        })
      } catch {
        stored = false
      }
      if (epoch !== mine) return
      if (wishes.get(key) !== wish) continue
      if (stored) {
        confirmations += 1
        confirmed.set(key, { text: words, at: confirmations })
      }
      if (wish.again) {
        // Newer words came while these were on their way: they go next.
        notes.set(key, { words: wish.words, state: 'waiting' })
        continue
      }
      notes.set(key, { words, state: stored ? 'saved' : 'failed' })
      if (!stored) wish.onFailure?.(key)
    }
  } finally {
    if (epoch === mine) sending = false
  }
}

/**
 * The note's latest words, to be saved. While a save of the same note is on its way they wait
 * behind it; words that waited and were not sent yet are replaced.
 */
export const saveNote = ({ key, owner, about, words, client, ownerNow, onFailure }) => {
  if (owner !== ownerNow()) return
  const wish = wishes.get(key) ?? {}
  const onItsWay = notes.get(key)?.state === 'sending'
  Object.assign(wish, { owner, about, words, client, ownerNow, onFailure, again: onItsWay })
  wishes.set(key, wish)
  notes.set(key, { words, state: onItsWay ? 'sending' : 'waiting' })
  pump()
}

/** On logout: the next member on this browser must not be handed any of it. */
export const forgetUserNotes = () => {
  epoch += 1
  sending = false
  notes.clear()
  wishes.clear()
  confirmed.clear()
}
