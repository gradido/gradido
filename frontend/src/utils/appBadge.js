// AI-GENERATED — not an architecture reference

/**
 * The number on the icon of the wallet installed as an app -- in the Dock, on the taskbar, on the
 * home screen (Badging API, `navigator.setAppBadge`), as a mail program shows its unread mails
 * (Bernd, 24.11.2026).
 *
 * Only the wallet that runs as an app writes the number, never a tab: its own window
 * (`display-mode: standalone`, as public/manifest.webmanifest asks) or Safari's home-screen app on
 * iOS (`navigator.standalone`). One app has one icon, and a tab of the same browser can be signed
 * in as somebody else; its logout would clear the number of the member the app shows.
 *
 * Where the browser has no such API (Firefox, Chrome on Android, iOS before 16.4) nothing happens.
 * Safari and iOS show the number only once the member has allowed notifications; until then the
 * call is refused, and the refusal is let go.
 */

/**
 * How often the chat's beat asks while the installed wallet is out of sight -- a window behind
 * others or minimised -- so that the number on the icon follows what arrives. In sight the beat
 * keeps its fifteen seconds; a tab out of sight asks nothing (useChatUpdates).
 */
export const APP_BADGE_HIDDEN_INTERVAL_MS = 60000

/** Whether this page writes the number on the app's icon. */
export const appBadgeShown = () =>
  typeof navigator.setAppBadge === 'function' &&
  typeof navigator.clearAppBadge === 'function' &&
  (window.matchMedia?.('(display-mode: standalone)').matches === true ||
    navigator.standalone === true)

/** Puts `count` on the app's icon, or takes the number away at 0. Nothing in a tab. */
export const showAppBadge = (count) => {
  if (!appBadgeShown()) return
  ;(count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge()).catch(() => {
    // Refused (no permission for notifications): the icon stays as it is.
  })
}
