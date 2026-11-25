import m from 'mithril'
import * as v from 'valibot'
import { DeviceStore, DeviceStoreBasicType } from './DeviceStore'

const themeModeSchema = v.fallback(v.picklist(['system', 'light', 'dark']), 'system')
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

/**
 * Light or dark, as chosen on this device: the device's own entry, shared with the admin
 * interface and never removed at a sign-out. The script in index.html reads the same entry
 * before the first paint; this follows every change after: the switch in the settings, another
 * tab, and the system's own preference while the mode is `system`.
 */
export class ThemeStore extends DeviceStore<typeof themeModeSchema> {
  constructor() {
    super('gradido-theme-mode', themeModeSchema, DeviceStoreBasicType.String)
    this.#show()
    systemDark.addEventListener('change', () => {
      this.#show()
      m.redraw()
    })
  }

  get dark() {
    return this.state === 'dark' || (this.state === 'system' && systemDark.matches)
  }

  set(mode: v.InferOutput<typeof themeModeSchema> | undefined, persist = true) {
    super.set(mode, persist)
    this.#show()
  }

  // On body, where the styles look for it: `.dark-mode` for the wallet's own rules,
  // `data-bs-theme` for Bootstrap's.
  #show() {
    document.body.classList.toggle('dark-mode', this.dark)
    if (this.dark) {
      document.body.setAttribute('data-bs-theme', 'dark')
    } else {
      document.body.removeAttribute('data-bs-theme')
    }
    // The bar of an installed app is the page's ground: read from the styles, so that the two
    // cannot differ. Empty before the styles are here; index.html named the colour already.
    const ground = getComputedStyle(document.body).getPropertyValue('--bg').trim()
    if (ground) {
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', ground)
    }
  }
}

export const theme = new ThemeStore()
