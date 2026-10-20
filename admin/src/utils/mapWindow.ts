// AI-GENERATED — not an architecture reference

/**
 * The name of the one window the admin interface shows the wallet in (MemberWalletLink): its
 * map on a member, or its send form to them. A pin or an arrow opens the window of this name
 * or, where there is one already, uses that one again. It was the map's alone at first, and
 * the word says so still.
 * The wallet knows the same name (frontend/src/utils/adminMapWindow.js) -- the two apps share
 * no code, so it is written down in both and held by a test in each.
 */
export const MAP_WINDOW_NAME = 'gradido-wallet-map'

/**
 * ⛔ The window the admin interface itself runs in must not carry that name: a pin pressed
 * there would name its OWN window as the one to open, and the admin interface would be
 * replaced by the wallet (Bernd, 13.10.2026: "the click switches to the wallet, and the admin
 * interface is gone").
 *
 * It can come to carry it. A window keeps its name across every page it shows, and the
 * wallet's menu entry "Admin" takes the window it is clicked in to the admin interface --
 * also the window a pin opened, where the admin interface behind it is gone by then.
 *
 * Asked where the admin interface starts, so that no pin of another window takes this one
 * for the map, and again as a pin is pressed.
 */
export const dropMapWindowName = (win: Window = window) => {
  if (win.name === MAP_WINDOW_NAME) {
    win.name = ''
  }
}
