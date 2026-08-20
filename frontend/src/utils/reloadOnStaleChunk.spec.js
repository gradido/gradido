// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { installStaleChunkReload } from './reloadOnStaleChunk'

/**
 * The net under every deploy: an app that is already open asks for files the deploy has
 * replaced. One reload cures it; a reload LOOP would be worse than the error.
 */
const makeWindow = ({ storageThrows = false } = {}) => {
  const listeners = {}
  const stored = new Map()
  return {
    addEventListener: (name, handler) => {
      listeners[name] = handler
    },
    fire: (name) => {
      const event = { defaultPrevented: false, preventDefault: vi.fn() }
      listeners[name](event)
      return event
    },
    sessionStorage: {
      getItem: (key) => {
        if (storageThrows) throw new Error('denied')
        return stored.get(key) ?? null
      },
      setItem: (key, value) => {
        if (storageThrows) throw new Error('denied')
        stored.set(key, value)
      },
    },
    location: { reload: vi.fn() },
  }
}

describe('installStaleChunkReload', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reloads once and swallows the error, so the fresh app takes over quietly', () => {
    const win = makeWindow()
    installStaleChunkReload(win)
    const event = win.fire('vite:preloadError')

    expect(win.location.reload).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  /**
   * ⛔ The guard this file exists for. If the reload does not cure the failure, a second
   * fault arrives right after the first -- and reloading again would flicker forever.
   */
  it('does not reload again within the minute', () => {
    const win = makeWindow()
    installStaleChunkReload(win)
    win.fire('vite:preloadError')
    vi.advanceTimersByTime(10 * 1000)
    const second = win.fire('vite:preloadError')

    expect(win.location.reload).toHaveBeenCalledTimes(1)
    expect(second.preventDefault).not.toHaveBeenCalled()
  })

  it('is willing again once the minute has passed', () => {
    const win = makeWindow()
    installStaleChunkReload(win)
    win.fire('vite:preloadError')
    vi.advanceTimersByTime(61 * 1000)
    win.fire('vite:preloadError')

    expect(win.location.reload).toHaveBeenCalledTimes(2)
  })

  /**
   * ⚠️ A marker ahead of the clock -- a clock put back, or a hand-written Infinity -- must
   * not park the cure forever. Same clock class as the parked amount's expiry.
   */
  it.each([
    ['a future timestamp', () => String(Date.now() + 2 * 60 * 60 * 1000)],
    ['Infinity', () => 'Infinity'],
  ])('still reloads when the marker holds %s', (_name, marker) => {
    const win = makeWindow()
    win.sessionStorage.setItem('stale-chunk-reloaded-at', marker())
    installStaleChunkReload(win)
    win.fire('vite:preloadError')

    expect(win.location.reload).toHaveBeenCalledTimes(1)
  })

  /**
   * ⚠️ No marker, no reload. Without the marker the once-a-minute guard cannot hold, and a
   * silent reload loop is worse than the error it would hide.
   */
  it('leaves the error alone when the marker cannot be written', () => {
    const win = makeWindow({ storageThrows: true })
    installStaleChunkReload(win)
    const event = win.fire('vite:preloadError')

    expect(win.location.reload).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})
