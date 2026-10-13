// AI-GENERATED — not an architecture reference

/**
 * The name of the window the admin interface opens for a look at the map: the pin behind a
 * member's name there (admin/src/components/MemberMapPin.vue, admin/src/utils/mapWindow.js).
 * The two apps share no code, so the name is written down in both and held by a test in each.
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
 * "Still there": the window that opened this one is not closed and, where that can be read,
 * still shows the admin interface. It can be read where the admin interface lives on the
 * wallet's origin; a moderator whose sign-in ran out there finds the wallet's sign-in page
 * in that window, and then "Admin" has to lead to the admin interface as ever. A window
 * behind that cannot be read stands on another origin than this wallet: where the admin
 * interface lives on another origin, it is the window that opened this one under this name,
 * and only the admin interface does that; where it lives on this one, that window has left it.
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
  try {
    // '/admin/authenticate' -> '/admin/': everything under it is the admin interface.
    const home = admin.pathname.replace(/[^/]*$/, '')
    return (
      behind.location.origin === admin.origin && `${behind.location.pathname}/`.startsWith(home)
    )
  } catch {
    return admin.origin !== win.location.origin
  }
}
