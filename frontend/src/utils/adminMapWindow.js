// AI-GENERATED — not an architecture reference

/**
 * The name of the window the admin interface opens beside itself for a look into the wallet:
 * the pin behind a member's name there shows the map on them, the arrow the send form to them
 * (admin/src/components/MemberWalletLink.vue, admin/src/utils/mapWindow.js). It was the map's
 * alone at first, and the word says so still. The two apps share no code, so the name is
 * written down in both and held by a test in each.
 */
export const ADMIN_MAP_WINDOW_NAME = 'gradido-wallet-map'

/**
 * Whether `win` is that window, with the admin interface still there behind it.
 *
 * For the wallet's menu entry "Admin" (DashboardLayout): in this window it is the way BACK.
 * The moderator came from an admin interface that stays signed in and where they left it,
 * so the entry closes the window instead of taking it to the admin interface -- which made
 * the window a second admin interface, and one that carried the map's name: the next pin
 * pressed in it named its own window and replaced it (Bernd, 13.10.2026).
 *
 * "Still there": the window that opened this one is not closed and still shows the admin
 * interface. That can be told where the admin interface lives on the wallet's origin, under a
 * directory of its own (`/admin/`): a moderator whose sign-in ran out there finds the wallet's
 * sign-in page in that window, and then "Admin" has to lead to the admin interface as ever.
 *
 * ⛔ Where it cannot be told, the window is not taken for it, and "Admin" leads to the admin
 * interface as ever: a window closed on a guess would leave the moderator without one. It
 * cannot be told where the window behind stands on another origin than this wallet -- what
 * such a window shows cannot be read, the admin interface on an origin of its own as little
 * as a site the window left for -- and where the address of the admin interface names no
 * directory: then no path tells its pages from the wallet's.
 *
 * @param win the window asked about
 * @param adminAuthUrl where the wallet hands over to the admin interface (CONFIG.ADMIN_AUTH_URL)
 */
export const isMapWindowOfAdmin = (win, adminAuthUrl) => {
  if (win.name !== ADMIN_MAP_WINDOW_NAME) return false
  if (typeof adminAuthUrl !== 'string' || adminAuthUrl === '') return false
  const behind = win.opener
  if (!behind || behind.closed) return false
  let admin
  try {
    admin = new URL(adminAuthUrl, win.location.href)
  } catch {
    return false
  }
  // '/admin/authenticate' -> '/admin/': everything under it is the admin interface.
  const home = admin.pathname.replace(/[^/]*$/, '')
  if (home === '/') return false
  try {
    return (
      behind.location.origin === admin.origin && `${behind.location.pathname}/`.startsWith(home)
    )
  } catch {
    return false
  }
}
