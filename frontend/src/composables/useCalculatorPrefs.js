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

  /**
   * ⚠️ Reading once at setup is not enough, and the reason is a gap in time rather than a
   * mistake: the route guard lets anybody with a `token` through, while `gradidoID` arrives
   * with the login answer. Opening the calculator inside that gap would read nothing -- and
   * then the FIRST change would write defaults over settings the till had had for weeks.
   *
   * ⛔ Reset before loading, or a member who has stored nothing would inherit the values of
   * the one before them on a shared device.
   *
   * `restoring` holds the save watcher off while this runs; without it, resetting would
   * write defaults under the new key before the stored ones have even been read.
   *
   * ⛔ That is why the save watcher below is `flush: 'sync'`, and it is not a preference.
   * A watcher on Vue's default flush runs AFTER `restore` has finished and set the flag back
   * to false, so it would see `restoring === false` every time and the guard would do
   * nothing at all -- measured, not assumed. Today that is harmless because `save` resolves
   * the key itself, but the protection this comment describes would not exist.
   */
  let restoring = false
  const restore = () => {
    restoring = true
    percent.value = DEFAULTS.percent
    factor.value = DEFAULTS.factor
    currency.value = DEFAULTS.currency
    showDankBar.value = DEFAULTS.showDankBar
    sound.value = DEFAULTS.sound
    load()
    restoring = false
  }

  restore()
  watch(
    () => store.state.gradidoID,
    () => restore(),
  )
  watch(
    [percent, factor, currency, showDankBar, sound],
    () => {
      if (!restoring) {
        save()
      }
    },
    { flush: 'sync' },
  )

  return { percent, factor, currency, showDankBar, sound }
}
