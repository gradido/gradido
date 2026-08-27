// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import routes from './routes'

/**
 * The menu and the routes are two files that have to agree, and nothing makes them.
 *
 * ⚠️ The menu used to be two files -- one for the desk, one for the phone -- and this guard
 * read both. They are one component now, which removes half of what could drift; the other
 * half, menu against routes, is what remains and is measured here.
 *
 * An entry without a route is a dead link -- exactly what happened to "notifications" while
 * this was being built: menu, list and a route test that listed the routes it found, all
 * green, and the entry led nowhere. A route without an entry is the other half: a page
 * nobody can reach except by typing the address.
 *
 * So this holds the two files against each other instead of believing either.
 */
const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

// ⚠️ /settings/communities is left out on purpose: it is gated by GMS_ACTIVE || HUMHUB_ACTIVE
// in all three places -- menu, list and routes -- and both flags are off under test, so the
// source still shows the entry while the route is rightly absent. That the three gates agree
// is measured where each of them lives (SettingsSidebar.spec, Index.spec, router.test).
// Both spellings: the entries live in a table in the script now (`to: '/settings/…'`), and a
// template attribute (`to="/settings/…"`) is still what a hand-written row would use.
const linkedPaths = (source) =>
  [...new Set([...source.matchAll(/to(?:="|: ')(\/settings\/[a-z-]+)/g)].map((m) => m[1]))].filter(
    (path) => path !== '/settings/communities',
  )

const registered = routes.map((route) => route.path)

describe('the settings menu and the settings routes', () => {
  it('leads nowhere that is not registered', () => {
    for (const path of linkedPaths(read('../components/Menu/SettingsMenu.vue'))) {
      expect(registered).toContain(path)
    }
  })

  // The other direction: a registered area that neither the menu nor the list offers would
  // be reachable only by typing the address. /settings/extern is the one exception -- it is
  // the old address kept alive for links already in the world, not an area.
  it('offers every area it registers', () => {
    const offered = new Set(linkedPaths(read('../components/Menu/SettingsMenu.vue')))

    const areas = registered.filter(
      (path) => path.startsWith('/settings/') && path !== '/settings/extern',
    )

    for (const area of areas) {
      expect(offered).toContain(area)
    }
  })
})
