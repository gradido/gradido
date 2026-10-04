// AI-GENERATED — not an architecture reference
import { thankYouGreetingPicture } from '@/graphql/queries'
import { createMemoryPictures } from '@/utils/memoryPictures'

// The photos of thank-you greetings in their small rendition (ZE-019), for the two members who
// may have one after the link is made: whoever made the greeting -- in their list of links and in
// the conversation -- and whoever accepted it, in the conversation. Asked for by the id of the
// LINK when its place comes into sight, and kept for the rest of the session.
//
// How they are kept -- in memory only, `no-cache`, one at a time -- is utils/memoryPictures.
// ⛔ A store of its own, by the id of the link: the photo sent with a transfer has another one,
// by the id of the booking (useTransactionPictures), and the two ranges of numbers never meet.
const store = createMemoryPictures({
  query: thankYouGreetingPicture,
  variable: 'linkId',
  field: 'thankYouGreetingPicture',
})

/**
 * What is known about the photo of a link: `{ state, src }` -- `src` only where the state is
 * 'ready' -- or null where nobody has asked for it yet. Reactive: a place that reads it here is
 * drawn anew when the photo comes.
 */
export const greetingPicture = store.picture

/**
 * Asks for the photo of a link, unless it is here or on its way already. One that failed (the
 * line, not the picture) is asked for again; one the server said nothing about stays "missing".
 *
 * `client`: the Apollo client, from the asking component's setup (`useApolloClient`).
 */
export const requestGreetingPicture = store.request

/**
 * The photo of a link for whatever has to WAIT for it -- the sheet a greeting is printed on, which
 * is drawn once and cannot take a photo in later: asks for it where nobody has, and resolves with
 * what is known of it once every request in line has its answer. Never rejects.
 *
 * @returns {Promise<{ state: string, src: string | null } | null>} as greetingPicture gives it
 */
export const awaitGreetingPicture = store.awaitPicture

/**
 * One's own photo, just sent: kept from the small rendition the wallet made (utils/thankYouPicture),
 * under the id of the link the server made -- the list of links shows it without asking the server
 * for what came from here a moment ago.
 */
export const rememberGreetingPicture = store.remember

/**
 * Lets every photo go -- at logout, beside forgetAllChatImages and for the same reason: the next
 * member to sign in on this browser must not be handed the photos of the one before. What stands
 * in line is not asked for, and an answer still on its way is dropped when it lands.
 */
export const forgetAllGreetingPictures = store.forgetAll
