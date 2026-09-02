// AI-GENERATED — not an architecture reference
import { reactive } from 'vue'
import { favoriteListQuery } from '@/graphql/contacts.graphql'

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
 * Keys are the uuid pair, the way the server stores a heart. A booking row may carry no
 * communityUuid for a member registered before the home community had one; the server
 * fills in the home community in that case, so such a row is matched by gradidoID alone
 * (a v4 uuid, unique for every practical purpose) rather than left without its heart.
 */
const state = reactive({
  keys: new Set(),
  gradidoIds: new Set(),
  loaded: false,
})

export const favoriteKey = ({ communityUuid, gradidoID }) => `${communityUuid ?? ''}/${gradidoID}`

/** Reactive: a component reading this re-renders when the set changes. */
export const isFavorite = (member) => {
  if (!member?.gradidoID) return false
  if (state.keys.has(favoriteKey(member))) return true
  return !member.communityUuid && state.gradidoIds.has(member.gradidoID)
}

export const favoritesLoaded = () => state.loaded

/** Replaces the set with what the server answered. */
export const rememberFavorites = (refs) => {
  state.keys = new Set(refs.map(favoriteKey))
  state.gradidoIds = new Set(refs.map((ref) => ref.gradidoID))
  state.loaded = true
}

/**
 * One heart given or taken, applied here at once -- the screen must not wait for a round
 * trip to show what the member just did. The mutation's answer confirms; if it fails, the
 * caller puts it back.
 */
export const markFavorite = (member, on) => {
  const keys = new Set(state.keys)
  const ids = new Set(state.gradidoIds)
  const key = favoriteKey(member)
  if (on) {
    keys.add(key)
    ids.add(member.gradidoID)
  } else {
    keys.delete(key)
    // The id set is a fallback for rows without a community; drop the id only when no
    // other key still names this member.
    if (![...keys].some((k) => k.endsWith(`/${member.gradidoID}`))) {
      ids.delete(member.gradidoID)
    }
  }
  state.keys = keys
  state.gradidoIds = ids
}

/** On logout: the next member on this device must not see the previous one's hearts. */
export const forgetFavorites = () => {
  state.keys = new Set()
  state.gradidoIds = new Set()
  state.loaded = false
}

/**
 * Asks the server once. `network-only`: a cached answer would be the previous member's
 * on a shared device where the cache survived (see the logout note in the store).
 */
export const loadFavorites = async (apolloClient) => {
  try {
    const { data } = await apolloClient.query({
      query: favoriteListQuery,
      fetchPolicy: 'network-only',
    })
    rememberFavorites(data?.favoriteList ?? [])
  } catch {
    // Empty hearts this time round; the next screen that needs them asks again.
  }
}
