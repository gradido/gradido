import { DEFAULT_CACHE_TIMEOUT_MS } from '../const'

/**
 * What a cache needs to tell other processes about a change. `AppDatabase` provides it
 * over Redis; shared itself knows nothing about Redis.
 */
export interface PubSub {
  /** Resolves once messages of other processes arrive, rejects if subscribing failed. */
  subscribe(channel: string, handler: (message: string) => void): Promise<void>
  /** Reaches the handlers of this process too. */
  publish(channel: string, message?: string): void
}

export interface CachedValueOptions {
  timeoutMs?: number
  /**
   * Shares invalidations between all processes caching the same value: `invalidateEverywhere()`
   * publishes on `channel`, and every cache subscribed to it invalidates itself.
   * `pubSub` is a getter, because the connection behind it usually exists only after startup.
   */
  shared?: { channel: string; pubSub: () => PubSub }
}

/**
 * One value loaded on demand and kept until it is invalidated or has timed out.
 *
 * - Concurrent calls of `get()` share a single load.
 * - A load that was started before an invalidation still answers its callers, but does
 *   not write its result into the cache: it may have read the state from before the
 *   change that caused the invalidation.
 * - A failed load is not cached, the next `get()` loads again.
 * - With `shared`, an invalidation announced by another process invalidates this cache too.
 *   Pub/sub does not guarantee delivery, the timeout is the fallback for a lost message.
 * - With `shared`, a value is only cached if the subscription was confirmed before its load
 *   started. Until then an announcement could be lost unnoticed, so every get() loads anew.
 *   A load never waits for the subscription: without Redis the value is still read, just
 *   not cached.
 */
export class CachedValue<T> {
  private entry: { value: T; loadedAt: number } | null = null
  private pendingLoad: Promise<T> | null = null
  // bumped by every invalidate(), so a load started before it can recognize itself as outdated
  private generation = 0
  private readonly timeoutMs: number
  // the subscription which has been confirmed; a new connection hands out a new one
  private confirmedSubscription: Promise<void> | null = null

  // One function object, so subscribing it again on every load changes nothing.
  // An arrow function, so it keeps `this` when called by the pub/sub.
  private readonly invalidateOnMessage = (): void => this.invalidate()

  constructor(
    private readonly load: () => Promise<T>,
    private readonly options: CachedValueOptions = {},
  ) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_CACHE_TIMEOUT_MS
  }

  get(): Promise<T> {
    if (this.entry && Date.now() - this.entry.loadedAt <= this.timeoutMs) {
      return Promise.resolve(this.entry.value)
    }
    if (!this.pendingLoad) {
      const load = this.loadAndStore()
      this.pendingLoad = load
      // Once settled, the next get() starts a new load - unless an invalidate() has already
      // replaced it. Cleared here rather than inside loadAndStore(): a load that fails before
      // its first await would settle before it is even stored in pendingLoad.
      const clear = (): void => {
        if (this.pendingLoad === load) {
          this.pendingLoad = null
        }
      }
      load.then(clear, clear)
    }
    return this.pendingLoad
  }

  /** Forgets the value in this process only. */
  invalidate(): void {
    this.entry = null
    this.pendingLoad = null
    this.generation++
  }

  /**
   * For whoever changed the source of the value: forgets it in this process at once, and
   * with `shared` in every other process as soon as the message arrives.
   */
  invalidateEverywhere(): void {
    this.invalidate()
    if (this.options.shared) {
      this.options.shared.pubSub().publish(this.options.shared.channel)
    }
  }

  private async loadAndStore(): Promise<T> {
    const generation = this.generation
    const subscribed = this.subscribe()
    const value = await this.load()
    if (generation === this.generation && subscribed) {
      this.entry = { value, loadedAt: Date.now() }
    }
    return value
  }

  /** Subscribes if shared, and tells whether announcements of other processes arrive by now. */
  private subscribe(): boolean {
    if (!this.options.shared) {
      return true
    }
    // On every load rather than once in the constructor: the connection may not exist yet
    // when the cache is created, and may have been replaced since the last load. Before a
    // load there is nothing cached which a change could make stale.
    const subscription = this.options.shared
      .pubSub()
      .subscribe(this.options.shared.channel, this.invalidateOnMessage)
    subscription.then(
      () => {
        this.confirmedSubscription = subscription
      },
      // logged by the pub/sub; the next load subscribes again
      () => undefined,
    )
    return subscription === this.confirmedSubscription
  }
}
