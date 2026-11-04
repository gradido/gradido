// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi } from 'vitest'

const mockConfig = { HUMHUB_ACTIVE: false, MATCHING_ACTIVE: false }
vi.mock('@/config', () => ({
  default: new Proxy({}, { get: (_target, key) => mockConfig[key] }),
}))

// resetModules, because the route table reads the flags once at import -- the same way a
// build does. The counterpart (HumHub off) is measured in router.test.js.
const legacyRedirect = async () => {
  vi.resetModules()
  const { default: routes } = await import('./routes')
  return routes.find((route) => route.path === '/settings/extern').redirect()
}

describe('the old /settings/extern address', () => {
  it('leads to the circles where HumHub is switched on', async () => {
    mockConfig.HUMHUB_ACTIVE = true
    const target = await legacyRedirect()
    mockConfig.HUMHUB_ACTIVE = false

    expect(target).toEqual({ path: '/settings/communities' })
  })

  /**
   * ⛔ And to the settings themselves where it is not: the area is not registered there, so
   * this would otherwise send five news entries and every printed link to "not found".
   */
  it('leads to the settings where HumHub is switched off', async () => {
    expect(await legacyRedirect()).toEqual({ path: '/settings' })
  })
})
