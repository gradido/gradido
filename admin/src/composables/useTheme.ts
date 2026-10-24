// AI-GENERATED — not an architecture reference
import { onBeforeUnmount, ref } from 'vue'

/**
 * The admin's light or dark: whatever the wallet is set to on this device (AO-011).
 *
 * The wallet keeps its setting in localStorage under its own key, and the admin shares its
 * origin, so it reads the same key -- one setting per device, not one per application. Both write
 * it: the wallet's settings page (frontend/src/store/useWalletStore.js, `applyTheme`) and the
 * switch in the admin's account menu (`writeThemeMode` below, AO-012). The wallet takes what the
 * key holds when it starts (`adoptThemeModeFromDevice`); this one follows it live.
 *
 * The mark is Bootstrap's own, `data-bs-theme="dark"`, on `<html>`: its dark variables follow it,
 * `color-scheme` reaches the root with it (an opened `<select>` follows the root, not what it
 * inherits), and the windows and menus bootstrap-vue-next hangs on `<body>` sit below it. The
 * first paint gets it from the script in index.html; this follows every change after that.
 *
 * ⚠️ A change in ANOTHER tab arrives as a `storage` event. A write in this tab does not (the
 * event never fires in the tab that wrote), so whoever writes the key here has to call
 * `applyTheme()` itself.
 */
export const THEME_MODE_STORAGE_KEY = 'gradido-theme-mode'

export type ThemeMode = 'system' | 'light' | 'dark'

const MODES: readonly string[] = ['system', 'light', 'dark']

const SYSTEM_DARK = '(prefers-color-scheme: dark)'

/** The mode the wallet keeps on this device. Missing or unknown is `system`, as in the wallet. */
export const readThemeMode = (): ThemeMode => {
  try {
    const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY)
    return stored !== null && MODES.includes(stored) ? (stored as ThemeMode) : 'system'
  } catch {
    // No window, or storage that refuses to be read (a private window): the system decides.
    return 'system'
  }
}

/** The system's own preference; without a way to ask, light. */
const systemIsDark = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(SYSTEM_DARK).matches

export const isDark = (mode: ThemeMode): boolean =>
  mode === 'dark' || (mode === 'system' && systemIsDark())

/**
 * The mode the admin shows, as of the last apply: what the switch in the account menu marks. Set
 * by every apply, so the mark follows a change from the wallet's tab as well.
 */
export const themeMode = ref<ThemeMode>('system')

/**
 * Marks the document dark, or takes the mark away: from the mode as it is stored now, or from the
 * mode just chosen in this tab.
 */
export const applyTheme = (mode: ThemeMode = readThemeMode()): void => {
  themeMode.value = mode
  if (typeof document === 'undefined') {
    return
  }
  const root = document.documentElement
  if (isDark(mode)) {
    root.setAttribute('data-bs-theme', 'dark')
  } else {
    root.removeAttribute('data-bs-theme')
  }
}

/**
 * The switch in the account menu: keeps the mode for this device, where the wallet keeps it, and
 * applies it at once -- the `storage` event never reaches the tab that wrote. A storage that
 * refuses the write leaves the key as it was; the mode chosen holds for this page all the same
 * (and through a change of the system's preference, `useTheme`), as it does in the wallet, which
 * applies the mode it holds in memory.
 */
export const writeThemeMode = (mode: ThemeMode): void => {
  if (!MODES.includes(mode)) {
    return
  }
  try {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode)
  } catch {
    // A private window, or storage that is full: not kept, but applied below.
  }
  applyTheme(mode)
}

/**
 * Applies the mode once and follows it while the app stands: a change of the key in another tab
 * (the wallet's switch), and a change of the system's preference while the mode is `system`.
 */
export const useTheme = (): void => {
  if (typeof window === 'undefined') {
    return
  }
  applyTheme()

  // `key` is null when another tab cleared the whole storage: the key may be gone with it.
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_MODE_STORAGE_KEY || event.key === null) {
      applyTheme()
    }
  }
  window.addEventListener('storage', onStorage)

  // ⛔ Both spellings, checked on the METHOD (as composables/useViewport.ts does): Safari and iOS
  // before 14 have only the deprecated `addListener`, and an unguarded call would throw in the
  // setup of the app -- the whole admin would stay blank. Where neither exists the system's
  // preference is read at every apply and simply not followed live.
  const media = typeof window.matchMedia === 'function' ? window.matchMedia(SYSTEM_DARK) : null
  // The mode applied last, not the stored one: they are the same, except after a choice the
  // storage refused, which holds here as it does in the wallet.
  const onSystemChange = () => applyTheme(themeMode.value)
  if (media && typeof media.addEventListener === 'function') {
    media.addEventListener('change', onSystemChange)
  } else if (media && typeof media.addListener === 'function') {
    media.addListener(onSystemChange)
  }

  onBeforeUnmount(() => {
    window.removeEventListener('storage', onStorage)
    if (media && typeof media.removeEventListener === 'function') {
      media.removeEventListener('change', onSystemChange)
    } else if (media && typeof media.removeListener === 'function') {
      media.removeListener(onSystemChange)
    }
  })
}
