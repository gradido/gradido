import { computed } from 'vue'
import { useStore } from 'vuex'

// Whether the signed-in moderator is an administrator. Used to hide what they may not do —
// the backend rights and the `requiresAdmin` route guard are the actual boundary, this only
// keeps the interface from offering buttons that would come back with a 401.
export const useIsAdmin = () => {
  const store = useStore()
  return computed(() => store.state.moderator?.roles?.includes('ADMIN') ?? false)
}
