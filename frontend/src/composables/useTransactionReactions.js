// AI-GENERATED — not an architecture reference
import { reactive } from 'vue'
import { setTransactionReaction } from '@/graphql/transactions.graphql'

/**
 * Reactions to transfers (Bernd, 11.10.2026): whoever received a transfer answers it with an
 * emoji -- one a transfer --, and the two it is between see it with the booking: in the booking
 * list and at the booking's bubble in their conversation. Only the recipient reacts; the server
 * says with every booking whether the member may (`canReact`), and holds the rule itself
 * (setTransactionReaction).
 *
 * A booking is shown in more than one place at once -- the booking list, and the conversation
 * in the contact window over it -- and each place holds its own copy: both lists are read past
 * the cache (`no-cache`). So a reaction that was set is said to whoever listens
 * (`onTransactionReaction`), and each place puts it into the booking it holds.
 *
 * ⛔ An event, not a store: nothing of it stays behind. The next reading of a list is the
 * server's word again, and nothing here outlives the member on this device.
 */

/** The bookings a reaction of the member's is on its way for, by their id -- for the drawing too. */
const underway = reactive(new Set())

const listeners = new Set()

/** Whether a reaction to the booking with this id is on its way: its emoji take no press then. */
export const isTransactionReactionUnderway = (transactionId) => underway.has(transactionId)

/**
 * Listens for the reactions the member sets or takes back: `{ transactionId, reaction }` -- the
 * id of their own booking and the emoji that stands at the transfer now, or null. Returns the
 * function that stops listening.
 */
export const onTransactionReaction = (listener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * What a press on an emoji asks the server for: the emoji -- or none where it is the booking's
 * reaction already: the same one again takes it back.
 */
export const transactionReactionToSend = (booking, emoji) =>
  (booking?.reaction ?? null) === emoji ? null : emoji

/**
 * The reaction to a transfer in the shape the reactions to a chat message have -- what the
 * booking's bubble in the conversation draws: one emoji, once, and the member's own on the row
 * of what they received (only the recipient reacts). None for a booking without one.
 */
export const transferReactions = (booking) =>
  booking?.reaction
    ? [{ emoji: booking.reaction, count: 1, mine: booking.typeId === 'RECEIVE' }]
    : []

/**
 * An emoji was pressed at a booking: the member's reaction -- or, where it is the booking's
 * reaction already, the taking back of it. `booking` as its place holds it NOW: what is sent is
 * read off its `reaction`.
 *
 * Answers `{ reaction }` -- the emoji that stands at the transfer then, or null -- once the
 * server has, and says so to everybody who listens. Answers null where nothing was sent: the
 * member may not react to this booking, or a reaction to it is on its way.
 *
 * ⛔ One at a time for a booking: a second press while the first is on its way would be read
 * off a state that is about to change -- a reaction set twice in place of set and taken back.
 *
 * Throws where the server refused or did not answer: nothing changed, and whoever called says so.
 *
 * `no-cache`: the answer is a bare emoji, and the bookings it belongs to are in no cache.
 */
export const reactToTransaction = async (apolloClient, booking, emoji) => {
  const transactionId = booking?.id
  if (!booking?.canReact || underway.has(transactionId)) return null
  const wanted = transactionReactionToSend(booking, emoji)
  underway.add(transactionId)
  try {
    const answer = await apolloClient.mutate({
      mutation: setTransactionReaction,
      variables: { transactionId, emoji: wanted },
      fetchPolicy: 'no-cache',
    })
    // Null is an answer -- the reaction was taken back --, a missing field is none.
    if (!answer?.data || !('setTransactionReaction' in answer.data)) {
      throw new Error('setTransactionReaction: no answer')
    }
    const reaction = answer.data.setTransactionReaction ?? null
    for (const listener of [...listeners]) {
      listener({ transactionId, reaction })
    }
    return { reaction }
  } finally {
    underway.delete(transactionId)
  }
}
