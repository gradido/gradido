import type { DocumentNode } from 'graphql'
import type * as v from 'valibot'
import { request } from '@/graphql/client'

/**
 * A fact more than one place reads (ARCHITECTURE.md, "A shared fact"): the last answer to
 * `document`, valid for `maxAge` milliseconds after it was asked for, whatever happens in between.
 */
export class Resource<const TSchema extends v.GenericSchema> {
  /** Why the last question failed, until one succeeds. */
  error?: Error
  #value?: v.InferOutput<TSchema>
  #pendingRequest?: Promise<void>
  // when the last question was asked; 0 where none was, or it failed
  #askedAt = 0

  constructor(
    private readonly document: DocumentNode,
    private readonly schema: TSchema,
    private readonly maxAge = 10 * 60_000,
  ) {}

  get value() {
    return this.#value
  }

  /**
   * Asks unless the last question is younger than `maxAge` milliseconds: `ensureLoaded()` where an
   * answer of some minutes ago will do, `ensureLoaded(0)` where it must be the current one. Under
   * 100 ms, the time an answer takes, a question counts as current. `value` stays until the answer
   * replaces it.
   */
  ensureLoaded(maxAge = this.maxAge) {
    if (this.#askedAt && Date.now() - this.#askedAt < Math.max(maxAge, 100)) {
      return this.#pendingRequest ?? Promise.resolve()
    }
    this.#askedAt = Date.now()
    const pendingRequest: Promise<void> = request(this.document, {}, this.schema).then(
      (answer) => {
        // a later question was asked: the newest wins
        if (this.#pendingRequest !== pendingRequest) {
          return
        }
        this.#pendingRequest = undefined
        if (answer.success) {
          this.#value = answer.value
          this.error = undefined
        } else {
          this.error = answer.error
          // a failed question is no answer: the next reader asks again
          this.#askedAt = 0
        }
      },
      (thrown) => {
        // `request` threw: no answer either, and the reader is to see it
        if (this.#pendingRequest === pendingRequest) {
          this.#pendingRequest = undefined
          this.#askedAt = 0
        }
        throw thrown
      },
    )
    this.#pendingRequest = pendingRequest
    return pendingRequest
  }
}
