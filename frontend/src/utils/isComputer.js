// AI-GENERATED — not an architecture reference

/** A computer's pointer: a mouse or a touchpad, which can hover. */
const FINE_POINTER_THAT_HOVERS = '(pointer: fine) and (hover: hover)'
/** What a browser on a phone or a tablet says of itself, whatever its pointer. */
const PHONE_OR_TABLET = /Android|iPhone|iPad/

/**
 * Whether this device is a computer, with a mouse or a touchpad -- not a phone, not a tablet.
 * The contact window asks it before it offers the Jitsi app for the desktop (`offersJitsiApp`), and
 * the hint behind the compose bar's paperclip before it leaves out the tip to SwissTransfer's app
 * for phones.
 *
 * ⛔ No where `matchMedia` is missing -- whoever asks decides what a no costs: the Jitsi app is then
 * not offered, and the file hint shows its tip for phones. No where the browser names a phone or a
 * tablet, whatever its pointer: an Android phone with a mouse is still no computer. And no for a
 * "Macintosh" with points to touch: Safari on an iPad has called itself a Mac since iPadOS 13
 * (Notiz §12, question 1).
 *
 * Read at every call, with nobody listening and nothing kept: the kind of pointer hardly ever
 * changes within a session, and the next drawing follows it.
 *
 * @returns {boolean}
 */
export const isComputer = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  const userAgent = window.navigator?.userAgent ?? ''
  if (PHONE_OR_TABLET.test(userAgent)) return false
  if (userAgent.includes('Macintosh') && (window.navigator?.maxTouchPoints ?? 0) > 0) return false
  return window.matchMedia(FINE_POINTER_THAT_HOVERS)?.matches === true
}
