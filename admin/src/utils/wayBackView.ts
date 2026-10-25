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

/** How long the row of the way back is kept in sight, unless the moderator moves first. */
export const ROW_HOLD_MS = 3000
// What the moderator moves the page with: any of them ends the holding.
const MOVED_BY_HAND = ['touchstart', 'pointerdown', 'wheel', 'keydown'] as const

/**
 * Rolls to the row, then keeps it where the roll put it for a moment. In the app on an iPhone the
 * page stood at the row and went to its top a moment later, without the moderator's doing (Bernd,
 * 25.10.2026: "kurz der richtige Bildschirm", then the top of the page): WebKit on iOS puts a page
 * it has just loaded back to its top once it first draws it, and here that came after the roll.
 * Moved away in the meantime, the window rolls back to the row. A touch, a click, the wheel or a
 * key ends the holding at once, so the moderator's own scrolling is never undone; so do a few
 * seconds, and a row that is gone.
 */
export const rollToRowAndHold = (selector: string, holdMs = ROW_HOLD_MS) => {
  if (!rollToRow(selector)) {
    return false
  }
  const rowTop = () => document.querySelector(selector)?.getBoundingClientRect().top ?? null
  const heldTop = rowTop()
  const keep = () => {
    const top = rowTop()
    if (top === null || heldTop === null) {
      release()
    } else if (Math.abs(top - heldTop) > 24) {
      rollToRow(selector)
    }
  }
  const release = () => {
    window.removeEventListener('scroll', keep)
    for (const type of MOVED_BY_HAND) {
      window.removeEventListener(type, release, true)
    }
    clearInterval(checks)
    clearTimeout(end)
  }
  window.addEventListener('scroll', keep, { passive: true })
  for (const type of MOVED_BY_HAND) {
    window.addEventListener(type, release, { capture: true, passive: true })
  }
  // A move that brings no scroll event along is caught as well, for as long as the holding lasts.
  const checks = setInterval(keep, 250)
  const end = setTimeout(release, holdMs)
  return true
}
