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

/**
 * ⛔ The right-hand column is declared per route now, not looked up by path segment. These
 * hold the two properties that made the move worth doing.
 */
describe('the right-hand column is a property of the route', () => {
  const PANELS = ['transactions', 'contributions', 'matching']

  it('names only panels the layout can render', async () => {
    const routes = await loadRoutes(true)

    const named = routes.map((route) => route.meta?.rightSide).filter((panel) => panel != null)

    expect(named.length).toBeGreaterThan(0)
    for (const panel of named) {
      expect(PANELS).toContain(panel)
    }
  })

  /**
   * ⛔ The reason this is on the record and not in a table. `/matching/karte` and
   * `/matching/:tab` are one section and need two answers: the map declares `bareChrome`
   * because it wants the whole canvas, and until 27.08.2026 it still paid a quarter of every
   * desktop screen to the matching panel, because a section-keyed lookup could not tell the
   * two apart.
   */
  it('lets the map say no where its neighbour says yes', async () => {
    const routes = await loadRoutes(true)
    const byPath = Object.fromEntries(routes.map((route) => [route.path, route]))

    expect(byPath['/matching/karte'].meta.bareChrome).toBe(true)
    expect(byPath['/matching/karte'].meta.rightSide).toBeNull()
    expect(byPath['/matching/:tab'].meta.rightSide).toBe('matching')
  })

  /**
   * A page that brings its own head wants the screen. That is what `bareChrome` says, so a
   * route saying both is contradicting itself -- and the one that did is exactly the defect
   * above. Held over the whole table so the next `bareChrome` route cannot repeat it.
   */
  it('gives no panel to a page that brings its own head', async () => {
    const routes = await loadRoutes(true)

    const contradictory = routes
      .filter((route) => route.meta?.bareChrome && route.meta?.rightSide)
      .map((route) => route.path)

    expect(contradictory).toEqual([])
  })

  // The booking list stands beside the overview and nowhere else: a member showing somebody
  // their QR code was showing their last bookings with it.
  it('gives the booking list to the overview alone', async () => {
    const routes = await loadRoutes(true)

    const withList = routes
      .filter((route) => route.meta?.rightSide === 'transactions')
      .map((route) => route.path)

    expect(withList).toEqual(['/overview'])
  })
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
