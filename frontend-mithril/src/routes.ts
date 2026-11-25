import CONFIG from '@frontend/config'
import m from 'mithril'
import { whereTo } from '@/data/Guard.logic'
import { authToken, logout, session, sessionRuns } from '@/store/Session'

export type Route = {
  /** The page, fetched when its address is opened: every page is a chunk of its own. */
  page: () => Promise<m.ComponentTypes>
  /** For members only: anybody else is led to the sign-in, and comes back after it. */
  requiresAuth?: true
}

/**
 * Every address of the wallet. `:name` takes one part of an address, `:name...` the rest of
 * it; Mithril knows no part that may be missing, so such an address has two rows.
 */
export const ROUTES: Record<string, Route> = {
  // No page is ported yet (todo.md): every address answers with the build it is.
  '/:path...': {
    page: async () => ({ view: () => m('main', `Gradido ${CONFIG.APP_VERSION} (Mithril)`) }),
  },
}

// until the first page has opened: what comes before it is still the wallet's start
let started = false

/** The rows as Mithril takes them: each asks the guard (data/Guard.logic.ts) before its page. */
export function routeResolvers(routes: Record<string, Route>): Record<string, m.RouteResolver> {
  return Object.fromEntries(
    Object.entries(routes).map(([pattern, route]) => [
      pattern,
      {
        onmatch(params, asked) {
          const runs = sessionRuns()
          const instead = whereTo(
            {
              path: asked.split(/[?#]/)[0],
              requiresAuth: route.requiresAuth === true,
              isStart: !started,
              forProject: 'project' in params,
            },
            { sessionRuns: runs, creationAllowed: session.state.member?.creationAllowed ?? null },
          )
          if (instead === null) {
            started = true
            return route.page()
          }
          if (route.requiresAuth && !runs) {
            // A sign-in that ran out is no sign-in. Put away first: the sign-out puts the
            // overview back as the page to go on to.
            if (authToken.state) {
              logout()
            }
            // with query and hash: a link out of a mail is made of them
            session.set({ ...session.state, redirectPath: asked })
          }
          m.route.set(instead, null, { replace: true })
        },
      } satisfies m.RouteResolver,
    ]),
  )
}
