import type { DocumentNode } from 'graphql'
import type * as v from 'valibot'
import { request } from '@/graphql/client'

/**
 * A fact more than one place reads (ARCHITECTURE.md, "A shared fact"): the last answer to
 * `document`, valid for `maxAge` milliseconds after it was asked for, whatever happens in between.
 * Asked with other variables, it is another fact: the answer to the last ones is gone.
 */
export class Resource<const TSchema extends v.GenericSchema> {
  /** Why the last question failed, until one succeeds. */
  error?: Error
  #value?: v.InferOutput<TSchema>
  #pendingRequest?: Promise<void>
  // the variables of the last question, as JSON
  #asked = '{}'
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

  /** Whether a question is on its way. */
  get loading() {
    return this.#pendingRequest !== undefined
  }

  /**
   * Asks unless the last question is younger than `maxAge` milliseconds: `ensureLoaded()` where an
   * answer of some minutes ago will do, `ensureLoaded(0)` where it must be the current one. Under
   * 100 ms, the time an answer takes, a question counts as current. `value` stays until the answer
   * replaces it. With other `variables` than the last question it asks at once, and `value` is
   * none until the answer: it was the answer to another question.
   */
  ensureLoaded(maxAge = this.maxAge, variables: Record<string, unknown> = {}) {
    const asked = JSON.stringify(variables)
    if (asked !== this.#asked) {
      this.#asked = asked
      this.#value = undefined
      this.error = undefined
      this.#askedAt = 0
    }
    if (this.#askedAt && Date.now() - this.#askedAt < Math.max(maxAge, 100)) {
      return this.#pendingRequest ?? Promise.resolve()
    }
    this.#askedAt = Date.now()
    const pendingRequest: Promise<void> = request(this.document, variables, this.schema).then(
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
