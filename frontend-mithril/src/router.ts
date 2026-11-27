// AI-GENERATED — not an architecture reference
import m from 'mithril'
import { smartRedirect } from '@/data/Guard.logic'
import { authToken, logout, session, sessionRuns } from '@/store/Session'

export type Route =
  | {
      page: m.ComponentTypes
      /** For members only: anybody else is led to the sign-in, and comes back after it. */
      requiresAuth?: true
    }
  | {
      /** An address that is only a way on: it leads elsewhere, and has no page. */
      leadsOn: () => Promise<void>
      requiresAuth?: never
    }

// the pages opened since the wallet started: before the first, a navigation is its start
let opened = 0

/** Whether a page of the wallet was opened before the one shown: there is one to go back to. */
export function openedBefore() {
  // shortcut: counts a page come back to as well, so back from there may leave the wallet;
  // exact once the browsers members use have `navigation.canGoBack`
  return opened > 1
}

/**
 * The rows as Mithril takes them: each asks the guard (data/Guard.logic.ts) before its page,
 * and draws the page inside `frame` (components/layout/App.ts), which stays from page to page.
 */
export function routeResolvers(
  routes: Record<string, Route>,
  frame: m.ComponentTypes<{ requiresAuth: boolean }>,
): Record<string, m.RouteResolver> {
  return Object.fromEntries(
    Object.entries(routes).map(([pattern, route]) => [
      pattern,
      {
        onmatch(params, asked) {
          const runs = sessionRuns()
          const address = asked.split('#')[0]
          const queryAt = `${address}?`.indexOf('?')
          const instead = smartRedirect(
            {
              path: address.slice(0, queryAt),
              query: address.slice(queryAt),
              requiresAuth: route.requiresAuth === true,
              isStart: opened === 0,
              forProject: 'project' in params,
            },
            { sessionRuns: runs, creationAllowed: session.state.member?.creationAllowed ?? null },
          )
          if (instead === null) {
            // a way that leads on opens no page of its own: back from the next leads past it
            if ('leadsOn' in route) {
              return route.leadsOn()
            }
            opened++
            return route.page
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
        // Where the way led elsewhere there is no page, and Mithril draws a bare `div` in
        // its place: nothing is drawn then, not an empty frame before the page led to.
        render: (page) =>
          page.tag === 'div' ? null : m(frame, { requiresAuth: route.requiresAuth === true }, page),
      } satisfies m.RouteResolver,
    ]),
  )
}
