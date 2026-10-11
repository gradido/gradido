// AI-GENERATED — not an architecture reference

/**
 * How the Apollo cache keeps single fields (InMemoryCache's `typePolicies`) -- in a file of its
 * own, which imports nothing, so that it can be held against a real cache without the client, its
 * links and the store (apolloCachePolicies.spec.js).
 *
 * `ChatMessage.reactions`: the reactions to a message come as a whole -- each emoji once, with
 * how many reacted -- and a newer answer takes the place of the older one. Said in so many words
 * (`merge: false`) because the entries have no id of their own: without it the cache replaces
 * them just the same, and warns in the console that data "may be lost" whenever the list has got
 * shorter -- which is every time a member takes a reaction back. Apollo warns in the built wallet
 * too (measured 11.10.2026).
 */
export const APOLLO_TYPE_POLICIES = {
  ChatMessage: {
    fields: {
      reactions: { merge: false },
    },
  },
}
