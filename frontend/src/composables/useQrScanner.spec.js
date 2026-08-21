// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useQrScanner } from './useQrScanner'

/**
 * The camera loop's discipline, with a mocked camera and detector.
 *
 * The one property this file exists for: EVERY way out stops EVERY track. A camera that
 * keeps running is the scanner's most expensive failure — battery, heat, and an iOS
 * camera light that rightly makes people distrust the wallet.
 */

const detectMock = vi.fn()
vi.mock('@/utils/qrDetector', () => ({
  createQrDetector: () => Promise.resolve({ detect: detectMock }),
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
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve()
  }
}

describe('useQrScanner', () => {
  let getUserMediaMock

  beforeEach(() => {
    vi.useFakeTimers()
    detectMock.mockReset()
    detectMock.mockResolvedValue([])
    getUserMediaMock = vi.fn()
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: getUserMediaMock },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    delete navigator.mediaDevices
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

  it('starts the back camera and lands in scanning', async () => {
    const { scanner, video } = await startScanner()
    expect(getUserMediaMock).toHaveBeenCalledWith({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    })
    expect(video.srcObject).not.toBeNull()
    expect(video.play).toHaveBeenCalled()
    expect(scanner.state.value).toBe('scanning')
  })

  it('reports a detected code to the caller', async () => {
    detectMock.mockResolvedValue([{ rawValue: 'https://c.gradido.net/dk/abc' }])
    const { onCode } = await startScanner()
    await vi.advanceTimersByTimeAsync(100)
    expect(onCode).toHaveBeenCalledWith('https://c.gradido.net/dk/abc')
  })

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

  // ⛔ The leak this composable exists to prevent: leaving while the permission prompt
  // is still open. The stream arrives AFTER stop() — and must be stopped on arrival.
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
    expect(track.stop).toHaveBeenCalled()
  })

  it('pause() holds the loop, resume() lets it look again', async () => {
    detectMock.mockResolvedValue([{ rawValue: 'x' }])
    const { scanner, onCode } = await startScanner()
    scanner.pause()
    await vi.advanceTimersByTimeAsync(300)
    expect(onCode).not.toHaveBeenCalled()
    scanner.resume()
    await vi.advanceTimersByTimeAsync(100)
    expect(onCode).toHaveBeenCalledTimes(1)
  })

  it('never runs two detections at once', async () => {
    let finishDetect
    detectMock.mockReturnValue(
      new Promise((resolve) => {
        finishDetect = () => resolve([])
      }),
    )
    await startScanner()
    await vi.advanceTimersByTimeAsync(400)
    expect(detectMock).toHaveBeenCalledTimes(1)
    finishDetect()
    await flushAsync()
    await vi.advanceTimersByTimeAsync(100)
    expect(detectMock).toHaveBeenCalledTimes(2)
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

  it('answers a refused permission with denied', async () => {
    getUserMediaMock.mockRejectedValue(
      Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
    )
    const scanner = useQrScanner(vi.fn())
    await scanner.start(makeVideo())
    expect(scanner.state.value).toBe('denied')
  })

  it('answers a missing camera with unavailable', async () => {
    getUserMediaMock.mockRejectedValue(Object.assign(new Error('none'), { name: 'NotFoundError' }))
    const scanner = useQrScanner(vi.fn())
    await scanner.start(makeVideo())
    expect(scanner.state.value).toBe('unavailable')
  })

  it('answers a missing mediaDevices with unavailable', async () => {
    delete navigator.mediaDevices
    const scanner = useQrScanner(vi.fn())
    await scanner.start(makeVideo())
    expect(scanner.state.value).toBe('unavailable')
  })

  // A refused play() would leave a black viewfinder over a RUNNING camera — the honest
  // answer is the fallback view, with the track stopped.
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
