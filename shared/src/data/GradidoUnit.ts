import Decimal from 'decimal.js-light'
import {
  calculateDecay as calculateDecayNative,
  gradidoUnitFromString,
  gradidoUnitToString,
  toDecimalPlaces as toDecimalPlacesNative,
} from 'shared-native'
import { DECAY_START_TIME } from '../const'
import { Decay } from '../schema'
import { Duration } from './Duration'

export class GradidoUnit {
  protected gddCentValue: bigint = 0n

  constructor(value: bigint) {
    this.gddCentValue = value
  }

  public static fromNumber(value: number): GradidoUnit {
    return new GradidoUnit(BigInt(Math.round(value * 10000)))
  }

  public static fromDecimal(gdd: Decimal): GradidoUnit {
    return this.fromString(gdd.toString())
  }

  public static fromString(value: string): GradidoUnit {
    return new GradidoUnit(BigInt(gradidoUnitFromString(value)))
  }

  /**
   * construct from non decimal value, e.g. 10000n = 1.0000 gdd
   */
  public static fromGradidoCent(gddCent: bigint): GradidoUnit {
    return new GradidoUnit(gddCent)
  }

  get gddCent(): bigint {
    return this.gddCentValue
  }

  /**
   * Computes the effective decay duration between two dates, taking into account
   * a predefined decay start time.
   *
   * This function ensures that decay is only measured from the official start point
   * onward. If the end date precedes the start date, the calculation will not allow
   * time travel and throws an error. If the decay start time lies after the end date,
   * the effective duration is zero (no premature decay allowed).
   * If the decay start time falls within the period, it calculates the duration
   * from the decay start time to the end date; otherwise, it simply returns the
   * duration between the provided dates.
   *
   * @param from The beginning of the period to consider
   * @param to The end of the period to consider
   * @throws Error if to < from
   * @returns The effective decay duration as a Duration object
   */
  public static effectiveDecayDuration(from: Date, to: Date): Duration {
    const fromMs = from.getTime()
    const toMs = to.getTime()
    const startBlockMs = DECAY_START_TIME.getTime()

    if (toMs < fromMs) {
      throw new Error('effectiveDecayDuration: to < from, reverse decay calculation is invalid')
    }

    if (startBlockMs > toMs) {
      return new Duration(0n)
    }

    if (startBlockMs < fromMs) {
      return Duration.fromDateDiff(from, to)
    }

    return Duration.fromDateDiff(DECAY_START_TIME, to)
  }

  /**
   * Calculates the decayed value of this GradidoUnit based on the given time period.
   *
   * @param fromOrDuration The start time or duration to calculate decay from
   * @param to The end time (required if fromOrDuration is a Date)
   * @returns A new GradidoUnit representing the decayed value
   */
  public decayed(fromOrDuration: Date | Duration, to?: Date): GradidoUnit {
    if (fromOrDuration instanceof Duration) {
      return new GradidoUnit(calculateDecayNative(this.gddCentValue, fromOrDuration.seconds))
    } else if (fromOrDuration instanceof Date) {
      if (!to) {
        throw new Error('to is required when fromOrDuration is a Date')
      }
      const duration = GradidoUnit.effectiveDecayDuration(fromOrDuration, to)
      return new GradidoUnit(calculateDecayNative(this.gddCentValue, duration.seconds))
    }
    throw new Error('Invalid parameters for decayed')
  }

  /**
   * Calculates the decay for this GradidoUnit over a given time period.
   *
   * @param from The start time of the decay period
   * @param to The end time of the decay period
   * @returns A Decay object containing the original balance, decay amount, and time period
   */
  public calculateDecay(from: Date, to: Date): Decay {
    const duration = GradidoUnit.effectiveDecayDuration(from, to)
    const decay: Decay = {
      balance: this,
      decay: new GradidoUnit(0n),
      start: null,
      end: null,
      duration: duration,
    }
    if (duration.seconds === 0n) {
      return decay
    }
    decay.start = DECAY_START_TIME.getTime() > from.getTime() ? DECAY_START_TIME : from
    decay.end = to
    decay.balance = new GradidoUnit(calculateDecayNative(this.gddCentValue, duration.seconds))
    decay.decay = decay.balance.subtract(this)
    return decay
  }

  /**
   * Rounds the GradidoUnit to a specified number of decimal places.
   *
   * @param places The number of decimal places to round to
   * @returns A new GradidoUnit with the rounded value
   */
  public toDecimalPlaces(places: number): GradidoUnit {
    return new GradidoUnit(toDecimalPlacesNative(this.gddCentValue, places))
  }

  /**
   * Computes the initial Gradido amount required so that after applying decay
   * over a given period, the remaining balance equals the current amount.
   *
   * This is effectively the "reverse decay" calculation: instead of asking
   * how much a balance decays over time, it answers the question:
   * "How much do I need to start with so that after decay I end up with this balance?"
   * Used by Transaction Links to calculate the required initial amount.
   *
   * @param from The starting point of the period for the reverse decay calculation or the duration
   * @param to [Optional] The end point of the period for the reverse decay calculation.
   *            If not provided, from needs to be a duration
   * @returns A new GradidoUnit representing the required initial amount
   */
  public requiredBeforeDecay(from: Date | Duration, to?: Date): GradidoUnit {
    if (from instanceof Duration) {
      return new GradidoUnit(calculateDecayNative(this.gddCentValue, -from.seconds))
    } else if (from instanceof Date && to) {
      const duration = GradidoUnit.effectiveDecayDuration(from, to)
      return new GradidoUnit(calculateDecayNative(this.gddCentValue, -duration.seconds))
    }
    throw new Error('Invalid parameters for requiredBeforeDecay')
  }

  /**
   * Subtract another GradidoUnit from this one
   * @param other The GradidoUnit to subtract
   * @returns A new GradidoUnit with the result
   */
  public subtract(other: GradidoUnit): GradidoUnit {
    return new GradidoUnit(this.gddCentValue - other.gddCentValue)
  }

  /**
   * Add another GradidoUnit to this one
   * @param other The GradidoUnit to add
   * @returns A new GradidoUnit with the result
   */
  public add(other: GradidoUnit): GradidoUnit {
    return new GradidoUnit(this.gddCentValue + other.gddCentValue)
  }

  /**
   * Returns the comparison of this GradidoUnit with another
   * @param other The GradidoUnit to compare with
   * @returns A bigint representing the difference, 0 == identical, > 0 if this is greater, < 0 if this is smaller
   */
  public comparedTo(other: GradidoUnit): bigint {
    return this.gddCentValue - other.gddCentValue
  }

  /**
   * Returns the negation of this GradidoUnit
   * @returns A new GradidoUnit with the negated value
   */
  public negated(): GradidoUnit {
    return new GradidoUnit(-this.gddCentValue)
  }

  /**
   * Returns the absolute value of this GradidoUnit
   * @returns A new GradidoUnit with the absolute value
   */
  public abs(): GradidoUnit {
    if (this.gddCentValue < 0) {
      return new GradidoUnit(-this.gddCentValue)
    }
    return new GradidoUnit(this.gddCentValue)
  }

  public toDecimal(): Decimal {
    return new Decimal(this.gddCentValue.toString()).div(10000)
  }
  public toNumber(): number {
    return Number(this.gddCentValue) / 10000
  }

  /**
   * Converts the GradidoUnit to a string representation
   * @param places The number of decimal places to include (default: 2)
   * @param keepTrailingZeros Whether to keep trailing zeros (default: false) or remove them like Decimal.js does it
   * @returns A string representation of the GradidoUnit
   */
  public toString(places = 2, keepTrailingZeros = false): string {
    if (keepTrailingZeros) {
      return gradidoUnitToString(this.gddCentValue, places)
    } else {
      return this.toStringSmart(places)
    }
  }
  /**
   * Mirror Decimal.toString which will remove trailing zeros
   * @param maxPlaces
   */
  public toStringSmart(maxPlaces: number = 2): string {
    const str = gradidoUnitToString(this.gddCentValue, maxPlaces)
    // remove trailing zeros
    const trimmed = str.replace(/0+$/, '')
    return trimmed.replace(/\.$/, '')
  }

  public toJSON() {
    return this.toString()
  }
}
