// AI-GENERATED — not an architecture reference

/**
 * The browser's own way of putting a picture into the clipboard, taken hold of before main.js loads
 * `clipboard-polyfill/overwrite-globals`, which replaces `window.ClipboardItem` and
 * `navigator.clipboard.write`.
 *
 * For text the polyfill is what the wallet wants. For a picture it is wrong twice: its `write` exists
 * in every browser, so asking for it says nothing about whether this one takes a picture; and it holds
 * the browser's `write` back until the picture is finished, which is after the tap, and Safari refuses
 * anything after the tap.
 *
 * ⛔ main.js imports this module ABOVE the polyfill (nativeClipboard.spec.js holds them in that order).
 * Below it, this would take hold of the polyfill's own `write`, and everything would go on looking fine.
 */
const clipboard = navigator.clipboard
const write = clipboard?.write
const BrowserClipboardItem = typeof ClipboardItem === 'undefined' ? null : ClipboardItem

/**
 * Whether this browser takes a picture into the clipboard at all.
 *
 * @returns {boolean}
 */
export const takesPictureInClipboard = () => Boolean(write && BrowserClipboardItem)

/**
 * Hands the browser a picture for the clipboard, at once. Call it within the tap: a picture that is
 * still being made goes as its promise, and the browser waits for that itself.
 *
 * @param {Blob | Promise<Blob>} png
 * @returns {Promise<void>} rejected where the browser refuses
 */
export const writePictureToClipboard = (png) =>
  write.call(clipboard, [new BrowserClipboardItem({ 'image/png': png })])
