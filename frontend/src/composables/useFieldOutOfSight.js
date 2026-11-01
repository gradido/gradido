// AI-GENERATED — not an architecture reference
import { onBeforeUnmount } from 'vue'

// A keyboard takes at least this much of the page's height.
const KEYBOARD_PX = 120
// Nothing moved for this long: the visible part rests, the swing after a swipe included.
const REST_MS = 350
// Less than this on the screen is no movement: fractions of a pixel from the page's scale.
const MOVED_PX = 1
// A finger that travelled less than this has tapped: a browser draws the line at about 8 px.
const TAPPED_PX = 10

const isAndroid = () => /Android/.test(window.navigator?.userAgent ?? '')

/**
 * A field out of sight with the keyboard open, on Android. How it got there decides.
 *
 * A finger that took it out of sight has left it: the focus goes where a tap beside the field puts
 * it, to the window around it, and the keyboard goes with it. The window then stands as after that
 * tap -- the head at the top, the bar at the bottom, the words still in the field.
 *
 * Chrome on Android (since 108) lets a keyboard shrink only the visible part of the page. The
 * window stays as high as it was, and a swipe can move the visible part over it. Without this the
 * field keeps the focus and the keyboard stays open, with the field underneath (Android 16,
 * measured 31.10.2026: Chrome 133 over the whole window, Brave 1.98 over the bar). A swipe back
 * does not bring it up while the thread stands at its end: `overscroll-behavior: contain`.
 *
 * A keyboard that covered it gets the bar brought up, once the visible part rests. Brave 1.80
 * (Chromium 138, measured 01.11.2026) leaves the field covered where bars stand at the bottom of
 * the browser: they go when the keyboard comes, the window grows by their height, and nothing
 * scrolls. That fits a Chromium bug fixed from 145 on (`7cd16a14c6fa`). Chrome 133 and Brave 1.98
 * have brought the field up by then, and nothing happens.
 *
 * ⛔ Only a swipe takes it away: a finger that travelled, and a field that moved on the screen while
 * that finger was down. The browser moves the visible part too, when the keyboard opens and with
 * every letter, and a finger that only rolled the thread has not taken away a field that was covered
 * before it came. Those same bars move the field itself: a tap into a field already in focus looked
 * like a swipe until 01.11.2026, and the keyboard went again after a quarter of a second.
 *
 * ⛔ Not `blur` where there is a window: with nothing in focus the bar takes the focus back when a
 * message on its way lands (`focusStaysHere` in ChatComposeBar), and the keyboard with it.
 *
 * ⛔ Android only (Bernd, 31.10.2026): the iPhone has no such problem and stays as it is, Chrome and
 * Brave on it included, so asked of the system and not of the browser's name. Nothing listens there.
 *
 * Listening only while the field holds the focus: `start` and `stop` belong on its focus and blur.
 *
 * @param {import('vue').Ref<HTMLElement | null>} field
 * @param {import('vue').Ref<HTMLElement | null>} bar what is brought up with the field
 * @returns {{ start: () => void, stop: () => void }}
 */
export const useFieldOutOfSight = (field, bar) => {
  let viewport = null
  let fingers = 0
  let fieldWasAt = null
  const fingerCameDownAt = new Map()
  let fingerTravelled = false
  let swiped = false
  let viewportResized = false
  let rest = null

  const fieldOnScreen = () => {
    const box = field.value?.getBoundingClientRect()
    return box ? box.top - viewport.offsetTop : null
  }

  const keyboardIsOpen = () =>
    Math.abs(viewport.scale - 1) < 0.01 && window.innerHeight - viewport.height > KEYBOARD_PX

  const fieldIsOutOfSight = () => {
    const box = field.value?.getBoundingClientRect()
    if (!box) return false
    const middle = (box.top + box.bottom) / 2
    return middle < viewport.offsetTop || middle > viewport.offsetTop + viewport.height
  }

  const fieldIsCovered = () => {
    const box = field.value?.getBoundingClientRect()
    return box ? box.bottom > viewport.offsetTop + viewport.height : false
  }

  const leave = () => {
    const around = field.value.parentElement?.closest('[tabindex]')
    if (around) around.focus({ preventScroll: true })
    else field.value.blur()
  }

  // What the finger before the next one did. Read at rest, not when it lifts: the visible part is
  // still catching up with a quick flick then.
  const settleFinger = () => {
    const moved = fieldWasAt !== null && Math.abs(fieldOnScreen() - fieldWasAt) > MOVED_PX
    if (fingerTravelled && moved) swiped = true
    fingerTravelled = false
  }

  const look = () => {
    rest = null
    if (fingers > 0) return
    settleFinger()
    const swipedAway = swiped
    const keyboardCame = viewportResized
    swiped = false
    viewportResized = false
    if (!keyboardIsOpen()) return
    if (swipedAway && fieldIsOutOfSight()) leave()
    else if (keyboardCame && fieldIsCovered()) bar.value?.scrollIntoView({ block: 'nearest' })
  }

  const lookAtRest = () => {
    clearTimeout(rest)
    rest = setTimeout(look, REST_MS)
  }

  const onResize = () => {
    viewportResized = true
    lookAtRest()
  }

  const onTouchStart = (event) => {
    if (event.touches.length === 1) {
      settleFinger()
      // A swipe that left the field in sight is over: what moves it from now on is not its doing.
      swiped = swiped && fieldIsOutOfSight()
      fieldWasAt = fieldOnScreen()
    }
    for (const touch of Array.from(event.changedTouches)) {
      fingerCameDownAt.set(touch.identifier, touch.screenY)
    }
    fingers = event.touches.length
  }
  const onTouchEnd = (event) => {
    fingers = event.touches.length
    for (const touch of Array.from(event.changedTouches)) {
      const cameDownAt = fingerCameDownAt.get(touch.identifier)
      if (Math.abs(touch.screenY - cameDownAt) > TAPPED_PX) fingerTravelled = true
    }
    lookAtRest()
  }

  const heard = { capture: true, passive: true }

  const stop = () => {
    if (!viewport) return
    clearTimeout(rest)
    viewport.removeEventListener('scroll', lookAtRest)
    viewport.removeEventListener('resize', onResize)
    document.removeEventListener('touchstart', onTouchStart, heard)
    document.removeEventListener('touchend', onTouchEnd, heard)
    document.removeEventListener('touchcancel', onTouchEnd, heard)
    viewport = null
  }

  const start = () => {
    stop()
    viewport = isAndroid() ? (window.visualViewport ?? null) : null
    if (!viewport) return
    fingers = 0
    fieldWasAt = null
    swiped = false
    viewportResized = false
    viewport.addEventListener('scroll', lookAtRest)
    viewport.addEventListener('resize', onResize)
    document.addEventListener('touchstart', onTouchStart, heard)
    document.addEventListener('touchend', onTouchEnd, heard)
    document.addEventListener('touchcancel', onTouchEnd, heard)
  }

  onBeforeUnmount(stop)
  return { start, stop }
}
