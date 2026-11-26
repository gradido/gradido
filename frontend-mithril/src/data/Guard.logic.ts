// AI-GENERATED — not an architecture reference

/** What the guard asks of the navigation it decides on. */
export type Navigation = {
  /** The address asked for, without query and hash. */
  path: string
  /** Its query, with the question mark; empty where it has none. */
  query: string
  /** The page is for members only. */
  requiresAuth: boolean
  /** The wallet starts here: a new start, a reload, an address from outside. */
  isStart: boolean
  /** The sign-in is for a project (`?project=`), which the member is handed over to. */
  forProject: boolean
}

/** What the guard asks of the session. */
export type Visitor = {
  sessionRuns: boolean
  /** false for a project account; null where it is not known, which reads as yes. */
  creationAllowed: boolean | null
}

/**
 * Where a navigation goes instead of the page asked for; null where that page may open. The
 * steps of the old wallet's guards, in their order.
 */
export function whereTo(to: Navigation, visitor: Visitor): string | null {
  // the wallet has no page of its own at its root
  if (to.path === '/') {
    return '/login'
  }
  // A wallet that starts while its session runs does not ask for the sign-in again: an iPhone
  // starts it over whenever it wants the memory. Only at a start -- a way to the form from
  // inside the wallet keeps it, so signing in over an open session stays possible.
  if (to.isStart && visitor.sessionRuns && !to.forProject) {
    // with the code of a link, on to that link, as the sign-in itself goes on
    const code = to.path.match(/^\/login\/([^/]+)$/)?.[1]
    if (code) {
      return `/redeem/${code}${to.query}`
    }
    if (to.path === '/login') {
      return '/overview'
    }
  }
  if (to.requiresAuth && !visitor.sessionRuns) {
    return '/login'
  }
  // A project account does not create. `=== false`: not known is what every account was before.
  if (to.path.startsWith('/contributions') && visitor.creationAllowed === false) {
    return '/overview'
  }
  return null
}
