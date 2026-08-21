// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useQrScanner } from './useQrScanner'

/**
 * The camera loop's discipline, with a mocked camera and detector.
 *
 * The one property this file exists for: EVERY way out stops EVERY track — including
 * the racy ways (a stream arriving after stop(), a start superseded by a newer one, a
 * granted camera whose detector half failed). A camera that keeps running is the
 * scanner's most expensive failure — battery, heat, and an iOS camera light that
 * rightly makes people distrust the wallet.
 */

const detectMock = vi.fn()
const createQrDetectorMock = vi.fn()
vi.mock('@/utils/qrDetector', () => ({
  createQrDetector: (options) => createQrDetectorMock(options),
}))

/** A stream whose tracks remember whether somebody stopped them. */
const makeStream = () => {
  const track = { stop: vi.fn() }
  return { stream: { getTracks: () => [track] }, track }
}

/** The video element, as far as the loop touches it. */
const makeVideo = () => ({ srcObject: null, readyState: 4, play: vi.fn(() => Promise.resolve()) })

const flushAsync = async () => {
  // Lets the chained promises inside start()/the detect tick settle while timers are fake.
  for (let i = 0; i < 8; i += 1) {
    await Promise.resolve()
  }
}

const setVisibility = (value) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value })
}

const fireVisibility = async (value) => {
  setVisibility(value)
  document.dispatchEvent(new Event('visibilitychange'))
  await flushAsync()
}

describe('useQrScanner', () => {
  let getUserMediaMock

  beforeEach(() => {
    vi.useFakeTimers()
    setVisibility('visible')
    detectMock.mockReset()
    detectMock.mockResolvedValue([])
    createQrDetectorMock.mockReset()
    createQrDetectorMock.mockResolvedValue({ detect: detectMock })
    getUserMediaMock = vi.fn()
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: getUserMediaMock },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    delete navigator.mediaDevices
    setVisibility('visible')
  })

  const startScanner = async (onCode = vi.fn()) => {
    const { stream, track } = makeStream()
    getUserMediaMock.mockResolvedValue(stream)
    const video = makeVideo()
    const scanner = useQrScanner(onCode)
    await scanner.start(video)
    await flushAsync()
    return { scanner, video, track, onCode }
  }

  describe('starting and scanning', () => {
    it('starts the back camera and lands in scanning', async () => {
      const { scanner, video } = await startScanner()
      expect(getUserMediaMock).toHaveBeenCalledWith({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      })
      expect(video.srcObject).not.toBeNull()
      expect(video.play).toHaveBeenCalled()
      expect(scanner.state.value).toBe('scanning')
      scanner.stop()
    })

    it('reports a detected code to the caller', async () => {
      detectMock.mockResolvedValue([{ rawValue: 'https://c.gradido.net/dk/abc' }])
      const { scanner, onCode } = await startScanner()
      await vi.advanceTimersByTimeAsync(100)
      expect(onCode).toHaveBeenCalledWith('https://c.gradido.net/dk/abc')
      scanner.stop()
    })

    it('never runs two detections at once', async () => {
      let finishDetect
      detectMock.mockReturnValue(
        new Promise((resolve) => {
          finishDetect = () => resolve([])
        }),
      )
      const { scanner } = await startScanner()
      await vi.advanceTimersByTimeAsync(400)
      expect(detectMock).toHaveBeenCalledTimes(1)
      finishDetect()
      await flushAsync()
      await vi.advanceTimersByTimeAsync(100)
      expect(detectMock).toHaveBeenCalledTimes(2)
      scanner.stop()
    })

    it('waits for the video to carry a frame before looking', async () => {
      const { stream } = makeStream()
      getUserMediaMock.mockResolvedValue(stream)
      const video = makeVideo()
      video.readyState = 1
      const scanner = useQrScanner(vi.fn())
      await scanner.start(video)
      await flushAsync()
      await vi.advanceTimersByTimeAsync(300)
      expect(detectMock).not.toHaveBeenCalled()
      scanner.stop()
    })
  })

  describe('every way out stops every track', () => {
    it('stop() stops every track and lets go of the video', async () => {
      const { scanner, video, track } = await startScanner()
      scanner.stop()
      expect(track.stop).toHaveBeenCalled()
      expect(video.srcObject).toBeNull()
      expect(scanner.state.value).toBe('idle')
    })

    it('stops looking once stopped', async () => {
      detectMock.mockResolvedValue([{ rawValue: 'x' }])
      const { scanner, onCode } = await startScanner()
      scanner.stop()
      await vi.advanceTimersByTimeAsync(500)
      expect(onCode).not.toHaveBeenCalled()
    })

    // ⛔ Leaving while the permission prompt is still open: the stream arrives AFTER
    // stop() — and must be stopped on arrival.
    it('stops a stream that arrives after stop()', async () => {
      const { stream, track } = makeStream()
      let handOver
      getUserMediaMock.mockReturnValue(
        new Promise((resolve) => {
          handOver = () => resolve(stream)
        }),
      )
      const scanner = useQrScanner(vi.fn())
      const starting = scanner.start(makeVideo())
      scanner.stop()
      handOver()
      await starting
      await flushAsync()
      expect(track.stop).toHaveBeenCalled()
    })

    // ⛔ The interleaving the old shared flag could not survive: start #1 parked in
    // getUserMedia, stop(), start #2, then BOTH grants resolve. The superseded stream
    // must be stopped, only one loop may run, and only one code may be reported.
    it('a superseded start hands its late stream straight to the graveyard', async () => {
      const first = makeStream()
      const second = makeStream()
      let grantFirst
      getUserMediaMock
        .mockReturnValueOnce(
          new Promise((resolve) => {
            grantFirst = () => resolve(first.stream)
          }),
        )
        .mockResolvedValueOnce(second.stream)
      detectMock.mockResolvedValue([{ rawValue: 'x' }])
      const onCode = vi.fn()
      const scanner = useQrScanner(onCode)
      const video = makeVideo()

      const firstStart = scanner.start(video)
      scanner.stop()
      const secondStart = scanner.start(video)
      grantFirst()
      await firstStart
      await secondStart
      await flushAsync()

      expect(first.track.stop).toHaveBeenCalled()
      expect(second.track.stop).not.toHaveBeenCalled()
      expect(scanner.state.value).toBe('scanning')
      await vi.advanceTimersByTimeAsync(100)
      expect(onCode).toHaveBeenCalledTimes(1)
      scanner.stop()
      expect(second.track.stop).toHaveBeenCalled()
    })

    // ⛔ A granted camera whose detector half failed (polyfill chunk offline) must not
    // burn on behind the "no camera found" view.
    it('stops the granted stream when the detector cannot be built', async () => {
      const { stream, track } = makeStream()
      getUserMediaMock.mockResolvedValue(stream)
      createQrDetectorMock.mockRejectedValue(new TypeError('chunk load failed'))
      const scanner = useQrScanner(vi.fn())
      await scanner.start(makeVideo())
      await flushAsync()
      expect(scanner.state.value).toBe('unavailable')
      expect(track.stop).toHaveBeenCalled()
    })

    it('stops the stream when the video refuses to play', async () => {
      const { stream, track } = makeStream()
      getUserMediaMock.mockResolvedValue(stream)
      const video = makeVideo()
      video.play = vi.fn(() => Promise.reject(new Error('policy')))
      const scanner = useQrScanner(vi.fn())
      await scanner.start(video)
      await flushAsync()
      expect(track.stop).toHaveBeenCalled()
      expect(scanner.state.value).toBe('unavailable')
    })

    it('a second start does not stack a second loop', async () => {
      detectMock.mockResolvedValue([{ rawValue: 'x' }])
      const { stream } = makeStream()
      getUserMediaMock.mockResolvedValue(stream)
      const onCode = vi.fn()
      const scanner = useQrScanner(onCode)
      const video = makeVideo()
      await scanner.start(video)
      await flushAsync()
      await scanner.start(video)
      await flushAsync()
      await vi.advanceTimersByTimeAsync(100)
      expect(onCode).toHaveBeenCalledTimes(1)
      scanner.stop()
    })
  })

  describe('refusals and the state machine', () => {
    it('answers a refused permission with denied', async () => {
      getUserMediaMock.mockRejectedValue(
        Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
      )
      const scanner = useQrScanner(vi.fn())
      await scanner.start(makeVideo())
      await flushAsync()
      expect(scanner.state.value).toBe('denied')
    })

    it('answers a missing camera with unavailable', async () => {
      getUserMediaMock.mockRejectedValue(
        Object.assign(new Error('none'), { name: 'NotFoundError' }),
      )
      const scanner = useQrScanner(vi.fn())
      await scanner.start(makeVideo())
      await flushAsync()
      expect(scanner.state.value).toBe('unavailable')
    })

    it('answers a missing mediaDevices with unavailable', async () => {
      delete navigator.mediaDevices
      const scanner = useQrScanner(vi.fn())
      await scanner.start(makeVideo())
      expect(scanner.state.value).toBe('unavailable')
    })

    // ⛔ A rejection landing after stop() must not report anything: the OS dismissing
    // the permission prompt on an app switch used to flip the state to 'denied' and
    // wedge the page on a fallback the person never chose.
    it('a rejection after stop() leaves the state alone', async () => {
      let refuse
      getUserMediaMock.mockReturnValue(
        new Promise((resolve, reject) => {
          refuse = () => reject(Object.assign(new Error('dismissed'), { name: 'NotAllowedError' }))
        }),
      )
      const scanner = useQrScanner(vi.fn())
      const starting = scanner.start(makeVideo())
      scanner.stop()
      refuse()
      await starting
      await flushAsync()
      expect(scanner.state.value).toBe('idle')
    })

    // ⛔ stop() keeps the view state: 'denied' is a view somebody is reading, and a
    // tab switch used to swap it for a dead viewfinder and re-prompt on return.
    it('stop() does not tear down the denied view', async () => {
      getUserMediaMock.mockRejectedValue(
        Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
      )
      const scanner = useQrScanner(vi.fn())
      await scanner.start(makeVideo())
      await flushAsync()
      expect(scanner.state.value).toBe('denied')
      scanner.stop()
      expect(scanner.state.value).toBe('denied')
    })
  })

  describe('the camera follows the eyes', () => {
    it('a hidden tab stops the tracks; coming back restarts', async () => {
      const { scanner, track } = await startScanner()
      await fireVisibility('hidden')
      expect(track.stop).toHaveBeenCalled()
      expect(scanner.state.value).toBe('idle')

      const again = makeStream()
      getUserMediaMock.mockResolvedValue(again.stream)
      await fireVisibility('visible')
      expect(scanner.state.value).toBe('scanning')
      scanner.stop()
      expect(again.track.stop).toHaveBeenCalled()
    })

    // ⛔ A route opened in a background tab must not touch the camera until the tab is
    // first looked at — the light coming on in a hidden tab is the failure itself.
    it('does not start the camera in a hidden tab, and does on first sight', async () => {
      setVisibility('hidden')
      const { stream } = makeStream()
      getUserMediaMock.mockResolvedValue(stream)
      const scanner = useQrScanner(vi.fn())
      await scanner.start(makeVideo())
      await flushAsync()
      expect(getUserMediaMock).not.toHaveBeenCalled()
      expect(scanner.state.value).toBe('idle')

      await fireVisibility('visible')
      expect(getUserMediaMock).toHaveBeenCalledTimes(1)
      expect(scanner.state.value).toBe('scanning')
      scanner.stop()
    })

    it('coming back does not restart out of denied', async () => {
      getUserMediaMock.mockRejectedValue(
        Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
      )
      const scanner = useQrScanner(vi.fn())
      await scanner.start(makeVideo())
      await flushAsync()
      getUserMediaMock.mockClear()
      await fireVisibility('hidden')
      await fireVisibility('visible')
      expect(getUserMediaMock).not.toHaveBeenCalled()
      expect(scanner.state.value).toBe('denied')
      scanner.stop()
    })

    it('after stop() the eyes no longer matter', async () => {
      const { scanner } = await startScanner()
      scanner.stop()
      getUserMediaMock.mockClear()
      await fireVisibility('hidden')
      await fireVisibility('visible')
      expect(getUserMediaMock).not.toHaveBeenCalled()
    })
  })

  describe('pause and resume', () => {
    it('pause() holds the loop, resume() lets it look again', async () => {
      detectMock.mockResolvedValue([{ rawValue: 'x' }])
      const { scanner, onCode } = await startScanner()
      scanner.pause()
      await vi.advanceTimersByTimeAsync(300)
      expect(onCode).not.toHaveBeenCalled()
      scanner.resume()
      await vi.advanceTimersByTimeAsync(100)
      expect(onCode).toHaveBeenCalledTimes(1)
      scanner.stop()
    })

    // The pause belongs to the PAGE (an open sheet), not to the camera run: hiding and
    // showing the tab restarts the camera but must not secretly resume the loop.
    it('a visibility round-trip keeps a pause paused', async () => {
      detectMock.mockResolvedValue([{ rawValue: 'x' }])
      const { scanner, onCode } = await startScanner()
      scanner.pause()
      await fireVisibility('hidden')
      const again = makeStream()
      getUserMediaMock.mockResolvedValue(again.stream)
      await fireVisibility('visible')
      expect(scanner.state.value).toBe('scanning')
      await vi.advanceTimersByTimeAsync(300)
      expect(onCode).not.toHaveBeenCalled()
      scanner.stop()
    })
  })

  describe('a detector that only ever throws', () => {
    it('is swapped for the ponyfill after a second of failures', async () => {
      const goodDetect = vi.fn().mockResolvedValue([{ rawValue: 'works' }])
      detectMock.mockRejectedValue(new Error('Barcode detection service unavailable'))
      createQrDetectorMock.mockImplementation((options) =>
        options?.forcePonyfill
          ? Promise.resolve({ detect: goodDetect })
          : Promise.resolve({ detect: detectMock }),
      )
      const { scanner, onCode } = await startScanner()
      await vi.advanceTimersByTimeAsync(1000)
      await flushAsync()
      expect(createQrDetectorMock).toHaveBeenCalledWith({ forcePonyfill: true })
      await vi.advanceTimersByTimeAsync(100)
      expect(onCode).toHaveBeenCalledWith('works')
      scanner.stop()
    })

    it('lands on unavailable when the ponyfill fails just the same', async () => {
      detectMock.mockRejectedValue(new Error('nope'))
      createQrDetectorMock.mockResolvedValue({ detect: detectMock })
      const { scanner, track } = await startScanner()
      await vi.advanceTimersByTimeAsync(2200)
      await flushAsync()
      expect(scanner.state.value).toBe('unavailable')
      expect(track.stop).toHaveBeenCalled()
    })

    it('a single failed look is noise, not a demotion', async () => {
      detectMock
        .mockRejectedValueOnce(new Error('hiccup'))
        .mockResolvedValue([{ rawValue: 'fine' }])
      const { scanner, onCode } = await startScanner()
      await vi.advanceTimersByTimeAsync(200)
      expect(onCode).toHaveBeenCalledWith('fine')
      expect(createQrDetectorMock).not.toHaveBeenCalledWith({ forcePonyfill: true })
      scanner.stop()
    })

    // ⛔ Shared state is written only past the staleness check: a superseded run whose
    // detector resolves LATE must not reinstall a broken detector over the demotion the
    // current run just performed. (coderabbit, PR #3776)
    it('a superseded run cannot reinstall its detector over a demotion', async () => {
      const brokenDetect = vi.fn().mockRejectedValue(new Error('service unavailable'))
      const goodDetect = vi.fn().mockResolvedValue([{ rawValue: 'works' }])
      let handOverStale
      createQrDetectorMock.mockImplementation((options) => {
        if (options?.forcePonyfill) {
          return Promise.resolve({ detect: goodDetect })
        }
        return new Promise((resolve) => {
          const stale = handOverStale === undefined
          if (stale) {
            handOverStale = () => resolve({ detect: brokenDetect })
          } else {
            resolve({ detect: brokenDetect })
          }
        })
      })
      const staleStream = makeStream()
      const liveStream = makeStream()
      getUserMediaMock
        .mockResolvedValueOnce(staleStream.stream)
        .mockResolvedValueOnce(liveStream.stream)
      const onCode = vi.fn()
      const scanner = useQrScanner(onCode)
      const video = makeVideo()

      // Run A parks in createQrDetector; superseded; run B starts, fails a second of
      // looks with the broken native detector and demotes to the good ponyfill.
      const staleStart = scanner.start(video)
      scanner.stop()
      await scanner.start(video)
      await flushAsync()
      await vi.advanceTimersByTimeAsync(1000)
      await flushAsync()
      await vi.advanceTimersByTimeAsync(100)
      expect(onCode).toHaveBeenCalledWith('works')

      // NOW run A's detector arrives — and must change nothing.
      handOverStale()
      await staleStart
      await flushAsync()
      onCode.mockClear()
      await vi.advanceTimersByTimeAsync(100)
      expect(onCode).toHaveBeenCalledWith('works')
      scanner.stop()
    })

    // A detect() hanging forever belongs to its old generation — it must not hold the
    // `busy` latch against the NEXT run's loop.
    it('a hanging look does not block the next run', async () => {
      detectMock.mockReturnValueOnce(new Promise(() => {})).mockResolvedValue([])
      const { scanner, video } = await startScanner()
      await vi.advanceTimersByTimeAsync(100)
      expect(detectMock).toHaveBeenCalledTimes(1)

      const again = makeStream()
      getUserMediaMock.mockResolvedValue(again.stream)
      scanner.stop()
      await scanner.start(video)
      await flushAsync()
      await vi.advanceTimersByTimeAsync(100)
      expect(detectMock).toHaveBeenCalledTimes(2)
      scanner.stop()
    })
  })
})
