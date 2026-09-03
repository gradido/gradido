// AI-GENERATED — not an architecture reference

import { ref, watch } from 'vue'

/**
 * The contact window's state, for a list that opens one (KF-010).
 *
 * ⛔ One copy, because there are three lists and there will be a fourth. The column, the
 * phone strip and the contacts page each held their own `windowOpen` / `selected` / `open`
 * / release-on-close, byte for byte, and each carried its own comment explaining the
 * non-obvious half -- so the rule was documented three times and enforced nowhere.
 *
 * ⛔ The contact is let go when the window closes. The window is `lazy`, so a closed one
 * renders nothing, but holding the contact would keep a portrait and a person alive for the
 * life of the page -- and a person who may no longer be in the list at all after a search
 * or a refresh.
 */
export const useContactWindow = () => {
  const windowOpen = ref(false)
  const selected = ref(null)

  const open = (contact) => {
    selected.value = contact
    windowOpen.value = true
  }

  watch(windowOpen, (isOpen) => {
    if (!isOpen) {
      selected.value = null
    }
  })

  return { windowOpen, selected, open }
}
