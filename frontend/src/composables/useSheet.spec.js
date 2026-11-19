// AI-GENERATED — not an architecture reference
import { describe, it, expect, afterEach, vi } from 'vitest'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { forgetSheet, SHEET_QUERY, useSheet } from './useSheet'

/** A stand-in MediaQueryList with the listener spelling of Safari 14 on, or the one before it. */
const mediaQueryList = (matches, { modern = true } = {}) => {
  const handlers = []
  const list = {
    matches,
    fire: (next) => handlers.forEach((handler) => handler({ matches: next })),
  }
  if (modern) {
    list.addEventListener = vi.fn((unused, handler) => handlers.push(handler))
    list.removeEventListener = vi.fn((unused, handler) =>
      handlers.splice(handlers.indexOf(handler), 1),
    )
  } else {
    list.addListener = vi.fn((handler) => handlers.push(handler))
    list.removeListener = vi.fn((handler) => handlers.splice(handlers.indexOf(handler), 1))
  }
  return list
}

afterEach(() => {
  forgetSheet()
  vi.unstubAllGlobals()
})

describe('useSheet', () => {
  // jsdom has no matchMedia: the state every other spec runs in, and the desk form.
  it('says no where the browser cannot be asked', () => {
    expect(useSheet().value).toBe(false)
  })

  it.each([true, false])('asks for the sheet and answers %s', (matches) => {
    const matchMedia = vi.fn(() => mediaQueryList(matches))
    vi.stubGlobal('matchMedia', matchMedia)
    expect(useSheet().value).toBe(matches)
    expect(matchMedia).toHaveBeenCalledWith(SHEET_QUERY)
  })

  it.each([true, false])(
    'follows the window, listening as the browser can (modern: %s)',
    (modern) => {
      const list = mediaQueryList(false, { modern })
      vi.stubGlobal('matchMedia', () => list)
      const sheet = useSheet()
      list.fire(true)
      expect(sheet.value).toBe(true)
      list.fire(false)
      expect(sheet.value).toBe(false)
    },
  )

  // A thread of a few hundred bubbles asks once.
  it('asks once for every caller', () => {
    const matchMedia = vi.fn(() => mediaQueryList(true))
    vi.stubGlobal('matchMedia', matchMedia)
    useSheet()
    useSheet()
    expect(matchMedia).toHaveBeenCalledTimes(1)
  })

  it('lets the browser go when it forgets', () => {
    const list = mediaQueryList(true)
    vi.stubGlobal('matchMedia', () => list)
    useSheet()
    forgetSheet()
    expect(list.removeEventListener).toHaveBeenCalledTimes(1)
    expect(useSheet().value).toBe(true)
  })

  // The same boundary as the sheet in the stylesheets: Bootstrap's `sm`, which the chat windows'
  // `fullscreen="sm"` and their sheet rules use.
  it('asks for the boundary the stylesheets use', () => {
    const bubble = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../components/Chat/ChatBubble.module.scss'),
      'utf8',
    )
    expect(SHEET_QUERY).toBe('(max-width: 575.98px)')
    expect(bubble).toContain('@media (width <= 575.98px) {')
  })
})
