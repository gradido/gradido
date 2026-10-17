// AI-GENERATED — not an architecture reference

// A picture pasted with Ctrl+V (Cmd+V on a Mac) goes where a picture can be chosen -- the chat's
// compose bar, the avatar's window, the picture of a thank-you greeting and of a transfer -- the
// same way as one chosen in the device's picker (Bernd, 16.10.2026: on Windows a screenshot goes
// to the clipboard, not into a folder). The browser hands it to the page with the `paste` event,
// without asking the member for a permission: the press of the keys is the permission.

/**
 * The picture a paste carries, as a file -- or null where the paste is not a picture alone.
 *
 * ⛔ Words win. Some programs put the text AND a picture of it on the clipboard -- a spreadsheet
 * a picture of the cells copied --: there the words are what the member copied, and the paste
 * stays the field's ordinary one. Only a paste without words is taken as a picture: a screenshot
 * (Windows key + Shift + S, Cmd + Ctrl + Shift + 4), a picture copied on its own.
 *
 * The files of the paste first, then its items: the clipboard API offers a picture in both, and
 * the first that is one is taken.
 *
 * @param {ClipboardEvent} event
 * @returns {File | null}
 */
export const pastedImage = (event) => {
  const data = event?.clipboardData
  if (!data) return null
  if ((data.getData('text/plain') ?? '').trim() !== '') return null
  const files = Array.from(data.files ?? [])
  const fromItems = Array.from(data.items ?? [])
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
  return [...files, ...fromItems].find((file) => file?.type?.startsWith('image/')) ?? null
}

/**
 * What a window over the page is: Bootstrap's dialog (`.modal`, every BModal), the wallet's own
 * (AppModal, `.modal-overlay`), and any other that says it is modal (the avatar's enlargement).
 */
const WINDOW = '.modal, .modal-overlay, [aria-modal="true"]'

/**
 * Which of them are open. A BModal that is not shown can stay in the page (the picture editor of
 * a thank-you's picture choice does), hidden: it counts only with Bootstrap's `show`. The other
 * two are in the page only while they are open.
 */
const OPEN_WINDOW = '.modal.show, .modal-overlay, [aria-modal="true"]:not(.modal)'

/** The window an element stands in, or null for the page itself. */
export const windowOf = (node) =>
  node && typeof node.closest === 'function' ? node.closest(WINDOW) : null

/** How high a window lies: its z-index as the browser computes it, 0 where it has none. */
const layer = (node) => Number.parseInt(getComputedStyle(node).zIndex, 10) || 0

/**
 * Whether another open window lies over this one. Bootstrap stacks its dialogs at 1054 to 1056,
 * the last opened highest; the avatar's enlargement lies at 2000, over any of them. It does not
 * hold the keyboard against the dialog's focus trap, which pulls it back into the dialog beneath
 * (ChatImageView says so too): only the layers tell that the dialog is covered.
 */
const covered = (own) =>
  [...document.querySelectorAll(OPEN_WINDOW)].some((other) => layer(other) > layer(own))

/**
 * Whether a paste is for the place given -- the element of the component that takes pictures:
 *
 * - In a window, the paste is the window's wherever in it the keyboard stands: in the field, on a
 *   button, on the window itself (a BModal gives itself the focus when it opens, so Ctrl+V works
 *   before anything in it was pressed) -- while no other window lies over it.
 * - On the page, it is the page's while no window lies over it: a paste in the open chat or in the
 *   avatar's window is theirs, not the page's under them.
 *
 * @param {ClipboardEvent} event
 * @param {Element | null | undefined} place
 */
export const pasteIsFor = (event, place) => {
  if (!place) return false
  const own = windowOf(place)
  const from = windowOf(event.target)
  if (own) return from === own && !covered(own)
  return from === null && document.querySelector(OPEN_WINDOW) === null
}
