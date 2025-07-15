import { useRoute } from 'vue-router'

export function useAuthLinks() {
  const route = useRoute()
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
      query: { ...route.query, ...options.query },
    }
  }

  return { routeWithParamsAndQuery }
}
