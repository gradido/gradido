// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi } from 'vitest'

const mockConfig = { GMS_ACTIVE: false, HUMHUB_ACTIVE: false, MATCHING_ACTIVE: false }
vi.mock('@/config', () => ({
  default: new Proxy({}, { get: (_target, key) => mockConfig[key] }),
}))

// resetModules, because the route table reads the flags once at import -- the same way a
// build does. The counterpart (both services off) is measured in router.test.js.
const legacyRedirect = async () => {
  vi.resetModules()
  const { default: routes } = await import('./routes')
  return routes.find((route) => route.path === '/settings/extern').redirect()
}

describe('the old /settings/extern address', () => {
  it('leads to the circles where a service is switched on', async () => {
    mockConfig.HUMHUB_ACTIVE = true
    const target = await legacyRedirect()
    mockConfig.HUMHUB_ACTIVE = false

    expect(target).toEqual({ path: '/settings/communities' })
  })

  /**
   * ⛔ And to the settings themselves where none is: the area is not registered there, so
   * this would otherwise send five news entries and every printed link to "not found".
   */
  it('leads to the settings where none is', async () => {
    expect(await legacyRedirect()).toEqual({ path: '/settings' })
  })
})
