import { useRoute } from 'vue-router'

export function useAuthLinks() {
  const route = useRoute()

  /**
   * The guarantor code (E-017) names the member who showed it by itself; the registration page
   * still shows their name above the form, and takes it from `referrer`. So wherever the code
   * travels on from an address page -- the page's own button, the navigation bar, the detour
   * over the sign-in -- the name travels with it. Without a guarantor code nothing changes.
   */
  const guarantorCodeReferrer = () =>
    route.query.guarantor && route.params.alias ? { referrer: route.params.alias } : {}

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
      query: { ...guarantorCodeReferrer(), ...route.query, ...options.query },
    }
  }

  return { routeWithParamsAndQuery }
}
