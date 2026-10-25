// AI-GENERATED — not an architecture reference
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

/**
 * At boot the wallet takes the theme mode this device keeps before it applies one
 * (store/useWalletStore.js, adoptThemeModeFromDevice): the admin interface writes the device's
 * key as well, and the first applyTheme mirrors the store's mode into it. main.js is no module a
 * test can start, so its order is read where it is written, comments taken out first.
 */
const here = dirname(fileURLToPath(import.meta.url))
const main = readFileSync(resolve(here, './main.js'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')

describe('the boot of the wallet', () => {
  it('takes the mode stored on this device before it applies the theme', () => {
    const adopt = [...main.matchAll(/\bstore\.adoptThemeModeFromDevice\(\)/g)]
    const apply = [...main.matchAll(/\bstore\.applyTheme\(\)/g)]
    expect(adopt).toHaveLength(1)
    expect(apply.length).toBeGreaterThan(0)
    expect(adopt[0].index).toBeLessThan(apply[0].index)
  })
})
