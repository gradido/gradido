// AI-GENERATED — not an architecture reference
import { onBeforeUnmount } from 'vue'

// A keyboard takes at least this much of the page's height.
const KEYBOARD_PX = 120
// Nothing moved for this long: the visible part rests, the swing after a swipe included.
const REST_MS = 350

const isAndroid = () => /Android/.test(window.navigator?.userAgent ?? '')

/**
 * A finger that takes the field out of sight has left it: the field gives up the focus, and the
 * keyboard goes with it. The window then stands as after a tap beside the field -- the head at the
 * top, the bar at the bottom, the words still in the field.
 *
 * Chrome on Android (since 108) lets a keyboard shrink only the visible part of the page. The
 * window stays as high as it was, and a swipe can move the visible part over it. Without this the
 * field keeps the focus and the keyboard stays open, with the field underneath (Android 16,
 * measured 31.10.2026: Chrome 133 over the whole window, Brave 1.98 over the bar). A swipe back
 * does not bring it up while the thread stands at its end: `overscroll-behavior: contain`.
 *
 * ⛔ Only a finger that moved decides. The browser moves the visible part too, when the keyboard
 * opens and with every letter, and a field that is covered for a moment then has not been left.
 *
 * ⛔ Android only (Bernd, 31.10.2026): the iPhone has no such problem and stays as it is, Chrome and
 * Brave on it included, so asked of the system and not of the browser's name. Nothing listens there.
 *
 * Listening only while the field holds the focus: `start` and `stop` belong on its focus and blur.
 *
 * @param {import('vue').Ref<HTMLElement | null>} field
 * @returns {{ start: () => void, stop: () => void }}
 */
export const useFieldOutOfSight = (field) => {
  let viewport = null
  let fingers = 0
  let fingerMoved = false
  let rest = null

  const keyboardIsOpen = () =>
    Math.abs(viewport.scale - 1) < 0.01 && window.innerHeight - viewport.height > KEYBOARD_PX

  const fieldIsOutOfSight = () => {
    const box = field.value?.getBoundingClientRect()
    if (!box) return false
    const middle = (box.top + box.bottom) / 2
    return middle < viewport.offsetTop || middle > viewport.offsetTop + viewport.height
  }

  const look = () => {
    rest = null
    if (fingers > 0 || !fingerMoved) return
    fingerMoved = false
    if (keyboardIsOpen() && fieldIsOutOfSight()) field.value.blur()
  }

  const lookAtRest = () => {
    clearTimeout(rest)
    rest = setTimeout(look, REST_MS)
  }

  const onTouchStart = (event) => {
    fingers = event.touches.length
  }
  const onTouchMove = () => {
    fingerMoved = true
  }
  const onTouchEnd = (event) => {
    fingers = event.touches.length
    lookAtRest()
  }

  const heard = { capture: true, passive: true }

  const stop = () => {
    if (!viewport) return
    clearTimeout(rest)
    viewport.removeEventListener('scroll', lookAtRest)
    document.removeEventListener('touchstart', onTouchStart, heard)
    document.removeEventListener('touchmove', onTouchMove, heard)
    document.removeEventListener('touchend', onTouchEnd, heard)
    document.removeEventListener('touchcancel', onTouchEnd, heard)
    viewport = null
  }

  const start = () => {
    stop()
    viewport = isAndroid() ? (window.visualViewport ?? null) : null
    if (!viewport) return
    fingerMoved = false
    viewport.addEventListener('scroll', lookAtRest)
    document.addEventListener('touchstart', onTouchStart, heard)
    document.addEventListener('touchmove', onTouchMove, heard)
    document.addEventListener('touchend', onTouchEnd, heard)
    document.addEventListener('touchcancel', onTouchEnd, heard)
  }

  onBeforeUnmount(stop)
  return { start, stop }
}
