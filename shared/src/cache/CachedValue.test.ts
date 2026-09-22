// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, mock, setSystemTime } from 'bun:test'
import { CachedValue } from './CachedValue'

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
    const cache = new CachedValue(async () => ++counter, 1000)
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

    cache.get()
    cache.invalidate()
    const after = cache.get()
    outdated.resolve('old')
    await Promise.resolve()

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
})
