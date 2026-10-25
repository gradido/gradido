// AI-GENERATED — not an architecture reference
import { isMapWindowOfAdmin } from '@/utils/adminMapWindow'
import { handOverAddress, sharesOrigin } from '@/utils/authToken'

/**
 * The way back to the admin interface, for a moderator the admin sent here: its pin, bubble or
 * arrow behind a member's name open the wallet on the map, the conversation or the send form,
 * and name the page of the admin interface they were pressed on (`?admin=/creation-confirm`).
 *
 * Kept for this tab and for this member: a pin pressed in an installed app on a phone can open
 * the wallet in the app's only window, where nothing else leads back (Bernd, 25.10.2026:
 * "Es müsste also eine Möglichkeit geben, das Wallet ... wieder zu schließen, sodass man wieder
 * dort ist, von wo man auf die Stecknadel geklickt hat"). Session storage ends with the tab; the
 * member's gradidoID beside the page keeps another member signed in later in the same tab from
 * being offered a way into an admin interface that was never theirs.
 */
const KEY = 'gradido-admin-way-back'

/**
 * A page of the admin interface, as its router names it: a path of its own, never an address
 * of another site. `//host` and `/\host` are addresses of another site to a browser.
 */
export const adminPath = (value) =>
  typeof value === 'string' && /^\/(?![/\\])/.test(value) && !/[\\\s]/.test(value) ? value : null

const storageOf = (win) => {
  try {
    return win.sessionStorage
  } catch {
    return null
  }
}

export const rememberWayBack = (back, gradidoID, win = window) => {
  const page = adminPath(back)
  if (!page || !gradidoID) return false
  try {
    storageOf(win)?.setItem(KEY, JSON.stringify({ back: page, gradidoID }))
  } catch {
    // a browser that keeps nothing for this tab: the bar shows for this page only
  }
  return true
}

/** The page of the admin interface this member came from, or null. */
export const wayBackFor = (gradidoID, win = window) => {
  if (!gradidoID) return null
  try {
    const kept = JSON.parse(storageOf(win)?.getItem(KEY) ?? 'null')
    return kept?.gradidoID === gradidoID ? adminPath(kept.back) : null
  } catch {
    return null
  }
}

export const forgetWayBack = (win = window) => {
  try {
    storageOf(win)?.removeItem(KEY)
  } catch {
    // nothing kept, nothing to forget
  }
}

/**
 * The address that signs this moderator in to the admin interface and lands them on `back`.
 * The admin interface takes the page after the sign-in (`redirect`, admin/src/router/guards.ts).
 * Where the two apps share no origin the token ends the address (`?token=` + token), so the page
 * goes behind it.
 */
export const adminAddress = (adminAuthUrl, token, back, win = window) => {
  const address = handOverAddress(adminAuthUrl, token, win)
  const page = adminPath(back)
  if (!page) return address
  return `${address}${address.includes('?') ? '&' : '?'}redirect=${encodeURIComponent(page)}`
}

/**
 * Back to the admin interface, for the bar and for the menu entry "Admin" alike. Where this is
 * the window the admin interface opened beside itself and that admin interface is still there
 * behind it, the window closes, and the moderator stands where they pressed the pin
 * (isMapWindowOfAdmin says why this is told so carefully). Anywhere else the wallet goes to the
 * admin interface: to the page they came from where there is one, else to its start.
 *
 * Signed out only where the admin interface is on another origin (development), as the menu
 * entry always did: there the token went along in the address. On one origin both apps hold the
 * one token (utils/authToken.js), and signing out here would sign the admin interface out too.
 */
export const goBackToAdmin = ({ adminAuthUrl, token, back = null, signOut, win = window }) => {
  forgetWayBack(win)
  if (isMapWindowOfAdmin(win, adminAuthUrl)) {
    win.close()
    return 'closed'
  }
  win.location.assign(adminAddress(adminAuthUrl, token, back, win))
  if (!sharesOrigin(adminAuthUrl, win)) signOut?.()
  return 'went'
}
