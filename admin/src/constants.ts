// AI-GENERATED — not an architecture reference

/**
 * Where the admin interface lives on its origin: its router's base (router/router.ts), and the
 * part of an address that comes before a page of it (components/MemberWalletLink.tsx).
 */
export const ROUTER_BASE = '/admin/'

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
 * Where a window stops being a phone or a tablet held upright: from here on up the contribution
 * page and the member search are the tables they have always been, below it every row is a card
 * (composables/useViewport). The name stays, it stands in many files; `'mobile'` means a phone
 * or a tablet held upright.
 *
 * ⛔ Bootstrap's `lg`, for three reasons that meet at this one width: the tables stack below it
 * (`stacked='lg'`), and the cards are made of a stacked table, so the two have to switch at the
 * same width; the top bar folds up below it (NavBar.scss); and it is the smallest of Bootstrap's
 * widths from which neither table reaches past the window. Measured 23.10.2026 in the built
 * bundle: the contribution table fits from 920px on, the member search from 950px on; at 768px
 * the one stood 151px past the window (AO-010). A copy of a number the stylesheets hold;
 * useViewport.drift.spec.js measures the two against each other.
 */
export const PHONE_BREAKPOINT_PX = 992

/**
 * The places of a pager: three page numbers on a phone, as every pager in the wallet shows
 * there, and bootstrap-vue-next's own five at the desk (an ellipsis takes one of them). The
 * contribution page and the member search with the two lists under an opened member use both;
 * a pager on a phone carries the class `phone-pager` as well (App.css).
 */
export const PHONE_PAGER_LIMIT = 3
export const DESK_PAGER_LIMIT = 5
