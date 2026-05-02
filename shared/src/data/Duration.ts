import { durationToString } from 'shared-native'

/**
 * Immutable time duration represented in seconds (bigint precision).
 *
 * @example
 * ```typescript
 * const duration = Duration.days(1n).add(Duration.hours(2n).add(Duration.minutes(3n).add(Duration.seconds(4n))))
 * console.log(duration.seconds) // 93784n
 * console.log(duration.toString()) // "1.08 days"
 * ```
 */
export class Duration {
  protected _seconds: bigint

  constructor(seconds: bigint) {
    this._seconds = seconds
  }

  /**
   * Creates a Duration from the difference between two Dates
   * if to is before from, the result will be negative
   * @param from The start Date
   * @param to The end Date
   * @returns A new Duration with the difference from -> to
   */
  public static fromDateDiff(from: Date, to: Date): Duration {
    return new Duration(BigInt(Math.floor((to.getTime() - from.getTime()) / 1000)))
  }

  /**
   * Creates a Duration from a number of seconds
   * @param seconds The number of seconds
   * @returns A new Duration with the given number of seconds
   */
  public static seconds(seconds: number): Duration {
    return new Duration(BigInt(seconds))
  }

  /**
   * Creates a Duration from a number of minutes
   * @param minutes The number of minutes
   * @returns A new Duration with the given number of minutes
   */
  public static minutes(minutes: number): Duration {
    return new Duration(BigInt(minutes * 60))
  }

  /**
   * Creates a Duration from a number of hours
   * @param hours The number of hours
   * @returns A new Duration with the given number of hours
   */
  public static hours(hours: number): Duration {
    return new Duration(BigInt(hours * 60 * 60))
  }

  /**
   * Creates a Duration from a number of days
   * @param days The number of days
   * @returns A new Duration with the given number of days
   */
  public static days(days: number): Duration {
    return new Duration(BigInt(days * 24 * 60 * 60))
  }

  /**
   * Adds this Duration to a Date
   * @param date The Date to add this Duration to
   * @returns A new Date with this Duration added
   */
  public addToDate(date: Date): Date {
    return new Date(date.getTime() + Number(this._seconds * 1000n))
  }

  /**
   * Subtracts this Duration from a Date
   * @param date The Date to subtract this Duration from
   * @returns A new Date with this Duration subtracted
   */
  public subtractFromDate(date: Date): Date {
    return new Date(date.getTime() - Number(this._seconds * 1000n))
  }

  /**
   * Adds another Duration to this Duration
   * @param duration The Duration to add
   * @returns A new Duration with the result
   */
  public add(duration: Duration): Duration {
    return new Duration(this._seconds + duration._seconds)
  }

  /**
   * Subtracts another Duration from this Duration
   * @param duration The Duration to subtract
   * @returns A new Duration with the result
   */
  public subtract(duration: Duration): Duration {
    return new Duration(this._seconds - duration._seconds)
  }

  /**
   * Returns the negation of this Duration
   * @returns A new Duration with the negated value
   */
  public negated(): Duration {
    return new Duration(-this._seconds)
  }

  /**
   * Returns the comparison of this Duration with another
   * @param other The Duration to compare with
   * @returns A bigint representing the difference, 0 == identical, > 0 if this is greater, < 0 if this is smaller
   */
  public comparedTo(other: Duration): bigint {
    return this._seconds - other._seconds
  }
  /**
   * Returns a string representation of this Duration
   * @param precision The number of decimal places to show
   * @returns A string representation of this Duration in human-readable format
   */
  public toString(precision: number = 2): string {
    return durationToString(this._seconds * 1_000_000_000n, precision)
  }

  get seconds(): bigint {
    return this._seconds
  }

  public toNumber(): number {
    return Number(this._seconds)
  }

  public toJSON() {
    return this.toString(2)
  }
}
