// AI-GENERATED — not an architecture reference
import { shallowReactive } from 'vue'

// Pictures the server serves one member at a time, by a number -- the photo of a thank-you
// greeting by the id of its link, the photo sent with a transfer by the id of the booking --,
// asked for when their place comes into sight and kept for the rest of the session.
//
// The way of the chat's pictures (useChatImages), and for its reasons:
// ⛔ in MEMORY only, never in the device's storage and never in the vuex store, which is written
//   whole into localStorage;
// ⛔ no base64 in Apollo's cache: the query is asked `no-cache`.
//
// One at a time: a list shows five pictures, a conversation two or three, and nginx lets one
// address have five requests at once -- beside everything else a page asks for.
//
// ⛔ Every kind of number has a store of ITS OWN (createMemoryPictures makes one): the id of a
// link and the id of a booking are two ranges of numbers, and what is kept under the one is
// never found under the other.

/** A JPEG in base64 as an address an <img> can show -- no object to give back to the browser. */
const addressOf = (base64) => `data:image/jpeg;base64,${base64}`

const isId = (id) => Number.isInteger(id) && id > 0

/**
 * A store of such pictures.
 *
 * @param {object} asked
 * @param {object} asked.query the document that answers with one picture as base64, or null
 * @param {string} asked.variable the name of its one variable -- the number the picture is asked by
 * @param {string} asked.field the field of the answer that holds the picture
 */
export const createMemoryPictures = ({ query, variable, field }) => {
  /** id -> { state: 'loading' | 'ready' | 'missing' | 'failed', src }. An entry is replaced whole. */
  const pictures = shallowReactive(new Map())

  /** The line the requests stand in: each begins when the one before has its answer. */
  let line = Promise.resolve()

  /**
   * Bumped when everything is let go. An answer asked for before belongs to nobody: it may not be
   * put back into the store of the next member on this browser.
   */
  let epoch = 0

  /**
   * What is known about the picture of an id: `{ state, src }` -- `src` only where the state is
   * 'ready' -- or null where nobody has asked for it yet. Reactive: a place that reads it here is
   * drawn anew when the picture comes.
   */
  const picture = (id) => pictures.get(id) ?? null

  const fetchOne = async (client, id, askedIn) => {
    // Let go meanwhile: the member who asked has signed out.
    if (askedIn !== epoch) return
    let entry
    try {
      const { data } = await client.query({
        query,
        variables: { [variable]: id },
        fetchPolicy: 'no-cache',
      })
      const base64 = data?.[field] ?? null
      // Null is the server's answer for "not for you, not there, not any more", without a reason.
      entry = base64 ? { state: 'ready', src: addressOf(base64) } : { state: 'missing', src: null }
    } catch {
      // The line, not the picture: asked again the next time its place is drawn.
      entry = { state: 'failed', src: null }
    }
    if (askedIn === epoch) pictures.set(id, entry)
  }

  /**
   * Asks for the picture of an id, unless it is here or on its way already. One that failed (the
   * line, not the picture) is asked for again; one the server said nothing about stays "missing".
   *
   * `client`: the Apollo client, from the asking component's setup (`useApolloClient`).
   */
  const request = (client, id) => {
    if (!isId(id)) return
    const known = pictures.get(id)
    if (known && known.state !== 'failed') return
    pictures.set(id, { state: 'loading', src: null })
    const askedIn = epoch
    line = line.then(() => fetchOne(client, id, askedIn))
  }

  /**
   * The picture for whatever has to WAIT for it: asks for it where nobody has, and resolves with
   * what is known of it once every request in line has its answer. Never rejects.
   *
   * @returns {Promise<{ state: string, src: string | null } | null>} as `picture` gives it
   */
  const awaitPicture = async (client, id) => {
    request(client, id)
    await line
    return picture(id)
  }

  /** A picture the wallet made itself a moment ago, kept under the id the server gave. */
  const remember = (id, base64) => {
    if (!isId(id) || !base64) return
    pictures.set(id, { state: 'ready', src: addressOf(base64) })
  }

  /**
   * Lets every picture go -- at logout: the next member to sign in on this browser must not be
   * handed the pictures of the one before. What stands in line is not asked for, and an answer
   * still on its way is dropped when it lands (`epoch`).
   */
  const forgetAll = () => {
    epoch += 1
    line = Promise.resolve()
    pictures.clear()
  }

  return { picture, request, awaitPicture, remember, forgetAll }
}
