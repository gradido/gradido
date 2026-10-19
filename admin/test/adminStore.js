// AI-GENERATED — not an architecture reference
import { createPinia } from 'pinia'
import { useAdminStore } from '../src/store/useAdminStore'

/**
 * A Pinia of its own whose admin store holds `state`, for a spec to install as a plugin.
 *
 * The store is the real one without what store.js hangs on the app's instance: nothing is read
 * from localStorage or saved there, and no other window is followed. `useAdminStore(pinia)`
 * hands a spec the store itself.
 */
export const adminStore = (state = {}) => {
  const pinia = createPinia()
  useAdminStore(pinia).$patch(state)
  return pinia
}
