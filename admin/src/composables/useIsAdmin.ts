// AI-GENERATED — not an architecture reference
import { computed } from 'vue'
import { useAdminStore } from '@/store/useAdminStore'

// Whether the signed-in moderator is an administrator. Used to hide what they may not do —
// the backend rights and the `requiresAdmin` route guard are the actual boundary, this only
// keeps the interface from offering buttons that would come back with a 401.
export const useIsAdmin = () => {
  const store = useAdminStore()
  return computed(() => store.moderator?.role === 'ADMIN')
}
