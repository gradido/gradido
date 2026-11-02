// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PHONE_BREAKPOINT_PX } from '@/constants'
import { forgetViewport, useViewport } from './useViewport'

/**
 * A stand-in MediaQueryList. `modern` decides which of the two listener spellings it offers --
 * Safari 14 / iOS 14 brought `addEventListener`, and everything before them has only
 * `addListener`.
 */
const mediaQueryList = (matches, { modern = true } = {}) => {
  const handlers = []
  const list = {
    matches,
    media: '',
    fire(next) {
      for (const handler of handlers) {
        handler({ matches: next })
      }
    },
    handlers,
  }
  if (modern) {
    list.addEventListener = vi.fn((unused, handler) => handlers.push(handler))
    list.removeEventListener = vi.fn((unused, handler) => {
      const at = handlers.indexOf(handler)
      if (at >= 0) {
        handlers.splice(at, 1)
      }
    })
  } else {
    list.addListener = vi.fn((handler) => handlers.push(handler))
    list.removeListener = vi.fn((handler) => {
      const at = handlers.indexOf(handler)
      if (at >= 0) {
        handlers.splice(at, 1)
      }
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
  // jsdom has no `matchMedia`, so this is the state every other spec of the admin runs in --
  // and the contribution page shows its desk table there, exactly as before.
  it('says it cannot tell where the browser cannot be asked', () => {
    expect(useViewport().value).toBe('unknown')
  })

  it.each([
    [true, 'desktop'],
    [false, 'mobile'],
  ])('answers %s -> %s, on the boundary where the tables stack', (matches, expected) => {
    const matchMedia = stub(mediaQueryList(matches))

    expect(useViewport().value).toBe(expected)
    expect(matchMedia).toHaveBeenCalledWith(`(min-width: ${PHONE_BREAKPOINT_PX}px)`)
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

  // An unguarded `addEventListener` throws on an engine that has only `addListener`, and the
  // composable is called in a page's setup -- the page would stay blank.
  it('works on an engine that has only the old listener spelling', () => {
    const list = mediaQueryList(false, { modern: false })
    stub(list)

    expect(() => useViewport()).not.toThrow()
    expect(useViewport().value).toBe('mobile')
    list.fire(true)
    expect(useViewport().value).toBe('desktop')
  })

  // Neither spelling: the value is read once and never updates. A page that renders beats one
  // that does not.
  it('still answers on an engine that offers no listener at all', () => {
    stub({ matches: true, media: '' })

    expect(() => useViewport()).not.toThrow()
    expect(useViewport().value).toBe('desktop')
  })

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

  it('asks the browser once, however many parts of the page want to know', () => {
    const matchMedia = stub(mediaQueryList(false))

    useViewport()
    useViewport()

    expect(matchMedia).toHaveBeenCalledTimes(1)
  })
})
