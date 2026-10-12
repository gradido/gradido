// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { CHAT_MENU_EDGE_PX, CHAT_MENU_GAP_PX, chatMenuSpot } from './chatMenuSpot'

/**
 * Where a message's menu hangs over the page (11.10.2026): for a thread lower than the menu. The
 * numbers are a phone's whose browser leaves 375 x 553: the thread stands from 238 to 445, the
 * menu at one's own message is 301 x 267 with its reactions.
 */
describe('chatMenuSpot', () => {
  const screen = { width: 375, height: 553 }
  const size = { width: 301, height: 267 }

  it('hangs the menu over the message, a gap above it', () => {
    const anchor = { top: 380, bottom: 430, left: 24, right: 351 }
    expect(chatMenuSpot({ anchor, size, screen }).top).toBe(380 - CHAT_MENU_GAP_PX - 267)
  })

  it('hangs it under the message where there is no room above and there is below', () => {
    const anchor = { top: 240, bottom: 270, left: 24, right: 351 }
    expect(chatMenuSpot({ anchor, size, screen }).top).toBe(270 + CHAT_MENU_GAP_PX)
  })

  it('still counts the room above as enough when the menu just keeps clear of the edge', () => {
    const top = CHAT_MENU_EDGE_PX + 267 + CHAT_MENU_GAP_PX
    const anchor = { top, bottom: top + 40, left: 24, right: 351 }
    expect(chatMenuSpot({ anchor, size, screen }).top).toBe(CHAT_MENU_EDGE_PX)

    const closer = { ...anchor, top: top - 1, bottom: 500 }
    // One pixel less above, and no room below: the edge it covers less of the message at.
    expect(chatMenuSpot({ anchor: closer, size, screen }).top).toBe(CHAT_MENU_EDGE_PX)
  })

  it('goes to the edge of the screen where it covers less of the message, with room on neither side', () => {
    // A tall message that fills the thread: 31 px of it would be covered from above, 173 from below.
    const high = { top: 250, bottom: 445, left: 24, right: 351 }
    expect(chatMenuSpot({ anchor: high, size, screen }).top).toBe(CHAT_MENU_EDGE_PX)

    // Near the top of a low screen: from above it would cover all of it, from below a little.
    const low = { top: 40, bottom: 280, left: 24, right: 351 }
    expect(chatMenuSpot({ anchor: low, size, screen }).top).toBe(553 - CHAT_MENU_EDGE_PX - 267)
  })

  it('never hangs out of a screen lower than the menu: it starts at the upper edge', () => {
    const anchor = { top: 100, bottom: 140, left: 24, right: 351 }
    const spot = chatMenuSpot({ anchor, size, screen: { width: 375, height: 240 } })
    expect(spot.top).toBe(CHAT_MENU_EDGE_PX)
  })

  it("keeps to the left at somebody else's message and to the right at one's own", () => {
    const anchor = { top: 380, bottom: 430, left: 24, right: 351 }
    expect(chatMenuSpot({ anchor, size, screen }).left).toBe(24)
    expect(chatMenuSpot({ anchor, size, screen, mine: true }).left).toBe(351 - 301)
  })

  it('stays on the screen sideways: at its edges, clear of them', () => {
    const narrow = { width: 300, height: 553 }
    const anchor = { top: 380, bottom: 430, left: 2, right: 298 }
    const small = { width: 280, height: 267 }
    expect(chatMenuSpot({ anchor, size: small, screen: narrow }).left).toBe(CHAT_MENU_EDGE_PX)
    expect(chatMenuSpot({ anchor, size: small, screen: narrow, mine: true }).left).toBe(
      300 - CHAT_MENU_EDGE_PX - 280,
    )
    // A menu as wide as the screen leaves it: at the left edge, whichever side it belongs to.
    const wide = { width: 284, height: 267 }
    expect(chatMenuSpot({ anchor, size: wide, screen: narrow, mine: true }).left).toBe(
      CHAT_MENU_EDGE_PX,
    )
  })
})
