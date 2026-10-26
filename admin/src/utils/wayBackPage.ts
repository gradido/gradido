// AI-GENERATED — not an architecture reference
import type { InjectionKey } from 'vue'

/**
 * The page a pin, a bubble or an arrow names for the wallet's way back (`admin=`,
 * components/MemberWalletLink.tsx), where a page holds more than its address shows: its search.
 * In the app on a phone the admin interface loads anew on the way back, and a search kept only in
 * the page was gone. With it the list shows the member the moderator came from again (Bernd,
 * 26.10.2026: "dann würde der Rückweg auf jeden Fall zum richtigen Teilnehmer führen"). The page
 * reads the search back from its address as it opens.
 */
export const WAY_BACK_PAGE: InjectionKey<() => string> = Symbol('wayBackPage')

/** The address of a page with its search under `key`, or the bare page where there is none. */
export const pageWithSearch = (path: string, key: string, search: string) =>
  search ? `${path}?${new URLSearchParams({ [key]: search })}` : path
