// AI-GENERATED — not an architecture reference

/** Between a message and its menu, in pixels -- about the gap the menu keeps in the thread. */
export const CHAT_MENU_GAP_PX = 6
/** What a menu that hangs over the page keeps clear of the screen's edges, in pixels. */
export const CHAT_MENU_EDGE_PX = 8

/**
 * Where a message's menu hangs over the page, in the screen's own pixels -- for a thread too low
 * to hold it (ChatBubble's `settleMenu`): on a phone whose browser leaves the thread 200 px, the
 * menu with its reactions is higher than the thread, and what stood out of it was cut off.
 *
 * Over the message; under it where there is no room above and there is below; and where there is
 * room on neither side, at the edge of the screen on the side where it covers less of the message.
 * At the side of the message its bubble is on, as in the thread. Never out of the screen -- as
 * the smiley's choice is placed (EmojiPicker's `place`).
 *
 * @param {object} given
 * @param {{ top: number, bottom: number, left: number, right: number }} given.anchor the part of
 *   the message that is in sight
 * @param {{ width: number, height: number }} given.size the menu's
 * @param {{ width: number, height: number }} given.screen
 * @param {boolean} [given.mine] one's own message: the menu keeps to the right
 * @returns {{ left: number, top: number }}
 */
export const chatMenuSpot = ({ anchor, size, screen, mine = false }) => {
  const above = anchor.top - CHAT_MENU_GAP_PX - size.height
  const below = anchor.bottom + CHAT_MENU_GAP_PX
  const lowest = screen.height - CHAT_MENU_EDGE_PX - size.height
  let top = above
  if (above < CHAT_MENU_EDGE_PX) {
    if (below <= lowest) top = below
    else {
      top =
        CHAT_MENU_EDGE_PX - above <= below - lowest
          ? CHAT_MENU_EDGE_PX
          : Math.max(CHAT_MENU_EDGE_PX, lowest)
    }
  }
  const wanted = mine ? anchor.right - size.width : anchor.left
  const left = Math.max(
    CHAT_MENU_EDGE_PX,
    Math.min(wanted, screen.width - CHAT_MENU_EDGE_PX - size.width),
  )
  return { left, top }
}
