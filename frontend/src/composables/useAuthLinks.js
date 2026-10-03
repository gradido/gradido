import { useRoute, useRouter } from 'vue-router'

export function useAuthLinks() {
  const route = useRoute()
  const router = useRouter()

  /**
   * The names of the params the target route declares in its path. vue-router does not expose
   * them on a route record, so they are read from the path: `/checkEmail/:optin/:code?` gives
   * `optin` and `code`. A route nobody registered declares none.
   * @param {string} routeName
   * @returns {Set<string>}
   */
  function paramNamesOfRoute(routeName) {
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
   * @param {string} name
   * @param {{ params: {}, query: {} }} options
   * @returns {{ name: string, params: {}, query: {} }} a vue3 routing object for :to
   */
  const routeWithParamsAndQuery = (name, options = { params: {}, query: {} }) => {
    const params = { ...route.params, ...options.params }
    const expectedParams = paramNamesOfRoute(name)
    return {
      name,
      params: Object.fromEntries(Object.entries(params).filter(([key]) => expectedParams.has(key))),
      query: { ...route.query, ...options.query },
    }
  }

  return { routeWithParamsAndQuery }
}
