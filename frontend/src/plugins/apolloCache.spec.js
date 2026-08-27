import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerApolloCacheClear, clearApolloCache } from './apolloCache'

describe('apolloCache', () => {
  beforeEach(() => {
    registerApolloCacheClear(null)
  })

  // The store calls this on every logout, including the ones that happen before the
  // Apollo client exists (a token found expired while the app is booting). Throwing
  // there would turn a logout into a crash.
  it('does nothing when no client has registered yet', async () => {
    await expect(clearApolloCache()).resolves.toBeUndefined()
  })

  it('hands the call on once a client has', async () => {
    const clear = vi.fn().mockResolvedValue()
    registerApolloCacheClear(clear)

    await clearApolloCache()

    expect(clear).toHaveBeenCalledTimes(1)
  })

  it('waits for the clearing to finish', async () => {
    let done = false
    registerApolloCacheClear(async () => {
      await Promise.resolve()
      done = true
    })

    await clearApolloCache()

    expect(done).toBe(true)
  })
})
