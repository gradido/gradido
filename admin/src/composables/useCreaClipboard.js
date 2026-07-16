import { ref } from 'vue'

// Crea's latest reply draft is held in the browser so a moderator can paste it into
// a contribution's reply field without going through the OS clipboard (that stays
// reserved for pasting into other apps — mail, the moderator group). Like the
// signature (E-014), it lives only on the device and keeps just the most recent
// proposal, clipboard-style.
const STORAGE_KEY = 'crea.lastResponse'

const load = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

// Module-level so the modal (writer) and the reply field (reader) share one value
// within a page load; localStorage backs it across reloads.
const lastResponse = ref(load())

export function useCreaClipboard() {
  const setLastResponse = (value) => {
    lastResponse.value = value
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }
  return { lastResponse, setLastResponse }
}
