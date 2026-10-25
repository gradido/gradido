// AI-GENERATED — not an architecture reference
import { type InjectionKey, watch } from 'vue'
import type { LocationQuery, LocationQueryValue } from 'vue-router'

/**
 * The view a moderator stood in when a pin, a bubble or an arrow took them into the wallet, for
 * the way back. In the app on a phone the wallet takes the one window, and the admin interface
 * loads anew on the way back: all a page held in memory alone was gone -- the tab, the page of
 * the list, the search, the group, the opened row (Bernd, 25.10.2026: the right page, "aber
 * nicht an der Stelle in der Liste").
 *
 * So a page tells the pin its view as an address of its own (`/creation-confirm?tab=2&open=501`),
 * which goes to the wallet as the way back (`admin=`, components/MemberWalletLink.tsx) and comes
 * back through the sign-in (`redirect`, router/guards.ts). The page reads it once as it opens, as
 * the member search reads `?search=`, takes it out of its address and rolls to the row.
 */
/** The view as an address, given the member whose pin, bubble or arrow was pressed. */
export type WayBackView = (member: { userId?: number; id?: number } | null) => string

export const WAY_BACK_VIEW: InjectionKey<WayBackView> = Symbol('wayBackView')

/** A whole number from the address, or null. */
export const viewNumber = (value: LocationQueryValue | LocationQueryValue[] | undefined) => {
  const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : Number.NaN
  return Number.isSafeInteger(number) ? number : null
}

/** A text from the address, or null. */
export const viewText = (value: LocationQueryValue | LocationQueryValue[] | undefined) =>
  typeof value === 'string' ? value : null

/** The address of a page with the parts of its view that are not its start. */
export const viewAddress = (path: string, parts: Record<string, string | number | null>) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(parts)) {
    if (value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  const search = params.toString()
  return search ? `${path}?${search}` : path
}

/** The address's query without the parts of a view, or null where it holds none. */
export const withoutView = (query: LocationQuery, keys: readonly string[]) =>
  keys.some((key) => key in query)
    ? Object.fromEntries(Object.entries(query).filter(([key]) => !keys.includes(key)))
    : null

/**
 * Resolves once `ready` holds, at once where it does: the page of a view waits for the first
 * list, as the pager takes any page back to the first while it knows no pages, and again when
 * it comes to know them (bootstrap-vue-next, BPagination).
 */
export const whenReady = (ready: () => boolean) =>
  new Promise<void>((resolve) => {
    if (ready()) {
      resolve()
      return
    }
    const stop = watch(ready, (now) => {
      if (now) {
        stop()
        resolve()
      }
    })
  })

/** Rolls the window so that the row stands at its top, a little below the edge. */
export const rollToRow = (selector: string) => {
  const row = document.querySelector(selector)
  if (!row) {
    return false
  }
  window.scrollTo({
    top: row.getBoundingClientRect().top + window.scrollY - 8,
    behavior: 'instant',
  })
  return true
}
