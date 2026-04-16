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

  public static seconds(seconds: number): Duration {
    return new Duration(BigInt(seconds))
  }

  public static minutes(minutes: number): Duration {
    return new Duration(BigInt(minutes * 60))
  }

  public static hours(hours: number): Duration {
    return new Duration(BigInt(hours * 60 * 60))
  }

  public static days(days: number): Duration {
    return new Duration(BigInt(days * 24 * 60 * 60))
  }

  public add(duration: Duration): Duration {
    return new Duration(this._seconds + duration._seconds)
  }
  public addToDate(date: Date): Date {
    return new Date(date.getTime() + Number(this._seconds * 1000n))
  }
  public subtract(duration: Duration): Duration {
    return new Duration(this._seconds - duration._seconds)
  }
  public negated(): Duration {
    return new Duration(-this._seconds)
  }

  get seconds(): bigint {
    return this._seconds
  }
  public toNumber(): number {
    return Number(this._seconds)
  }

  toString(): string {
    return this._seconds.toString()
  }
  public toJSON() {
    return `${this.toString()} seconds`
  }
}
