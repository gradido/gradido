// AI-GENERATED — not an architecture reference
import { describe, it, expect, afterEach, vi } from 'vitest'
import { forgetViewport, useViewport } from './useViewport'
import { LG_BREAKPOINT_PX } from '@/constants'

/**
 * A stand-in MediaQueryList. `modern` decides which of the two listener spellings it
 * offers -- Safari 14 / iOS 14 brought `addEventListener`, and everything before them has
 * only `addListener`.
 */
const mediaQueryList = (matches, { modern = true } = {}) => {
  const handlers = []
  const list = {
    matches,
    media: '',
    fire(next) {
      for (const handler of handlers) handler({ matches: next })
    },
    handlers,
  }
  if (modern) {
    list.addEventListener = vi.fn((unused, handler) => handlers.push(handler))
    list.removeEventListener = vi.fn((unused, handler) => {
      const at = handlers.indexOf(handler)
      if (at >= 0) handlers.splice(at, 1)
    })
  } else {
    list.addListener = vi.fn((handler) => handlers.push(handler))
    list.removeListener = vi.fn((handler) => {
      const at = handlers.indexOf(handler)
      if (at >= 0) handlers.splice(at, 1)
    })
  }
  return list
}

const stub = (list) => {
  const matchMedia = vi.fn(() => list)
  vi.stubGlobal('matchMedia', matchMedia)
  return matchMedia
}

afterEach(() => {
  forgetViewport()
  vi.unstubAllGlobals()
})

describe('useViewport', () => {
  /**
   * ⛔ jsdom has no `matchMedia` at all, so this is the state every other spec in the tree
   * runs in -- and the layout mounts both columns there, exactly as it did before this
   * composable existed. Nothing may vanish because a media query was unavailable.
   */
  it('says it cannot tell where the browser cannot be asked', () => {
    expect(useViewport().value).toBe('unknown')
  })

  it.each([
    [true, 'desktop'],
    [false, 'mobile'],
  ])('answers %s -> %s, on this wallet own boundary', (matches, expected) => {
    const matchMedia = stub(mediaQueryList(matches))

    expect(useViewport().value).toBe(expected)
    // ⛔ The wallet's `lg`, not Bootstrap's default -- see the drift spec beside this one.
    expect(matchMedia).toHaveBeenCalledWith(`(min-width: ${LG_BREAKPOINT_PX}px)`)
  })

  it('follows the window when it is resized across the boundary', () => {
    const list = mediaQueryList(true)
    stub(list)
    const viewport = useViewport()

    list.fire(false)
    expect(viewport.value).toBe('mobile')
    list.fire(true)
    expect(viewport.value).toBe('desktop')
  })

  /**
   * ⛔ The crash this file's fallback promise was not keeping. `MediaQueryList.addEventListener`
   * arrived in Safari 14 / iOS 14; before that there is only `addListener`. An unguarded call
   * throws, and this composable is a bare statement in the layout's `setup()` -- so the throw
   * aborted setup and left the whole wallet blank on those devices.
   */
  it('works on an engine that has only the old listener spelling', () => {
    const list = mediaQueryList(false, { modern: false })
    stub(list)

    expect(() => useViewport()).not.toThrow()
    expect(useViewport().value).toBe('mobile')
    list.fire(true)
    expect(useViewport().value).toBe('desktop')
  })

  // Neither spelling: the value is read once and never updates. A window nobody resizes is
  // the common case, and a wallet that renders beats one that does not.
  it('still answers on an engine that offers no listener at all', () => {
    stub({ matches: true, media: '' })

    expect(() => useViewport()).not.toThrow()
    expect(useViewport().value).toBe('desktop')
  })

  /**
   * ⛔ The listener is REMOVED, not merely forgotten. Called repeatedly -- which is what a
   * spec does around a stubbed query -- the old shape left one live closure per call, each
   * still writing into this one module ref, so the last to fire won and the value could
   * belong to a finished test.
   */
  it('lets go of the query it was listening to', () => {
    const first = mediaQueryList(true)
    stub(first)
    useViewport()
    expect(first.handlers).toHaveLength(1)

    forgetViewport()
    expect(first.handlers).toHaveLength(0)

    const second = mediaQueryList(false)
    stub(second)
    const viewport = useViewport()
    expect(viewport.value).toBe('mobile')

    // The old query can no longer speak for the new one.
    first.fire(true)
    expect(viewport.value).toBe('mobile')
  })
})
