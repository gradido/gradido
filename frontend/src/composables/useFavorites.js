// AI-GENERATED — not an architecture reference
import { reactive } from 'vue'
import { favoriteListQuery } from '@/graphql/contacts.graphql'
import { memberKey } from '@/utils/gradidoAddress'

/**
 * The hearts this member has given, held once per session beside the booking list.
 *
 * ⛔ Not in the vuex store: that store is persisted to localStorage on EVERY mutation,
 * and a set that changes with each tap on a heart would be rewritten there each time.
 * Module state instead, the way the member pictures are kept (useMemberAvatars).
 *
 * Why a list of its own rather than a field on every booking row: the set is small (a
 * subset of the people one has booked with), it is needed on three screens at once, and
 * keeping it here leaves `transactionList` -- the query every page loads -- untouched.
 *
 * Keys are the uuid pair (memberKey), the way the server stores a heart. Every member the
 * server delivers carries a communityUuid -- the resolver stands in with the home
 * community for a row that has none -- so the pair is the one key, here as in the avatar
 * store, and nothing needs a fallback.
 */
const state = reactive({
  keys: new Set(),
  loaded: false,
})

/**
 * Bumped when the hearts are forgotten. A `favoriteList` answer that was on its way when
 * the member logged out must not land in the next member's session -- Apollo cancels
 * in-flight queries when the store is cleared, but a turn of the event loop after the
 * forget, not in the same tick, and this closes that gap the way the avatar store does.
 */
let epoch = 0
let inFlight = null

/**
 * Hearts given or taken WHILE a load was in flight, by key.
 *
 * The server's answer describes the state as it was when the query left, so it must not be
 * allowed to undo a tap that happened after that: the answer is applied first, these are
 * applied on top. Null while no load is out, so an ordinary tap costs nothing.
 */
let marksDuringLoad = null

const setKey = (key, on) => {
  const keys = new Set(state.keys)
  if (on) {
    keys.add(key)
  } else {
    keys.delete(key)
  }
  state.keys = keys
}

/** Reactive: a component reading this re-renders when the set changes. */
export const isFavorite = (member) =>
  Boolean(member?.gradidoID) && state.keys.has(memberKey(member))

export const favoritesLoaded = () => state.loaded

/** Replaces the set with what the server answered. */
export const rememberFavorites = (refs) => {
  state.keys = new Set(refs.map(memberKey))
  state.loaded = true
}

/**
 * One heart given or taken, applied here at once -- the screen must not wait for a round
 * trip to show what the member just did. The mutation's answer confirms; if it fails, the
 * caller puts it back.
 */
export const markFavorite = (member, on) => {
  const key = memberKey(member)
  setKey(key, on)
  if (marksDuringLoad) {
    marksDuringLoad.set(key, on)
  }
}

/** On logout: the next member on this device must not see the previous one's hearts. */
export const forgetFavorites = () => {
  state.keys = new Set()
  state.loaded = false
  epoch++
  inFlight = null
  marksDuringLoad = null
}

/**
 * Asks the server. `network-only`: a cached answer would be the previous member's on a
 * shared device where the cache survived (see the logout note in the store).
 *
 * Not exported: `ensureFavorites` is the one way in, so that nobody can bypass the
 * short-circuit and the shared request by reaching for what looks like "the loader".
 */
const loadFavorites = async (apolloClient) => {
  const at = epoch
  const marks = new Map()
  marksDuringLoad = marks
  try {
    const { data } = await apolloClient.query({
      query: favoriteListQuery,
      fetchPolicy: 'network-only',
    })
    if (at !== epoch) return
    rememberFavorites(data?.favoriteList ?? [])
    // What the member did while this was on its way. The server has those rows already --
    // the mutations went out with the taps -- so the answer is simply older than they are.
    for (const [key, on] of marks) {
      setKey(key, on)
    }
  } catch {
    // Empty hearts this time round. `loaded` stays false, so the next screen that calls
    // ensureFavorites asks again.
  } finally {
    if (marksDuringLoad === marks) {
      marksDuringLoad = null
    }
  }
}

/**
 * The hearts, once per session: the layout asks at mount, and every screen that shows
 * hearts asks again -- which costs nothing once they are here, and is the retry when the
 * first request failed. One request at a time, however many screens ask at once.
 */
export const ensureFavorites = (apolloClient) => {
  if (state.loaded) return Promise.resolve()
  if (!inFlight) {
    // The handle clears only itself: a request that was still out when the member logged
    // out settles later, and must not take the NEW session's request off the hook.
    const handle = loadFavorites(apolloClient).finally(() => {
      if (inFlight === handle) {
        inFlight = null
      }
    })
    inFlight = handle
  }
  return inFlight
}
