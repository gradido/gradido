/**
 * Immutable time duration represented in seconds (bigint precision).
 *
 *
 * @example
 * ```typescript
 * const duration = Duration.days(1n).add(Duration.hours(2n).add(Duration.minutes(3n).add(Duration.seconds(4n))))
 * console.log(duration.seconds) // 93784n
 * ```
 */
export class Duration {
  protected _seconds: bigint

  constructor(seconds: bigint) {
    this._seconds = seconds
  }

  public static fromDateDiff(from: Date, to: Date): Duration {
    return new Duration(BigInt(Math.floor((to.getTime() - from.getTime()) / 1000)))
  }

  public static seconds(seconds: bigint): Duration {
    return new Duration(seconds)
  }

  public static minutes(minutes: bigint): Duration {
    return new Duration(minutes * 60n)
  }

  public static hours(hours: bigint): Duration {
    return new Duration(hours * 60n * 60n)
  }

  public static days(days: bigint): Duration {
    return new Duration(days * 24n * 60n * 60n)
  }

  public add(duration: Duration): Duration {
    return new Duration(this._seconds + duration._seconds)
  }
  public subtract(duration: Duration): Duration {
    return new Duration(this._seconds - duration._seconds)
  }

  get seconds(): bigint {
    return this._seconds
  }

  toString(): string {
    return this._seconds.toString()
  }
  public toJSON() {
    return `${this.toString()} seconds`
  }
}
