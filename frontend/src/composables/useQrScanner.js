// AI-GENERATED — not an architecture reference

import { ref } from 'vue'
import { createQrDetector } from '@/utils/qrDetector'

/**
 * The camera and the detection loop behind the scanner page.
 *
 * Kept out of the component so the discipline rules below are testable without a camera —
 * the page renders states, this owns them.
 *
 * ## The discipline rules
 *
 * - **Every stop stops every track.** A camera that keeps running is the most expensive
 *   standing cost on a market day, and the iOS camera light would rightly raise
 *   suspicion. That includes the racy ways out: a stream that arrives after the scanner
 *   moved on — because the person left mid-permission-prompt, or because a NEWER start
 *   superseded this one — is stopped on arrival instead of leaking. The generation
 *   counter is what makes "moved on" checkable after every await.
 * - **The camera follows the eyes.** This composable owns the page-visibility handling:
 *   a hidden tab tears the camera down, coming back brings it up again, and a scanner
 *   opened IN a background tab does not touch the camera until the tab is first seen.
 * - **`stop()` keeps the view state.** 'denied' and 'unavailable' are views a person is
 *   reading; stopping a camera that is not running must not tear them down (they used to
 *   collapse into a dead viewfinder on every tab switch). Only a live viewfinder becomes
 *   'idle'.
 * - **~10 detections per second, not every frame.** Battery and heat over a market day.
 * - **One detection at a time.** `detect()` is async; on a slow device a new tick must
 *   not pile onto a running one.
 * - **A detector that only ever throws gets demoted.** A native detector can pass the
 *   format probe and still fail every `detect()` (Chromium without Google's detection
 *   service). After a second of consecutive failures the loop swaps in the ponyfill
 *   once; if that fails too, the honest fallback view beats a viewfinder that will
 *   never read anything.
 */

/** The pace of the loop: one look every 100 ms. */
const DETECT_INTERVAL_MS = 100

/** Consecutive failed looks (one second's worth) before the detector is distrusted. */
const DETECT_FAILURE_LIMIT = 10

/**
 * @param {(rawValue: string) => void} onCode called with each detected QR payload while
 *   scanning is neither paused nor stopped. Deciding what a payload means is the
 *   caller's business — this loop only reads.
 */
export const useQrScanner = (onCode) => {
  /** 'idle' | 'starting' | 'scanning' | 'denied' | 'unavailable' */
  const state = ref('idle')

  /**
   * Bumped by every teardown. Async work captures the value it started under and checks
   * it after every await — stale work must neither keep a stream nor touch the state.
   * ⛔ This replaces a shared boolean, which a newer start() had to RESET, un-arming the
   * guard of an older start() still awaiting getUserMedia: both then completed, and the
   * loser's camera track burned on until page unload.
   */
  let generation = 0
  /** True between start() and stop(): whether the page currently wants a camera. */
  let wanted = false

  let stream = null
  let video = null
  let timer = null
  let busy = false
  let paused = false
  /**
   * Hidden is its own hold, deliberately not `paused`: that one belongs to an open sheet,
   * and a tab switch while a sheet is open must not resume the loop underneath it.
   */
  let hiddenHold = false
  let graceTimer = null
  let detector = null
  let detectFailures = 0
  let triedPonyfillFallback = false

  const stopTracks = (mediaStream) => {
    mediaStream?.getTracks().forEach((track) => track.stop())
  }

  const clearGrace = () => {
    if (graceTimer !== null) {
      window.clearTimeout(graceTimer)
      graceTimer = null
    }
  }

  /** Tears the running camera down. Touches neither `wanted` nor the view state. */
  const teardown = () => {
    clearGrace()
    generation += 1
    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
    stopTracks(stream)
    stream = null
    if (video) {
      video.srcObject = null
    }
    // A detect() still in flight belongs to the old generation — its result is already
    // ignored, but a hanging one must not keep the NEXT run's loop from ever looking.
    busy = false
  }

  /**
   * ⚠️ `NotAllowedError` is the person saying no — that view offers the two old ways.
   * Everything else (no camera at all, camera in use, insecure context) is the device
   * saying no; same two ways, but the sentence about browser settings would mislead.
   */
  const refusalState = (error) =>
    error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError'
      ? 'denied'
      : 'unavailable'

  /**
   * The ponyfill as second opinion, once. Where the ponyfill was the first choice
   * already, this re-resolves the same cached module — harmless — and the second
   * strike then ends in the honest 'unavailable'.
   */
  const demoteDetector = async (gen) => {
    detectFailures = 0
    if (triedPonyfillFallback) {
      if (gen === generation) {
        teardown()
        state.value = 'unavailable'
      }
      return
    }
    triedPonyfillFallback = true
    try {
      const fallback = await createQrDetector({ forcePonyfill: true })
      if (gen === generation) {
        detector = fallback
      }
    } catch {
      if (gen === generation) {
        teardown()
        state.value = 'unavailable'
      }
    }
  }

  const run = async () => {
    teardown()
    const gen = generation
    state.value = 'starting'

    if (!navigator.mediaDevices?.getUserMedia) {
      state.value = 'unavailable'
      return
    }

    // Held separately from the Promise.all so a stream granted while the OTHER half
    // fails (the polyfill chunk offline, say) can still be stopped — inside the all,
    // a rejection makes the fulfilled stream unreachable and its light burns on.
    const streamPromise = navigator.mediaDevices.getUserMedia({
      audio: false,
      // The back camera on a phone; a desktop has no environment-facing camera and
      // falls back to whatever it has. `ideal` rather than `exact`, because `exact`
      // refuses outright on devices without one.
      video: { facingMode: { ideal: 'environment' } },
    })

    let mediaStream
    let freshDetector
    try {
      // In parallel: on iOS the polyfill's wasm takes a moment on first load, and at
      // a till the seconds between opening and scanning are the ones that count.
      ;[mediaStream, freshDetector] = await Promise.all([streamPromise, createQrDetector()])
    } catch (error) {
      streamPromise.then(stopTracks).catch(() => {})
      // A rejection landing after this run was superseded reports nothing: the state
      // belongs to whoever runs NOW, and overwriting it wedged the restart gate.
      if (gen === generation && wanted) {
        state.value = refusalState(error)
      }
      return
    }

    if (gen !== generation) {
      stopTracks(mediaStream)
      return
    }

    // ⛔ Only past the staleness check, like everything shared: a superseded run that
    // resolved late used to write the module `detector` here, reinstalling a detector
    // demoteDetector had just replaced under the CURRENT run. (coderabbit, PR #3776)
    detector = freshDetector
    stream = mediaStream
    video.srcObject = mediaStream
    try {
      await video.play()
    } catch {
      if (gen !== generation) {
        return
      }
      // play() refusing (a browser policy corner) leaves a black viewfinder with a
      // running camera — worse than the honest fallback view.
      teardown()
      state.value = 'unavailable'
      return
    }
    if (gen !== generation) {
      return
    }

    state.value = 'scanning'
    detectFailures = 0
    timer = window.setInterval(async () => {
      // readyState < 2: the video has no current frame yet — detect() would throw.
      if (busy || paused || hiddenHold || gen !== generation || video.readyState < 2) {
        return
      }
      busy = true
      try {
        const codes = await detector.detect(video)
        detectFailures = 0
        const rawValue = codes?.[0]?.rawValue
        if (rawValue && !paused && gen === generation) {
          onCode(rawValue)
        }
      } catch {
        // One failed look is noise. A second of nothing but failures is a detector
        // that cannot do its job on this device — see demoteDetector.
        detectFailures += 1
        if (detectFailures >= DETECT_FAILURE_LIMIT) {
          await demoteDetector(gen)
        }
      } finally {
        busy = false
      }
    }, DETECT_INTERVAL_MS)
  }

  /**
   * ⛔ Hiding no longer stops the camera AT ONCE, and that is the whole point.
   *
   * On a phone this fires for everything: switching apps, the screen dimming, a
   * notification pulled down, the app switcher. Tearing the tracks down there and calling
   * `getUserMedia` again on the way back is what made iOS ask for camera permission over
   * and over — WebKit ties the grant to a live capture, so a fresh request after the last
   * track stopped is a fresh question. (Bernd, 21.08.2026; the handler that did this was
   * added the same day the asking came back, which is the whole of the evidence.)
   *
   * So: the frames stop immediately -- `hiddenHold` holds the loop, nothing is decoded and
   * nothing is decided while nobody is looking -- and only a page that STAYS hidden loses
   * its camera.
   *
   * ⚠️ And the two platforms land where they should, for opposite reasons. A backgrounded
   * Safari has its timers suspended AND its capture stopped by iOS itself, so the grace
   * timer never fires, the light is off anyway, and coming back costs no question. A hidden
   * desktop tab keeps its timers, so the camera really is released -- which is where a
   * light burning in a tab nobody can see would be the problem.
   */
  const HIDDEN_GRACE_MS = 30000

  const onVisibilityChanged = () => {
    if (document.visibilityState === 'hidden') {
      hiddenHold = true
      if (graceTimer === null && (state.value === 'starting' || state.value === 'scanning')) {
        graceTimer = window.setTimeout(() => {
          graceTimer = null
          teardown()
          if (state.value === 'starting' || state.value === 'scanning') {
            state.value = 'idle'
          }
        }, HIDDEN_GRACE_MS)
      }
      return
    }
    // Coming back: let the loop look again, and drop a teardown that is now moot. Restart
    // only what hiding really stopped -- 'denied'/'unavailable' stay as they are, since
    // restarting there would re-prompt on every tab switch.
    hiddenHold = false
    clearGrace()
    if (wanted && state.value === 'idle' && video) {
      run()
    }
  }

  /**
   * Wants a camera into the given element. In a hidden tab (the route opened in a
   * background tab) nothing runs yet — the visibility handler brings the camera up
   * the first time the tab is actually looked at.
   */
  const start = (videoElement) => {
    video = videoElement
    wanted = true
    // Idempotent for the same listener reference; removed in stop().
    document.addEventListener('visibilitychange', onVisibilityChanged)
    if (document.visibilityState === 'hidden') {
      teardown()
      state.value = 'idle'
      return Promise.resolve()
    }
    return run()
  }

  const stop = () => {
    wanted = false
    hiddenHold = false
    document.removeEventListener('visibilitychange', onVisibilityChanged)
    teardown()
    video = null
    if (state.value === 'starting' || state.value === 'scanning') {
      state.value = 'idle'
    }
  }

  /** Holds the loop while a sheet is open; the video keeps running. */
  const pause = () => {
    paused = true
  }

  const resume = () => {
    paused = false
  }

  return { state, start, stop, pause, resume }
}
