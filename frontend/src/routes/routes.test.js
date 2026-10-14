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
// Everything the flag switches on: the matching pages, and the page that builds the links
// which end in a matching entry.
const hangsOnMatching = (path) =>
  path.startsWith('/matching') || path === '/event-matching' || path === '/event'

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
   * ⭐ The find map opens only with a position AND findability, and the guard that enforces
   * it reads this flag rather than comparing the address. Two halves, measured in two
   * places: that the flag is on the right record is here, that the guard acts on it is in
   * guards.test.js. A guard keyed on the path string would be blind to `/matching/karte/`
   * and `/Matching/Karte`, both of which open this very record.
   */
  it('marks the map, and only the map, as needing both answers', async () => {
    const routes = await loadRoutes(true)
    const gated = routes.filter((route) => route.meta?.requiresFindable).map((route) => route.path)

    expect(gated).toEqual(['/matching/karte'])
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
   * ⛔ `refreshBalance` arms the layout's route watch, so a route that carries it fetches
   * the balance and the newest bookings again on every navigation into it -- and /send is
   * navigated into by the contacts column itself, once per tapped contact. The column is
   * fed from the layout's mount-time query either way.
   */
  it('refreshes the balance only where a member comes to check where they stand', async () => {
    const routes = await loadRoutes(true)

    const asking = routes.filter((route) => route.meta?.refreshBalance).map((route) => route.path)

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

    // Event matching, the host's page. Without `requiresAuth`, which is what makes it public
    // AND what puts it into the layout whose footer links to it.
    it('registers the page that builds event links, for everybody', async () => {
      const routes = await loadRoutes(true)
      const builder = routes.filter((route) => route.path === '/event-matching')
      expect(builder).toHaveLength(1)
      expect(builder[0].meta?.requiresAuth).not.toBe(true)
    })

    it('keeps that page ahead of the catch-all, or it would never be reached', async () => {
      const paths = pathsOf(await loadRoutes(true))
      expect(paths.indexOf('/event-matching')).toBeGreaterThan(-1)
      expect(paths.indexOf('/event-matching')).toBeLessThan(paths.indexOf('/:catchAll(.*)'))
    })
  })

  describe('with MATCHING_ACTIVE off', () => {
    it('registers no matching route at all', async () => {
      expect(matchingPathsOf(await loadRoutes(false))).toEqual([])
    })

    // An instance without matching has no entries for such a link to end in. The page would
    // build links that lead nowhere, so it is not there either.
    it('does not register the page that builds event links', async () => {
      expect(pathsOf(await loadRoutes(false))).not.toContain('/event-matching')
    })

    it('leaves the catch-all in place, so /matching lands on not found', async () => {
      // Hiding the menu item alone would leave the pages reachable by typing the
      // address. Unregistered, they fall through to this route instead.
      const routes = await loadRoutes(false)
      const catchAll = routes.find((route) => route.name === 'NotFound')
      expect(catchAll).toBeDefined()
      expect(catchAll.path).toBe('/:catchAll(.*)')
    })

    // The event link leads into the matching, so it goes with it (below); nothing else does.
    it('touches nothing else — the other routes are unchanged', async () => {
      const withMatching = pathsOf(await loadRoutes(true)).filter((path) => !hangsOnMatching(path))
      const withoutMatching = pathsOf(await loadRoutes(false))
      expect(withoutMatching).toEqual(withMatching)
    })
  })

  /**
   * The entrance of an event link, `/event?interest=…` (Event-Matching). It offers an entry
   * for the matching and the map on which the people of an event find each other -- so it
   * exists where the matching does, and nowhere else.
   */
  describe('the entrance of an event link', () => {
    const entranceOf = (routes) => routes.find((route) => route.path === '/event')

    it('is registered with the matching, under the name its guard reads', async () => {
      const entrance = entranceOf(await loadRoutes(true))

      expect(entrance).toBeDefined()
      expect(entrance.name).toBe('EventMatchingLanding')
    })

    // Whoever opens the link is mostly not signed in, and App.vue picks the layout from this
    // one field.
    it('asks for no sign-in', async () => {
      const entrance = entranceOf(await loadRoutes(true))

      expect(entrance.meta?.requiresAuth).not.toBe(true)
    })

    it('stands ahead of the catch-all, which would swallow it', async () => {
      const paths = pathsOf(await loadRoutes(true))

      expect(paths.indexOf('/event')).toBeGreaterThan(-1)
      expect(paths.indexOf('/event')).toBeLessThan(paths.indexOf('/:catchAll(.*)'))
    })

    // The query of this address is what the link offers, in somebody else's words. The links
    // of the bar above the page hand a page's query on to the next (useAuthLinks) -- from
    // here they must not, and this is the switch they read.
    it('says that its query stays behind', async () => {
      const entrance = entranceOf(await loadRoutes(true))

      expect(entrance.meta).toEqual({ queryStaysBehind: true })
    })

    // The only page that says so: every other one hands its query on as before.
    it('is the only route whose query stays behind', async () => {
      const staying = (await loadRoutes(true)).filter((route) => route.meta?.queryStaysBehind)

      expect(staying.map((route) => route.path)).toEqual(['/event'])
    })

    // Without the matching the link lands on "not found", instead of promising a map this
    // community does not have.
    it('is not registered without the matching', async () => {
      expect(entranceOf(await loadRoutes(false))).toBeUndefined()
    })
  })
})
