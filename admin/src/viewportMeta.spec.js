// AI-GENERATED — not an architecture reference

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The admin lets a phone zoom (Bernd, 23.10.2026): a moderator who cannot read a contribution's
// small print spreads two fingers, as on every other page. `maximum-scale` and `user-scalable`
// had switched that off. Nothing of it runs in a test, so the page itself is read.
const here = dirname(fileURLToPath(import.meta.url))
const html = readFileSync(join(here, '..', 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '')

describe('the viewport of the admin', () => {
  const viewport = html.match(/<meta\s+name="viewport"\s+content="([^"]*)"/)

  it('is as wide as the device and starts unzoomed', () => {
    expect(viewport, 'no viewport meta in index.html').not.toBeNull()
    expect(viewport[1]).toBe('width=device-width, initial-scale=1')
  })

  it('lets the moderator zoom', () => {
    expect(html).not.toMatch(/user-scalable/)
    expect(html).not.toMatch(/maximum-scale/)
  })
})
