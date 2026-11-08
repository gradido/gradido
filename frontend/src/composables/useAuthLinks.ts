import { type LocationQueryRaw, type RouteParamsRaw, useRoute, useRouter } from 'vue-router'

/** What a caller adds to the current route's own params and query. */
export type AuthLinkOptions = { params?: RouteParamsRaw; query?: LocationQueryRaw }

/** A vue3 routing object for `:to`. */
export type AuthLink = { name: string; params: RouteParamsRaw; query: LocationQueryRaw }

export function useAuthLinks() {
  const route = useRoute()
  const router = useRouter()

  /**
   * The names of the params the target route declares in its path. vue-router does not expose
   * them on a route record, so they are read from the path: `/checkEmail/:optin/:code?` gives
   * `optin` and `code`. A route nobody registered declares none.
   */
  function paramNamesOfRoute(routeName: string): Set<string> {
    const path = router.getRoutes().find((record) => record.name === routeName)?.path ?? ''
    return new Set([...path.matchAll(/:(\w+)/g)].map(([, paramName]) => paramName))
  }

  /**
   * Combine current route params and query with given params and query. Only the params the
   * target route declares go along: the redeem `code` travels from `/checkEmail/:optin/:code?`
   * to `/login/:code?`, while `optin` stays behind instead of being discarded by vue-router
   * with a warning.
   *
   * Params are picked by their NAME only, from the entries the params object itself has: a
   * value that happens to read like another param's name (`optin: 'code'`) is still only a
   * value and does not travel.
   *
   * The query of a page that says `queryStaysBehind` (its route's meta) does not go along: on
   * the entrance of an event link the query is what the link offers -- somebody else's words,
   * and nothing the registration or the sign-in is to read (routes.js). What the caller hands
   * in as `options.query` still does.
   */
  const routeWithParamsAndQuery = (name: string, options: AuthLinkOptions = {}): AuthLink => {
    const params = { ...route.params, ...options.params }
    const expectedParams = paramNamesOfRoute(name)
    return {
      name,
      params: Object.fromEntries(Object.entries(params).filter(([key]) => expectedParams.has(key))),
      query: { ...(route.meta?.queryStaysBehind ? {} : route.query), ...options.query },
    }
  }

  return { routeWithParamsAndQuery }
}
