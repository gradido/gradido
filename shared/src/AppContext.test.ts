// AI-GENERATED — not an architecture reference
import { afterAll, describe, expect, it } from 'bun:test'
import { AppContext, MINIMAL_PASSWORD_HASHING } from './AppContext'
import { PASSWORD_HASH_MAX_EXPECTED_WAIT_MS } from './const'
import { PasswordHashPriority } from './enum/PasswordHashPriority'
import { ResourceExhausted } from './errorTypes'

// the development secrets of backend/.env.dist
const secrets = { appSecret: '21ffbbc616fe', serverKey: 'a51ef8ac7ef1abf162fb7a65261acd7a' }

describe('AppContext', () => {
  afterAll(() => {
    AppContext.getInstance().destroy()
  })

  it('is one instance that answers nothing before init', () => {
    const context = AppContext.getInstance()
    expect(AppContext.getInstance()).toBe(context)
    expect(context.isInitialized()).toBe(false)
    expect(() => context.derivePinKey('salt', '000000')).toThrow('AppContext not initialized')
  })

  it('refuses a server key of the wrong size at init, not at the first login', () => {
    expect(() => AppContext.getInstance().init({ ...secrets, serverKey: 'a51ef8' })).toThrow(
      /16 bytes, got 3/,
    )
    expect(AppContext.getInstance().isInitialized()).toBe(false)
  })

  it('initializes once', () => {
    const context = AppContext.getInstance()
    context.init({ ...secrets, passwordHashing: MINIMAL_PASSWORD_HASHING })
    expect(context.isInitialized()).toBe(true)
    const native = context.getNative()
    // the second init keeps the native context it has
    context.init({ ...secrets, passwordHashing: { ...MINIMAL_PASSWORD_HASHING, threadCount: 3 } })
    expect(context.getNative()).toBe(native)
    expect(native.getPasswordHashingStats().threadCount).toBe(1)
  })

  // the same vectors as shared-native/tests/appContext.test.js
  it('derives the password key at the difficulty it was initialized with', async () => {
    const result = AppContext.getInstance().hashPassword(
      'fixed-salt',
      'Aa12345_',
      PasswordHashPriority.HIGH,
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(await result.value).toBe(6747017529199026988n)
    }
  })

  it('derives the pin key', () => {
    expect(AppContext.getInstance().derivePinKey('fixed-salt', '000000')).toBe(4194897870853666154n)
  })

  it('reports a full queue as ResourceExhausted', async () => {
    const context = AppContext.getInstance()
    // a few milliseconds per derivation and a small budget: the one thread is busy for long
    // enough that everything handed in below is still waiting, and it is over soon
    context.destroy()
    context.init({
      ...secrets,
      passwordHashing: {
        opsLimit: 1,
        memLimit: 8 * 1024 * 1024,
        threadCount: 1,
        maxExpectedWaitMs: 20,
      },
    })
    const { maxExpectedWaitMs, averageDurationMs } = context.getNative().getPasswordHashingStats()
    const fit = Math.ceil(maxExpectedWaitMs / averageDurationMs)
    const results = []
    for (let i = 0; i < fit + 6; i++) {
      results.push(context.hashPassword(`salt-${i}`, 'pw', PasswordHashPriority.LOW))
    }
    const refused = results.filter((result) => !result.success)
    expect(refused.length).toBeGreaterThanOrEqual(4)
    expect(refused[0].success === false && refused[0].error).toBeInstanceOf(ResourceExhausted)
    await Promise.all(results.map((result) => (result.success ? result.value : undefined)))
  })

  it('can be destroyed and initialized again', () => {
    const context = AppContext.getInstance()
    context.destroy()
    expect(context.isInitialized()).toBe(false)
    context.init({ ...secrets, passwordHashing: MINIMAL_PASSWORD_HASHING })
    expect(context.isInitialized()).toBe(true)
    // what MINIMAL_PASSWORD_HASHING leaves open comes from the constant
    expect(context.getPasswordHashingStats().maxExpectedWaitMs).toBe(
      PASSWORD_HASH_MAX_EXPECTED_WAIT_MS,
    )
  })
})
