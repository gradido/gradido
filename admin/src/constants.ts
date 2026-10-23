// AI-GENERATED — not an architecture reference

/**
 * The face beside a person, wherever this interface shows one: the contribution row and the
 * moderation dialogue.
 *
 * ⛔ ONE number, and the same one the wallet uses (`frontend/src/constants.js`): the same
 * member should not change size from one list to the next, and the two interfaces show the
 * same people. 48 because a face is a tap target (>= 44) on a 8-point grid, and the stored
 * picture is 128 wide, so it stays sharp up to 64.
 */
export const LIST_AVATAR_SIZE = 48

/**
 * The moderator's own face in the top bar, where it is the button of their menu.
 *
 * 32 because it stands opposite the coin, which is 32 high (Bernd, 03.10.2026) -- on purpose
 * not the 28 the wallet gives a face inside a button. A face in a button opens nothing of
 * its own: the button takes the tap.
 */
export const NAV_AVATAR_SIZE = 32

/**
 * Where a window stops being a phone: from here on up the contribution page is the table it
 * has always been, below it every row is a card (composables/useViewport).
 *
 * ⛔ Bootstrap's `md`, because that is where the tables stack (`stacked='md'`), and the cards
 * are made of a stacked table: the two have to switch at the same width. On purpose not the
 * 992 of the top bar, which is a bar and has a boundary of its own. A copy of a number the
 * stylesheets hold; useViewport.drift.spec.js measures the two against each other.
 */
export const PHONE_BREAKPOINT_PX = 768
