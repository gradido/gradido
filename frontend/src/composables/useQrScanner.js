// AI-GENERATED — not an architecture reference

import { ref } from 'vue'
import { createQrDetector } from '@/utils/qrDetector'

/**
 * The camera and the detection loop behind the scanner page.
 *
 * Kept out of the component for the same reason the calculator keeps its arithmetic in
 * `useCalculator`: the page renders states, this decides them — and the discipline rules
 * below are testable here without a camera.
 *
 * ## The discipline rules
 *
 * - **Every stop stops every track.** A camera that keeps running is the most expensive
 *   standing cost on a market day, and the iOS camera light would rightly raise
 *   suspicion. `stop()` also catches the race where somebody leaves the page while
 *   `getUserMedia` is still asking: the stream that arrives after `stop()` is stopped
 *   on arrival instead of leaking.
 * - **~10 detections per second, not every frame.** Battery and heat over a market day;
 *   a QR code held into a viewfinder does not need 60 looks a second.
 * - **One detection at a time.** `detect()` is async; on a slow device a new tick must
 *   not pile onto a running one.
 */

/** The pace of the loop: one look every 100 ms. */
const DETECT_INTERVAL_MS = 100

/**
 * @param {(rawValue: string) => void} onCode called with each detected QR payload while
 *   scanning is neither paused nor stopped. Deciding what a payload means is the
 *   caller's business — this loop only reads.
 */
export const useQrScanner = (onCode) => {
  /** 'idle' | 'starting' | 'scanning' | 'denied' | 'unavailable' */
  const state = ref('idle')

  let stream = null
  let video = null
  let timer = null
  let stopped = false
  let busy = false
  let paused = false

  const stopTracks = (mediaStream) => {
    mediaStream?.getTracks().forEach((track) => track.stop())
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

  const start = async (videoElement) => {
    // A start over a running scanner (the page coming back to visibility) must not
    // stack a second loop or leak the first stream — starting begins with stopping.
    stop()
    video = videoElement
    stopped = false
    paused = false
    state.value = 'starting'

    if (!navigator.mediaDevices?.getUserMedia) {
      state.value = 'unavailable'
      return
    }

    let mediaStream
    let detector
    try {
      // In parallel: on iOS the polyfill's wasm may take a moment on first load, and at
      // a till the seconds between opening and scanning are the ones that count.
      ;[mediaStream, detector] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          audio: false,
          // The back camera on a phone; a desktop has no environment-facing camera and
          // falls back to whatever it has. `ideal` rather than `exact`, because `exact`
          // refuses outright on devices without one.
          video: { facingMode: { ideal: 'environment' } },
        }),
        createQrDetector(),
      ])
    } catch (error) {
      state.value = refusalState(error)
      return
    }

    // The race: somebody left while the permission prompt was open. The stream exists
    // now — it is stopped here, not leaked.
    if (stopped) {
      stopTracks(mediaStream)
      return
    }

    stream = mediaStream
    video.srcObject = mediaStream
    try {
      await video.play()
    } catch {
      // play() refusing (a browser policy corner) leaves a black viewfinder with a
      // running camera — worse than the honest fallback view.
      stop()
      state.value = 'unavailable'
      return
    }
    if (stopped) {
      return
    }

    state.value = 'scanning'
    timer = window.setInterval(async () => {
      // readyState < 2: the video has no current frame yet — detect() would throw.
      if (busy || paused || stopped || video.readyState < 2) {
        return
      }
      busy = true
      try {
        const codes = await detector.detect(video)
        const rawValue = codes?.[0]?.rawValue
        if (rawValue && !paused && !stopped) {
          onCode(rawValue)
        }
      } catch {
        // A single failed look is not a failed scanner; the next tick looks again.
      } finally {
        busy = false
      }
    }, DETECT_INTERVAL_MS)
  }

  const stop = () => {
    stopped = true
    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
    stopTracks(stream)
    stream = null
    if (video) {
      video.srcObject = null
      video = null
    }
    state.value = 'idle'
  }

  /** Holds the loop while the confirmation card is open; the video keeps running. */
  const pause = () => {
    paused = true
  }

  const resume = () => {
    paused = false
  }

  return { state, start, stop, pause, resume }
}
