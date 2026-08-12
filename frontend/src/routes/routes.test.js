// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi, afterEach } from 'vitest'

// routes.js reads the flag once, when the module is loaded — so each case has to
// load it afresh with its own CONFIG rather than flipping a value afterwards.
const loadRoutes = async (matchingActive) => {
  vi.resetModules()
  vi.doMock('@/config', () => ({
    default: { MATCHING_ACTIVE: matchingActive },
  }))
  const module = await import('./routes')
  return module.default
}

const pathsOf = (routes) => routes.map((route) => route.path)
const matchingPathsOf = (routes) => pathsOf(routes).filter((path) => path.startsWith('/matching'))

afterEach(() => {
  vi.doUnmock('@/config')
  vi.resetModules()
})

describe('routes', () => {
  describe('with MATCHING_ACTIVE on', () => {
    it('registers all three matching routes', async () => {
      expect(matchingPathsOf(await loadRoutes(true))).toEqual([
        '/matching',
        '/matching/karte',
        '/matching/:tab',
      ])
    })

    it('keeps the map ahead of the tab route, or the tab route swallows it', async () => {
      const paths = matchingPathsOf(await loadRoutes(true))
      expect(paths.indexOf('/matching/karte')).toBeLessThan(paths.indexOf('/matching/:tab'))
    })

    it('sends /matching on to the entries tab', async () => {
      const routes = await loadRoutes(true)
      const entry = routes.find((route) => route.path === '/matching')
      expect(entry.redirect()).toEqual({ path: '/matching/entries' })
    })
  })

  describe('with MATCHING_ACTIVE off', () => {
    it('registers no matching route at all', async () => {
      expect(matchingPathsOf(await loadRoutes(false))).toEqual([])
    })

    it('leaves the catch-all in place, so /matching lands on not found', async () => {
      // Hiding the menu item alone would leave the pages reachable by typing the
      // address. Unregistered, they fall through to this route instead.
      const routes = await loadRoutes(false)
      const catchAll = routes.find((route) => route.name === 'NotFound')
      expect(catchAll).toBeDefined()
      expect(catchAll.path).toBe('/:catchAll(.*)')
    })

    it('touches nothing else — the other routes are unchanged', async () => {
      const withMatching = pathsOf(await loadRoutes(true)).filter(
        (path) => !path.startsWith('/matching'),
      )
      const withoutMatching = pathsOf(await loadRoutes(false))
      expect(withoutMatching).toEqual(withMatching)
    })
  })
})
