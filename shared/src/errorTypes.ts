export abstract class DomainError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class CompareError extends DomainError {
  constructor(
    message: string,
    public actual?: string,
    public expected?: string,
  ) {
    let messageSum = message
    if (actual) {
      messageSum = messageSum.concat(`, actual: ${actual}`)
    }
    if (expected) {
      messageSum = messageSum.concat(`, expected: ${expected}`)
    }
    super(messageSum)
  }
}

export class UnhandledEnum extends DomainError {
  constructor(
    message: string,
    public enumName?: string,
    public enumValue?: string,
  ) {
    let messageSum = message
    if (enumName) {
      messageSum = messageSum.concat(`, enum type: ${enumName}`)
    }
    if (enumValue) {
      messageSum = messageSum.concat(`, enum value: ${enumValue}`)
    }
    super(messageSum)
  }
}

/**
 * A request to another community's federation API that produced no usable answer: the
 * community could not be reached, did not answer in time, refused, or answered something
 * that does not hold up. That server is outside this one's control, so this is an
 * expected failure -- returned, never thrown.
 */
export class XComRequestError extends DomainError {
  constructor(
    public readonly communityUuid: string,
    public readonly reason: string,
  ) {
    super(`XCOM_REQUEST_FAILED for community ${communityUuid}: ${reason}`)
  }
}

// general Result Type Template
export type Result<T, E = Error> = { success: true; value: T } | { success: false; error: E }
export type ResultChanged<T> = { changed: true; value: T } | { changed: false }

export type VoidResult<E = Error> = { success: true } | { success: false; error: E }
