import { ref } from 'vue'

// Crea's latest memo supplement — the short public note for a confirmed contribution
// (E-019, "Text ergänzen") — is held in the browser so the "Text ergänzen" button can
// append it to the contribution memo with one click. Twin of useCreaClipboard (which
// holds the reply draft): device-local, keeps only the most recent note, bridges the
// modal (writer) and the reply form (reader) within a page load.
const STORAGE_KEY = 'crea.lastSupplement'

const load = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

// Module-level so the modal and the form share one value; localStorage backs it across reloads.
const lastSupplement = ref(load())

export function useCreaSupplement() {
  const setLastSupplement = (value) => {
    lastSupplement.value = value
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }
  return { lastSupplement, setLastSupplement }
}
