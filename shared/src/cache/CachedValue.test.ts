// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, mock, setSystemTime } from 'bun:test'
import { CachedValue, PubSub } from './CachedValue'

// a load which only finishes when the test says so
const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// what AppDatabase does over Redis, in memory: a message reaches every subscriber, the sender
// included. Every subscription is confirmed at once, and like AppDatabase it hands out the
// same promise for a channel as long as the subscription stands.
const confirmed = Promise.resolve()
const inMemoryPubSub = () => {
  const handlers = new Map<string, Set<(message: string) => void>>()
  const pubSub: PubSub = {
    subscribe: mock((channel: string, handler: (message: string) => void) => {
      handlers.set(channel, (handlers.get(channel) ?? new Set()).add(handler))
      return confirmed
    }),
    publish: mock((channel: string, message = '') => {
      for (const handler of handlers.get(channel) ?? []) {
        handler(message)
      }
    }),
  }
  return { pubSub, handlers }
}

describe('CachedValue', () => {
  afterEach(() => {
    setSystemTime()
  })

  it('loads on the first get and answers later gets from the cache', async () => {
    const load = mock(async () => 'value')
    const cache = new CachedValue(load)
    expect(await cache.get()).toBe('value')
    expect(await cache.get()).toBe('value')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('loads again after invalidate', async () => {
    let counter = 0
    const cache = new CachedValue(async () => ++counter)
    expect(await cache.get()).toBe(1)
    cache.invalidate()
    expect(await cache.get()).toBe(2)
  })

  it('loads again once the timeout has passed', async () => {
    setSystemTime(new Date('2026-01-01T12:00:00.000Z'))
    let counter = 0
    const cache = new CachedValue(async () => ++counter, { timeoutMs: 1000 })
    expect(await cache.get()).toBe(1)

    setSystemTime(new Date('2026-01-01T12:00:01.000Z'))
    expect(await cache.get()).toBe(1)

    setSystemTime(new Date('2026-01-01T12:00:01.001Z'))
    expect(await cache.get()).toBe(2)
  })

  it('shares one load between concurrent gets', async () => {
    const pending = deferred<string>()
    const load = mock(() => pending.promise)
    const cache = new CachedValue(load)
    const first = cache.get()
    const second = cache.get()
    pending.resolve('value')
    expect(await Promise.all([first, second])).toEqual(['value', 'value'])
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('does not cache the result of a load started before invalidate', async () => {
    const outdated = deferred<string>()
    const current = deferred<string>()
    const loads = [() => outdated.promise, () => current.promise]
    const load = mock(() => loads.shift()!())
    const cache = new CachedValue(load)

    const before = cache.get()
    // the change happens while the first load is still running
    cache.invalidate()
    const after = cache.get()
    // the newer load finishes first, the outdated one afterwards
    current.resolve('new')
    expect(await after).toBe('new')
    outdated.resolve('old')

    // the caller from before the change still gets its answer
    expect(await before).toBe('old')
    // but the cache keeps the newer value, without loading a third time
    expect(await cache.get()).toBe('new')
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('does not let an outdated load remove the load which replaced it', async () => {
    const outdated = deferred<string>()
    const current = deferred<string>()
    const loads = [() => outdated.promise, () => current.promise]
    const load = mock(() => loads.shift()!())
    const cache = new CachedValue(load)

    const before = cache.get()
    cache.invalidate()
    const after = cache.get()
    outdated.resolve('old')
    // the outdated load has settled completely
    expect(await before).toBe('old')

    // still shares the current load instead of starting a third one
    const later = cache.get()
    current.resolve('new')
    expect(await after).toBe('new')
    expect(await later).toBe('new')
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('does not cache a failed load', async () => {
    const loads = [
      async () => {
        throw new Error('load failed')
      },
      async () => 'value',
    ]
    const cache = new CachedValue(() => loads.shift()!())
    await expect(cache.get()).rejects.toThrow('load failed')
    expect(await cache.get()).toBe('value')
  })

  describe('shared between processes', () => {
    // A shared cache keeps nothing until its subscription is confirmed. The first get()
    // subscribes, so from the second one on the value is cached.
    const subscribedCache = async <T>(load: () => Promise<T>, pubSub: PubSub) => {
      const cache = new CachedValue(load, { shared: { channel: 'changed', pubSub: () => pubSub } })
      await cache.get()
      return cache
    }

    it('subscribes on load, with the same handler every time', async () => {
      const { pubSub, handlers } = inMemoryPubSub()
      const cache = new CachedValue(async () => 'value', {
        shared: { channel: 'changed', pubSub: () => pubSub },
      })
      // nothing cached yet, nothing to subscribe for
      expect(pubSub.subscribe).not.toHaveBeenCalled()

      await cache.get()
      cache.invalidate()
      await cache.get()

      expect(pubSub.subscribe).toHaveBeenCalledTimes(2)
      expect(handlers.get('changed')?.size).toBe(1)
    })

    it('does not cache before the subscription is confirmed, and does not wait for it', async () => {
      // Redis has not answered the SUBSCRIBE yet: an announcement now would be lost
      const confirmation = deferred<void>()
      const pubSub: PubSub = {
        subscribe: mock(() => confirmation.promise),
        publish: mock(() => undefined),
      }
      let counter = 0
      const cache = new CachedValue(async () => ++counter, {
        shared: { channel: 'changed', pubSub: () => pubSub },
      })
      expect(await cache.get()).toBe(1)
      expect(await cache.get()).toBe(2)

      confirmation.resolve()
      await confirmation.promise
      expect(await cache.get()).toBe(3)
      expect(await cache.get()).toBe(3)
    })

    it('does not cache the load which was running when the subscription got confirmed', async () => {
      const confirmation = deferred<void>()
      const pending = deferred<number>()
      const loads = [() => pending.promise, async () => 2]
      const pubSub: PubSub = {
        subscribe: mock(() => confirmation.promise),
        publish: mock(() => undefined),
      }
      const cache = new CachedValue(() => loads.shift()!(), {
        shared: { channel: 'changed', pubSub: () => pubSub },
      })
      const first = cache.get()
      // confirmed while the load already reads: it may have read before a lost announcement
      confirmation.resolve()
      await confirmation.promise
      pending.resolve(1)
      expect(await first).toBe(1)

      expect(await cache.get()).toBe(2)
      expect(await cache.get()).toBe(2)
    })

    it('subscribes again after a failed subscription, and caches once that one is confirmed', async () => {
      const subscriptions = [Promise.reject(new Error('Redis unreachable')), confirmed, confirmed]
      // the rejection is handled by the cache, not by this test
      subscriptions[0].catch(() => undefined)
      const pubSub: PubSub = {
        subscribe: mock(() => subscriptions.shift()!),
        publish: mock(() => undefined),
      }
      let counter = 0
      const cache = new CachedValue(async () => ++counter, {
        shared: { channel: 'changed', pubSub: () => pubSub },
      })
      expect(await cache.get()).toBe(1)
      // subscribes again; confirmed only while this load is running, so not cached yet
      expect(await cache.get()).toBe(2)
      expect(await cache.get()).toBe(3)
      expect(await cache.get()).toBe(3)
      expect(pubSub.subscribe).toHaveBeenCalledTimes(3)
    })

    it('invalidates when another process announces a change', async () => {
      const { pubSub } = inMemoryPubSub()
      let counter = 0
      const cache = await subscribedCache(async () => ++counter, pubSub)
      expect(await cache.get()).toBe(2)
      expect(await cache.get()).toBe(2)

      pubSub.publish('changed')
      expect(await cache.get()).toBe(3)
    })

    it('ignores other channels', async () => {
      const { pubSub } = inMemoryPubSub()
      let counter = 0
      const cache = await subscribedCache(async () => ++counter, pubSub)
      expect(await cache.get()).toBe(2)

      pubSub.publish('something else')
      expect(await cache.get()).toBe(2)
    })

    it('invalidateEverywhere invalidates this process and publishes the change', async () => {
      const { pubSub } = inMemoryPubSub()
      let counter = 0
      const cache = await subscribedCache(async () => ++counter, pubSub)
      expect(await cache.get()).toBe(2)

      cache.invalidateEverywhere()
      expect(pubSub.publish).toHaveBeenCalledWith('changed')
      expect(await cache.get()).toBe(3)
    })

    it('invalidates this process at once, without waiting for its own message', async () => {
      // a pub/sub which delivers nothing, like Redis while unreachable
      const pubSub: PubSub = {
        subscribe: mock(() => confirmed),
        publish: mock(() => undefined),
      }
      let counter = 0
      const cache = await subscribedCache(async () => ++counter, pubSub)
      expect(await cache.get()).toBe(2)

      cache.invalidateEverywhere()
      expect(await cache.get()).toBe(3)
    })

    it('invalidate only forgets the value here, it announces nothing', async () => {
      const { pubSub } = inMemoryPubSub()
      const cache = await subscribedCache(async () => 'value', pubSub)
      cache.invalidate()
      expect(pubSub.publish).not.toHaveBeenCalled()
    })

    it('does not stay stuck when subscribing fails', async () => {
      const pubSub: PubSub = {
        subscribe: mock(() => {
          throw new Error('Redis subscriber not initialized')
        }),
        publish: mock(() => undefined),
      }
      const cache = new CachedValue(async () => 'value', {
        shared: { channel: 'changed', pubSub: () => pubSub },
      })
      await expect(cache.get()).rejects.toThrow('Redis subscriber not initialized')

      pubSub.subscribe = mock(() => confirmed)
      expect(await cache.get()).toBe('value')
    })

    it('without shared, invalidateEverywhere is a plain invalidate', async () => {
      let counter = 0
      const cache = new CachedValue(async () => ++counter)
      expect(await cache.get()).toBe(1)
      cache.invalidateEverywhere()
      expect(await cache.get()).toBe(2)
    })
  })
})
