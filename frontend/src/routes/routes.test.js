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
  // What the layout can put in the column, plus the one entry that is not a panel at all:
  // `bookings-or-contacts` is a QUESTION -- which of the two shall stand here? -- and the
  // layout answers it from the route's default and the member's remembered choice (KF-009).
  const PANELS = ['contributions', 'matching', 'bookings-or-contacts']
  const SWITCHABLE = 'bookings-or-contacts'
  const POSITIONS = ['bookings', 'contacts']

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

  /**
   * The column stands beside these three and nowhere else. A member showing somebody their
   * QR code was showing their last bookings with it -- that is why the card, cheque and
   * scanner pages carry no column, and the list is held here so a new route cannot quietly
   * join them.
   */
  it('gives the switchable column to the three routes that asked for it', async () => {
    const routes = await loadRoutes(true)

    const switchable = routes
      .filter((route) => route.meta?.rightSide === SWITCHABLE)
      .map((route) => route.path)

    expect(switchable).toEqual([
      '/overview',
      '/send/:communityIdentifier?/:userIdentifier?',
      '/transactions',
    ])
  })

  /**
   * ⛔ A default the layout can act on. An unknown word here would leave the column standing
   * on whatever the fallback happens to be, which is a silent wrong answer rather than a
   * failure -- and the factory settings themselves are the decision (KF-009): the overview
   * opens on bookings, the other two on contacts.
   */
  it('gives every switchable route a position it can start on', async () => {
    const routes = await loadRoutes(true)
    const byPath = Object.fromEntries(routes.map((route) => [route.path, route]))

    for (const route of routes.filter((r) => r.meta?.rightSide === SWITCHABLE)) {
      expect(POSITIONS).toContain(route.meta.rightSideDefault)
    }

    expect(byPath['/overview'].meta.rightSideDefault).toBe('bookings')
    expect(byPath['/transactions'].meta.rightSideDefault).toBe('contacts')
    expect(byPath['/send/:communityIdentifier?/:userIdentifier?'].meta.rightSideDefault).toBe(
      'contacts',
    )
  })

  /**
   * ⛔ `transactionsPageSize` says what the PAGE needs, never what the column needs. It arms
   * the layout's route watch, so a route that carries it refetches the bookings on every
   * navigation into it -- and /send is navigated into by the contacts column itself, once
   * per tapped contact. The column is fed from the layout's mount-time query either way.
   */
  it('asks for bookings only where the page itself shows them', async () => {
    const routes = await loadRoutes(true)

    const asking = routes
      .filter((route) => route.meta?.transactionsPageSize !== undefined)
      .map((route) => route.path)

    expect(asking).toEqual(['/overview', '/transactions'])
  })

  /**
   * ⛔ The raw panel name is not a route's to declare any more -- the booking list is one
   * POSITION of the switchable column, reachable only through the switch. Held because the
   * guard it replaces ("only /overview may say 'transactions'") was written after a code
   * page held out to another person showed that member's last bookings beside it.
   */
  it('lets no route name the booking panel directly', async () => {
    const routes = await loadRoutes(true)

    const direct = routes
      .filter((route) => route.meta?.rightSide === 'transactions')
      .map((route) => route.path)

    expect(direct).toEqual([])
  })

  /**
   * The phone carries the contacts strip over the send form and nowhere else (BAU-11): over
   * the overview or the booking list a shortcut into a field that is not there is a shortcut
   * to nowhere.
   */
  it('gives the phone the column on the send form alone', async () => {
    const routes = await loadRoutes(true)

    const onThePhone = routes
      .filter((route) => route.meta?.rightSideMobile)
      .map((route) => [route.path, route.meta.rightSideMobile])

    // ⛔ It NAMES the panel rather than merely allowing one. The switch lives in the desktop
    // column, so a phone panel derived from its answer could be taken away by a choice made
    // on a wide screen -- with no control below 992px to bring it back.
    expect(onThePhone).toEqual([['/send/:communityIdentifier?/:userIdentifier?', 'contacts']])
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
