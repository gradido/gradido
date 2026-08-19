// AI-GENERATED — not an architecture reference

import { ref, watch } from 'vue'
import { useStore } from 'vuex'

/**
 * What the calculator remembers, and why it remembers it on the DEVICE.
 *
 * The Gradido share, the purchasing-power factor and the currency abbreviation belong to
 * whoever takes payments -- a cafe, a market stall -- and they are the same at that counter
 * every day. That is exactly what a device can remember without anybody being asked to set
 * something up, and it is the same reasoning the card payment already applies to its
 * reference (see `useThankYouCardMemo`). Hanging them on the account would mean a settings
 * page and a table for a convenience.
 *
 * ⛔ Not in the vuex store, which is written to localStorage on EVERY mutation. These
 * change while somebody types in a panel.
 *
 * ⚠️ Same trade as the memo: this protects against being carried over to the NEXT person on
 * a shared device, not against being read by somebody who knows where to look. For a
 * percentage that is no secret worth guarding.
 */

const KEY_PREFIX = 'calculator-prefs:'

const DEFAULTS = {
  percent: 100,
  factor: 1,
  currency: '€',
  showDankBar: true,
  sound: true,
}

export const useCalculatorPrefs = () => {
  const store = useStore()

  const percent = ref(DEFAULTS.percent)
  const factor = ref(DEFAULTS.factor)
  const currency = ref(DEFAULTS.currency)
  const showDankBar = ref(DEFAULTS.showDankBar)
  const sound = ref(DEFAULTS.sound)

  /**
   * No ID, no key, and therefore nothing remembered. A shared fallback key would be worse
   * than forgetting: `gradidoID` is null before the login answer arrives and again after
   * logging out, and one shared key would hand one till's settings to the next person on the
   * same device.
   */
  const storageKey = () => {
    const { gradidoID } = store.state
    return gradidoID ? `${KEY_PREFIX}${gradidoID}` : null
  }

  const load = () => {
    const key = storageKey()
    if (!key) {
      return
    }
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) {
        return
      }
      const stored = JSON.parse(raw)
      if (!stored || typeof stored !== 'object') {
        return
      }
      // Each value is checked on its own. A file with one unusable entry keeps the rest --
      // an all-or-nothing read would throw away four good settings for one bad one.
      if (Number.isFinite(stored.percent) && stored.percent >= 0 && stored.percent <= 100) {
        percent.value = stored.percent
      }
      if (Number.isFinite(stored.factor) && stored.factor > 0) {
        factor.value = stored.factor
      }
      if (typeof stored.currency === 'string' && stored.currency !== '') {
        currency.value = stored.currency
      }
      if (typeof stored.showDankBar === 'boolean') {
        showDankBar.value = stored.showDankBar
      }
      if (typeof stored.sound === 'boolean') {
        sound.value = stored.sound
      }
    } catch {
      // Storage switched off, or a file somebody else wrote. Defaults are a far smaller loss
      // than a calculator that fails to open.
    }
  }

  const save = () => {
    const key = storageKey()
    if (!key) {
      return
    }
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          percent: percent.value,
          factor: factor.value,
          currency: currency.value,
          showDankBar: showDankBar.value,
          sound: sound.value,
        }),
      )
    } catch {
      // as above: not being able to remember is no reason to fail
    }
  }

  load()
  watch([percent, factor, currency, showDankBar, sound], save)

  return { percent, factor, currency, showDankBar, sound }
}
