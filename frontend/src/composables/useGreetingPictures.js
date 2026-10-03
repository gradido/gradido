// AI-GENERATED — not an architecture reference
import { shallowReactive } from 'vue'
import { thankYouGreetingPicture } from '@/graphql/queries'

// The photos of thank-you greetings in their small rendition (ZE-019), for the two members who
// may have one after the link is made: whoever made the greeting -- in their list of links and in
// the conversation -- and whoever accepted it, in the conversation. Asked for by the id of the
// link when its place comes into sight, and kept for the rest of the session.
//
// The way of the chat's pictures (useChatImages), and for its reasons:
// ⛔ in MEMORY only, never in the device's storage and never in the vuex store, which is written
//   whole into localStorage;
// ⛔ no base64 in Apollo's cache: the query is asked `no-cache`.
//
// One at a time: a list of links shows five greetings, a conversation two or three, and nginx
// lets one address have five requests at once -- beside everything else a page asks for.

/** link id -> { state: 'loading' | 'ready' | 'missing' | 'failed', src }. An entry is replaced whole. */
const pictures = shallowReactive(new Map())

/** The line the requests stand in: each begins when the one before has its answer. */
let line = Promise.resolve()

/**
 * Bumped when everything is let go. An answer asked for before belongs to nobody: it may not be
 * put back into the store of the next member on this browser.
 */
let epoch = 0

/** A JPEG in base64 as an address an <img> can show -- no object to give back to the browser. */
const addressOf = (base64) => `data:image/jpeg;base64,${base64}`

const isLinkId = (linkId) => Number.isInteger(linkId) && linkId > 0

/**
 * What is known about the photo of a link: `{ state, src }` -- `src` only where the state is
 * 'ready' -- or null where nobody has asked for it yet. Reactive: a place that reads it here is
 * drawn anew when the photo comes.
 */
export const greetingPicture = (linkId) => pictures.get(linkId) ?? null

const fetchOne = async (client, linkId, askedIn) => {
  // Let go meanwhile: the member who asked has signed out.
  if (askedIn !== epoch) return
  let entry
  try {
    const { data } = await client.query({
      query: thankYouGreetingPicture,
      variables: { linkId },
      fetchPolicy: 'no-cache',
    })
    const base64 = data?.thankYouGreetingPicture ?? null
    // Null is the server's answer for "not for you, not there, not any more", without a reason.
    entry = base64 ? { state: 'ready', src: addressOf(base64) } : { state: 'missing', src: null }
  } catch {
    // The line, not the picture: asked again the next time its place is drawn.
    entry = { state: 'failed', src: null }
  }
  if (askedIn === epoch) pictures.set(linkId, entry)
}

/**
 * Asks for the photo of a link, unless it is here or on its way already. One that failed (the
 * line, not the picture) is asked for again; one the server said nothing about stays "missing".
 *
 * `client`: the Apollo client, from the asking component's setup (`useApolloClient`).
 */
export const requestGreetingPicture = (client, linkId) => {
  if (!isLinkId(linkId)) return
  const known = pictures.get(linkId)
  if (known && known.state !== 'failed') return
  pictures.set(linkId, { state: 'loading', src: null })
  const askedIn = epoch
  line = line.then(() => fetchOne(client, linkId, askedIn))
}

/**
 * One's own photo, just sent: kept from the small rendition the wallet made (utils/thankYouPicture),
 * under the id of the link the server made -- the list of links shows it without asking the server
 * for what came from here a moment ago.
 */
export const rememberGreetingPicture = (linkId, base64) => {
  if (!isLinkId(linkId) || !base64) return
  pictures.set(linkId, { state: 'ready', src: addressOf(base64) })
}

/**
 * Lets every photo go -- at logout, beside forgetAllChatImages and for the same reason: the next
 * member to sign in on this browser must not be handed the photos of the one before. What stands
 * in line is not asked for, and an answer still on its way is dropped when it lands (`epoch`).
 */
export const forgetAllGreetingPictures = () => {
  epoch += 1
  line = Promise.resolve()
  pictures.clear()
}
