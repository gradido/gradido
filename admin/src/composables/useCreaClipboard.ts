// AI-GENERATED — not an architecture reference
import { ref } from 'vue'

// Crea's latest reply draft is held in the browser so a moderator can paste it into
// a contribution's reply field without going through the OS clipboard (that stays
// reserved for pasting into other apps — mail, the moderator group). Like the
// signature (E-014), it lives only on the device and keeps just the most recent
// proposal, clipboard-style.
const STORAGE_KEY = 'crea.lastResponse'
// The model that wrote the draft, kept beside it: the reply field sends it along with the
// message the draft went into, so the thread records whose words these were.
const MODEL_STORAGE_KEY = 'crea.lastResponseModel'

const load = (key: string) => {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

// Module-level so the modal (writer) and the reply field (reader) share one value
// within a page load; localStorage backs it across reloads.
const lastResponse = ref(load(STORAGE_KEY))
const lastResponseModel = ref(load(MODEL_STORAGE_KEY))

export function useCreaClipboard() {
  const setLastResponse = (value: string, model = '') => {
    lastResponse.value = value
    lastResponseModel.value = model
    try {
      localStorage.setItem(STORAGE_KEY, value)
      localStorage.setItem(MODEL_STORAGE_KEY, model)
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }
  return { lastResponse, lastResponseModel, setLastResponse }
}
