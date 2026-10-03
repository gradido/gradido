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
