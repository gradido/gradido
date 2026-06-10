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
    public enumValue?: string
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

// general Result Type Template
export type Result<T, E = Error> = { success: true; value: T } | { success: false; error: E }

export type VoidResult<E = Error> = { success: true } | { success: false; error: E }
