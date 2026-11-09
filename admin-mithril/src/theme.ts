// AI-GENERATED — not an architecture reference
import m from 'mithril'

/**
 * The admin's light or dark: whatever the wallet is set to on this device. Both apps share the
 * origin and so the key; both write it (the wallet's settings, the switch in the account menu).
 * The mark is Bootstrap's `data-bs-theme="dark"` on `<html>`; index.html sets it before the first
 * paint, this follows every change after.
 *
 * ⚠️ A write in this tab never reaches it as a `storage` event: whoever writes the key here
 * applies the mode itself (writeThemeMode).
 */
const THEME_MODE_STORAGE_KEY = 'gradido-theme-mode'

export type ThemeMode = 'system' | 'light' | 'dark'

const MODES: readonly string[] = ['system', 'light', 'dark']

// The page's dark, also for the window's bar where the admin runs as an installed app in the
// wallet's window; the light names nothing and the bar stays the wallet's.
const DARK_BAR_COLOUR = '#17181a'

const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

let mode: ThemeMode = 'system'

/** The mode shown, as the switch in the account menu marks it. */
export const themeMode = () => mode

/** The mode the device keeps; missing, unknown or unreadable is `system`, as in the wallet. */
const readThemeMode = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(THEME_MODE_STORAGE_KEY)
    return stored !== null && MODES.includes(stored) ? (stored as ThemeMode) : 'system'
  } catch {
    return 'system'
  }
}

const nameBarColour = (colour: string | null) => {
  let meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (colour === null) {
    meta?.remove()
    return
  }
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.content = colour
}

const applyTheme = (chosen: ThemeMode) => {
  mode = chosen
  if (chosen === 'dark' || (chosen === 'system' && systemDark.matches)) {
    document.documentElement.setAttribute('data-bs-theme', 'dark')
    nameBarColour(DARK_BAR_COLOUR)
  } else {
    document.documentElement.removeAttribute('data-bs-theme')
    nameBarColour(null)
  }
}

/**
 * The switch in the account menu: keeps the mode for the device and applies it at once. Where the
 * storage refuses the write, the mode holds for this page all the same, as in the wallet.
 */
export const writeThemeMode = (chosen: ThemeMode) => {
  try {
    localStorage.setItem(THEME_MODE_STORAGE_KEY, chosen)
  } catch {
    // a private window or a full storage: not kept, applied all the same
  }
  applyTheme(chosen)
}

/**
 * Applies the mode the device keeps, and follows it while the admin is open: a change in another
 * tab (the wallet's switch), and a change of the system's preference while the mode is `system`.
 */
export const followTheme = () => {
  applyTheme(readThemeMode())
  window.addEventListener('storage', (event) => {
    // `key` null: another tab cleared the whole storage, the key may be gone with it
    if (event.key === THEME_MODE_STORAGE_KEY || event.key === null) {
      applyTheme(readThemeMode())
      m.redraw()
    }
  })
  // the mode applied last, not the stored one: after a write the storage refused they differ
  systemDark.addEventListener('change', () => applyTheme(mode))
}
