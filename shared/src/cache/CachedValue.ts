// AI-GENERATED — not an architecture reference
import { DEFAULT_CACHE_TIMEOUT_MS } from '../const'

/**
 * One value loaded on demand and kept until it is invalidated or has timed out.
 *
 * - Concurrent calls of `get()` share a single load.
 * - A load that was started before `invalidate()` still answers its callers, but does
 *   not write its result into the cache: it may have read the state from before the
 *   change that caused the invalidation.
 * - A failed load is not cached, the next `get()` loads again.
 */
export class CachedValue<T> {
  private entry: { value: T; loadedAt: number } | null = null
  private pendingLoad: Promise<T> | null = null
  // bumped by every invalidate(), so a load started before it can recognize itself as outdated
  private generation = 0

  constructor(
    private readonly load: () => Promise<T>,
    private readonly timeoutMs: number = DEFAULT_CACHE_TIMEOUT_MS,
  ) {}

  get(): Promise<T> {
    if (this.entry && Date.now() - this.entry.loadedAt <= this.timeoutMs) {
      return Promise.resolve(this.entry.value)
    }
    this.pendingLoad ??= this.loadAndStore()
    return this.pendingLoad
  }

  invalidate(): void {
    this.entry = null
    this.pendingLoad = null
    this.generation++
  }

  private async loadAndStore(): Promise<T> {
    const generation = this.generation
    try {
      const value = await this.load()
      if (generation === this.generation) {
        this.entry = { value, loadedAt: Date.now() }
      }
      return value
    } finally {
      // after an invalidate() pendingLoad may already belong to a newer load
      if (generation === this.generation) {
        this.pendingLoad = null
      }
    }
  }
}
