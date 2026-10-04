// AI-GENERATED — not an architecture reference
import { transactionPicture as transactionPictureQuery } from '@/graphql/queries'
import { createMemoryPictures } from '@/utils/memoryPictures'

// The photos members sent with a transfer, for the two the booking is between: asked for by the
// id of the BOOKING -- each member's own row of it, as their booking list names it -- when its
// place comes into sight, and kept for the rest of the session.
//
// How they are kept -- in memory only, `no-cache`, one at a time -- is utils/memoryPictures.
// ⛔ A store of its own, by the id of the booking: the photo of a thank-you greeting is kept by
// the id of its link (useGreetingPictures), and the two ranges of numbers never meet.
//
// Nothing is remembered from what the wallet sent: sendCoins answers with a yes, not with the id
// of the booking, so one's own photo comes from the server like the other's.
const store = createMemoryPictures({
  query: transactionPictureQuery,
  variable: 'transactionId',
  field: 'transactionPicture',
})

/**
 * What is known about the photo of a booking: `{ state, src }` -- `src` only where the state is
 * 'ready' -- or null where nobody has asked for it yet. Reactive.
 */
export const transactionPicture = store.picture

/**
 * Asks for the photo of a booking, unless it is here or on its way already.
 *
 * `client`: the Apollo client, from the asking component's setup (`useApolloClient`).
 */
export const requestTransactionPicture = store.request

/** Lets every photo go -- at logout, beside forgetAllGreetingPictures and for the same reason. */
export const forgetAllTransactionPictures = store.forgetAll
