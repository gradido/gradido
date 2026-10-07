// AI-GENERATED — not an architecture reference
const { describe, it, after } = require('node:test')
const { strict } = require('node:assert')
const assert = strict
const { NativeAppContext } = require('../')

// the development secrets of backend/.env.dist
const appSecret = Buffer.from('21ffbbc616fe', 'hex')
const serverKey = Buffer.from('a51ef8ac7ef1abf162fb7a65261acd7a', 'hex')

// argon2id's minimums: what a test uses where no hash is compared with a production one
const minimal = { opsLimit: 1, memLimit: 8192, threadCount: 1 }

describe('NativeAppContext', () => {
  const contexts = []
  const create = (options) => {
    const context = new NativeAppContext({ appSecret, serverKey, ...options })
    contexts.push(context)
    return context
  }
  after(() => {
    for (const context of contexts) {
      context.destroy()
    }
  })

  describe('constructor', () => {
    it('refuses a server key of the wrong size', () => {
      assert.throws(
        () => new NativeAppContext({ appSecret, serverKey: Buffer.alloc(3) }),
        /16 bytes, got 3/,
      )
    })
    it('refuses an empty app secret', () => {
      assert.throws(
        () => new NativeAppContext({ appSecret: Buffer.alloc(0), serverKey }),
        /appSecret/,
      )
    })
    it('refuses a difficulty below what argon2id accepts', () => {
      assert.throws(
        () => new NativeAppContext({ appSecret, serverKey, passwordHashing: { memLimit: 4096 } }),
        /below what argon2id accepts/,
      )
      assert.throws(
        () => new NativeAppContext({ appSecret, serverKey, passwordHashing: { opsLimit: 0 } }),
        /positive integer/,
      )
    })
    it('reports the thread count, the rule and a first measured duration', () => {
      const stats = create({
        passwordHashing: { ...minimal, threadCount: 2 },
      }).getPasswordHashingStats()
      assert.equal(stats.threadCount, 2)
      assert.equal(stats.maxExpectedWaitMs, 3500)
      assert.ok(stats.averageDurationMs > 0)
      assert.equal(stats.expectedWaitMs, 0)
      assert.equal(stats.highPriorityQueued, 0)
      assert.equal(stats.lowPriorityQueued, 0)
    })
  })

  describe('hashPassword', () => {
    /**
     * ⛔ The exact output for fixed inputs at the production difficulty, computed with the
     * derivation this replaced (backend/src/password/EncryptionWorker.js). If this falls, every
     * stored password on every server stops matching, with no way to tell that apart from a
     * wrong password.
     */
    it('derives what the old worker derived', async () => {
      const context = create({ passwordHashing: { threadCount: 1 } })
      const result = context.hashPassword('fixed-salt', 'Aa12345_', 0)
      assert.equal(result.success, true)
      assert.equal(await result.value, 831872323346742571n)
      assert.equal(
        await context.hashPassword('bibi@bloxberg.de', 'Aa12345_', 1).value,
        12825419584724616625n,
      )
    })

    it('derives the same at the minimal difficulty as the old jest mock did', async () => {
      const context = create({ passwordHashing: minimal })
      assert.equal(
        await context.hashPassword('fixed-salt', 'Aa12345_', 0).value,
        6747017529199026988n,
      )
    })

    it('changes with salt and password, not with the priority', async () => {
      const context = create({ passwordHashing: minimal })
      const base = await context.hashPassword('salt-1', 'pw-1', 0).value
      assert.equal(await context.hashPassword('salt-1', 'pw-1', 1).value, base)
      assert.notEqual(await context.hashPassword('salt-2', 'pw-1', 0).value, base)
      assert.notEqual(await context.hashPassword('salt-1', 'pw-2', 0).value, base)
    })

    it('refuses the priority it does not know', () => {
      const context = create({ passwordHashing: minimal })
      assert.throws(
        () => context.hashPassword('salt', 'pw', 2),
        /priority to be 0 \(high\) or 1 \(low\)/,
      )
    })

    it('refuses what would wait longer than the rule allows', async () => {
      // the production difficulty: a thread is busy with one derivation for long enough that
      // everything handed in below is still waiting, and the figures are real
      const context = create({ passwordHashing: { threadCount: 1 } })
      const { averageDurationMs, maxExpectedWaitMs, threadCount } =
        context.getPasswordHashingStats()
      const fit = Math.ceil(maxExpectedWaitMs / averageDurationMs)
      const results = []
      for (let i = 0; i < fit + threadCount + 5; i++) {
        results.push(context.hashPassword(`job-${i}`, 'pw', i % 2))
      }
      const accepted = results.filter((result) => result.success)
      const refused = results.filter((result) => !result.success)
      const report = `${accepted.length} accepted at ${averageDurationMs} ms per derivation`
      // the thread may have taken a job out of the queue already
      assert.ok(accepted.length >= Math.floor(maxExpectedWaitMs / averageDurationMs), report)
      assert.ok(accepted.length <= fit + threadCount + 1, report)
      assert.ok(refused.length >= 4, report)
      assert.equal(refused[0].error.name, 'PASSWORD_HASH_QUEUE_FULL')
      assert.match(
        refused[0].error.message,
        /^an expected wait of \d+ ms exceeds 3500 ms \(\d+ queued, \d+ ms per derivation on 1 thread\)$/,
      )
      const keys = await Promise.all(accepted.map((result) => result.value))
      assert.ok(keys.every((key) => typeof key === 'bigint'))
      const after = context.getPasswordHashingStats()
      assert.ok(after.averageDurationMs > 0)
      assert.equal(after.highPriorityQueued + after.lowPriorityQueued, 0)
    })

    it('gives the low queue every third pick while both wait', async () => {
      const context = create({ passwordHashing: { threadCount: 1 } })
      // keeps the one thread busy while the others line up; low, so the count starts at zero
      const blocker = context.hashPassword('blocker', 'pw', 1).value
      const order = []
      const jobs = []
      for (let i = 0; i < 6; i++) {
        jobs.push(
          context.hashPassword(`low-${i}`, 'pw', 1).value.then(() => order.push(`low-${i}`)),
        )
      }
      for (let i = 0; i < 6; i++) {
        jobs.push(
          context.hashPassword(`high-${i}`, 'pw', 0).value.then(() => order.push(`high-${i}`)),
        )
      }
      await Promise.all([blocker, ...jobs])
      assert.deepEqual(order, [
        'high-0',
        'high-1',
        'low-0',
        'high-2',
        'high-3',
        'low-1',
        'high-4',
        'high-5',
        'low-2',
        'low-3',
        'low-4',
        'low-5',
      ])
    })

    it('throws once the context is destroyed', () => {
      const context = new NativeAppContext({ appSecret, serverKey, passwordHashing: minimal })
      context.destroy()
      // a second time changes nothing
      context.destroy()
      assert.throws(() => context.hashPassword('salt', 'pw', 0), /destroyed/)
    })
  })

  describe('derivePinKey', () => {
    const context = () => create({ passwordHashing: minimal })

    it('is deterministic and changes with salt and pin', () => {
      const base = context().derivePinKey('salt-1', '123456')
      assert.equal(context().derivePinKey('salt-1', '123456'), base)
      assert.notEqual(context().derivePinKey('salt-2', '123456'), base)
      assert.notEqual(context().derivePinKey('salt-1', '654321'), base)
    })

    it('changes with the app secret and the server key', () => {
      const base = context().derivePinKey('salt-1', '123456')
      const otherSecret = new NativeAppContext({
        appSecret: Buffer.from('ff', 'hex'),
        serverKey,
        passwordHashing: minimal,
      })
      const otherKey = new NativeAppContext({
        appSecret,
        serverKey: Buffer.from('b51ef8ac7ef1abf162fb7a65261acd7a', 'hex'),
        passwordHashing: minimal,
      })
      contexts.push(otherSecret, otherKey)
      assert.notEqual(otherSecret.derivePinKey('salt-1', '123456'), base)
      assert.notEqual(otherKey.derivePinKey('salt-1', '123456'), base)
    })

    /**
     * ⛔ The exact output for fixed inputs, moved here from backend/src/password/PinEncryptor.test.ts
     * and pinned on purpose. If this falls, every stored KEYED_HASH pin on every server stops
     * matching, with no way to tell that apart from a wrong PIN. A change needs a new
     * `pin_derivation` value, never an edit in place.
     */
    it('never changes its answer for a known input', () => {
      assert.equal(context().derivePinKey('fixed-salt', '000000'), 4194897870853666154n)
    })
  })
})
