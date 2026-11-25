// AI-GENERATED — not an architecture reference

/**
 * What one page leaves for the page the member goes to next (a link to pass on, a recipient
 * to send to): taken once, then gone. Kept in memory only -- a page loaded anew has none, and
 * so has the next member, for whom the page is loaded anew.
 */
export class HandOver<T> {
  #held?: { value: T; at: number }

  /** `holdsMs`: how long what was left may wait to be taken; for ever where not set. */
  constructor(private readonly holdsMs = Number.POSITIVE_INFINITY) {}

  put(value: T) {
    this.#held = { value, at: Date.now() }
  }

  take() {
    const held = this.#held
    this.#held = undefined
    return held && Date.now() - held.at <= this.holdsMs ? held.value : undefined
  }

  /** Takes `value` back, where it still waits: the page that left it was not left after all. */
  drop(value: T) {
    if (this.#held?.value === value) {
      this.#held = undefined
    }
  }
}
