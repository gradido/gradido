// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { routeSection } from './routeSection'

describe('routeSection', () => {
  it('names the section a path belongs to', () => {
    expect(routeSection('/overview')).toBe('overview')
    expect(routeSection('/contributions/contribute')).toBe('contributions')
    expect(routeSection('/matching/entries')).toBe('matching')
    expect(routeSection('/settings/gradido-card')).toBe('settings')
    expect(routeSection('/send/gradido.net/eva')).toBe('send')
  })

  /**
   * ⛔ The whole reason this has a home of its own. Both copies it replaces needed a
   * character AFTER the slash, so a trailing one was read as part of the section -- and a
   * router really hands that path over: `/overview/` matches the `/overview` record.
   */
  it.each(['/overview/', '/contributions/', '/matching/', '/settings/'])(
    'reads %s as the same section as without the slash',
    (path) => {
      expect(routeSection(path)).toBe(routeSection(path.slice(0, -1)))
      expect(routeSection(path)).not.toBe('')
    },
  )

  // Asked on every route change, so what a route cannot produce it still has to survive.
  it('names no section where there is none', () => {
    expect(routeSection('/')).toBe('')
    expect(routeSection('')).toBe('')
    expect(routeSection(null)).toBe('')
    expect(routeSection(undefined)).toBe('')
  })
})
