import { useRoute } from 'vue-router'

export function useAuthLinks() {
  const route = useRoute()

  /**
   * The table code (E-017) is sealed for the user name in the address it came with, and the
   * registration checks it against `referrer`. So wherever it travels on from an address page --
   * the page's own button, the navigation bar, the detour over the sign-in -- the name travels
   * with it; without it the registration would drop the code without a word. Without a table
   * code nothing changes.
   */
  const tableCodeReferrer = () =>
    route.query.presence && route.params.alias ? { referrer: route.params.alias } : {}

  /**
   * Combine current route params and query with given params and query
   * @param {string} name
   * @param {{ params: {}, query: {} }} options
   * @returns {{ name: string, params: {}, query: {} }} a vue3 routing object for :to
   */
  const routeWithParamsAndQuery = (name, options = { params: {}, query: {} }) => {
    return {
      name,
      params: { ...route.params, ...options.params },
      query: { ...tableCodeReferrer(), ...route.query, ...options.query },
    }
  }

  return { routeWithParamsAndQuery }
}
