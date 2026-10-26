// AI-GENERATED — not an architecture reference
import type { InjectionKey } from 'vue'

/**
 * The search of the page a pin, a bubble or an arrow was pressed on, for the wallet's way back.
 * In the app on a phone the admin interface loads anew on the way back, and a search kept only
 * in the page was gone. With it the list shows the member the moderator came from (Bernd,
 * 26.10.2026: "dann würde der Rückweg auf jeden Fall zum richtigen Teilnehmer führen").
 *
 * It travels in the storage both apps share (localStorage of one origin), where the sign-in and
 * the dark mode already come through the way back: carried in the address, the search did not
 * arrive in the app on an iPhone, while the page did (Bernd, 26.10.2026). The address names the
 * page alone again (components/MemberWalletLink.tsx).
 */
export type WayBackSearch = { page: string; search: string }

/** What a page provides for its pins: the page and its search. */
export const WAY_BACK_PAGE: InjectionKey<() => WayBackSearch> = Symbol('wayBackPage')

const KEY = 'gradido-admin-way-back-search'

/** How long a kept search waits for the way back. */
export const WAY_BACK_SEARCH_MS = 30 * 60 * 1000

/** Forgets a kept search: at the sign-out, and where the wallet's window did not open. */
export const forgetWayBackSearch = () => {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // nothing kept where nothing can be
  }
}

/**
 * Keeps the search of the page for the way back, bound to the moderator: whoever signs in next
 * on this device has no business with it. A page without a search forgets an older one.
 */
export const keepWayBackSearch = (
  { page, search }: WayBackSearch,
  moderator: string | undefined,
  now = Date.now(),
) => {
  if (!search || !moderator) {
    forgetWayBackSearch()
    return
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ page, search, moderator, at: now }))
  } catch {
    // a storage that keeps nothing: the search does not go along
  }
}

/**
 * The search kept for this page and this moderator, taken out of the storage, or null. A search
 * kept for another page stays for that page; one older than WAY_BACK_SEARCH_MS or kept for
 * another moderator is dropped.
 */
export const takeWayBackSearch = (
  page: string,
  moderator: string | undefined,
  now = Date.now(),
) => {
  let kept: { page?: unknown; search?: unknown; moderator?: unknown; at?: unknown } | null
  try {
    kept = JSON.parse(window.localStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
  if (!kept || kept.page !== page) {
    return null
  }
  forgetWayBackSearch()
  const fresh = typeof kept.at === 'number' && now - kept.at <= WAY_BACK_SEARCH_MS
  return fresh && kept.moderator === moderator && typeof kept.search === 'string'
    ? kept.search
    : null
}
