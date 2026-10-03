import { inspect } from 'node:util'
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

  [inspect.custom]() {
    return this.toString(4)
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
   * Creates a Duration from a short time specification: a whole number followed by one unit,
   * the format of config values like `JWT_EXPIRES_IN`.
   *
   * Units: `s` seconds, `m` minutes, `h` hours, `d` days, `w` weeks. The unit is case-insensitive,
   * whitespace around the string and between number and unit is ignored.
   * Not supported: a number without unit, fractions, negative values, long unit names ("10 minutes")
   * and combinations ("1h 30m").
   *
   * @example
   * ```typescript
   * Duration.fromString('10m').seconds // 600n
   * Duration.fromString('2w').seconds // 1209600n
   * ```
   * @param durationString The time specification, e.g. "30s", "10m", "2h", "1d", "1w"
   * @returns A new Duration of that length
   * @throws Error if the string does not match the format
   */
  public static fromString(durationString: string): Duration {
    const match = durationString.trim().match(/^(\d+)\s*(s|m|h|d|w)$/i)

    if (!match) {
      throw new Error(`Unhandled duration: "${durationString}"`)
    }

    const [, value, unit] = match
    const amount = Number(value)

    switch (unit.toLowerCase()) {
      case 's':
        return Duration.seconds(amount)
      case 'm':
        return Duration.minutes(amount)
      case 'h':
        return Duration.hours(amount)
      case 'd':
        return Duration.days(amount)
      case 'w':
        return Duration.days(amount * 7)
      default:
        throw new Error(`Unhandled enum: "${unit}"`)
    }
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
    return new Duration(BigInt(minutes) * 60n)
  }

  /**
   * Creates a Duration from a number of hours
   * @param hours The number of hours
   * @returns A new Duration with the given number of hours
   */
  public static hours(hours: number): Duration {
    return new Duration(BigInt(hours) * 60n * 60n)
  }

  /**
   * Creates a Duration from a number of days
   * @param days The number of days
   * @returns A new Duration with the given number of days
   */
  public static days(days: number): Duration {
    return new Duration(BigInt(days) * 24n * 60n * 60n)
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
