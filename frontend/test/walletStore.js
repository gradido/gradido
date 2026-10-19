// AI-GENERATED — not an architecture reference
import { createPinia } from 'pinia'
import { useWalletStore } from '../src/store/useWalletStore'

/**
 * A Pinia of its own whose wallet store holds `state`, for a spec to install as a plugin.
 *
 * The store is the real one without what store.js hangs on the app's instance: nothing is read
 * from localStorage or saved there, and no other window is followed. `useWalletStore(pinia)`
 * hands a spec the store itself.
 */
export const walletStore = (state = {}) => {
  const pinia = createPinia()
  useWalletStore(pinia).$patch(state)
  return pinia
}
