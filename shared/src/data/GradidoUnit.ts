import Decimal from 'decimal.js-light'
import {
  calculateDecay as calculateDecayNative,
  gradidoUnitFromString,
  gradidoUnitToString,
  toDecimalPlaces as toDecimalPlacesNative,
} from 'shared-native'
import { DECAY_START_TIME } from '../const'
import { Decay } from '../logic/decay'
import { Duration } from './Duration'

export class GradidoUnit {
  protected gddCentValue: bigint = 0n

  // please use one of the static constructors instead
  protected constructor(value: bigint) {
    this.gddCentValue = value
  }

  public static fromNumber(value: number): GradidoUnit {
    return new GradidoUnit(BigInt(Math.round(value * 10000)))
  }

  public static fromDecimal(gdd: Decimal): GradidoUnit {
    return this.fromString(gdd.toString())
  }

  public static fromString(value: string): GradidoUnit {
    return new GradidoUnit(gradidoUnitFromString(value))
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

  public decayed(from: Date | Duration, to?: Date): GradidoUnit {
    if (from instanceof Duration) {
      return new GradidoUnit(calculateDecayNative(this.gddCentValue, from.seconds))
    } else if (from instanceof Date && to) {
      const duration = GradidoUnit.effectiveDecayDuration(from, to)
      return new GradidoUnit(calculateDecayNative(this.gddCentValue, duration.seconds))
    }
    throw new Error('Invalid parameters for decayed')
  }

  public calculateDecay(from: Date, to: Date): Decay {
    const duration = GradidoUnit.effectiveDecayDuration(from, to)
    const decay: Decay = {
      balance: this.toDecimal(),
      decay: new Decimal(0),
      roundedDecay: new Decimal(0),
      start: null,
      end: null,
      duration: Number(duration.seconds),
    }
    if (duration.seconds === 0n) {
      return decay
    }
    const balance = new GradidoUnit(calculateDecayNative(this.gddCentValue, duration.seconds))
    const decayAmount = balance.subtract(this)
    decay.start = DECAY_START_TIME.getTime() > from.getTime() ? DECAY_START_TIME : from
    decay.end = to
    decay.balance = balance.toDecimal()
    decay.decay = decayAmount.toDecimal()
    decay.roundedDecay = this.toDecimalPlaces(2)
      .subtract(balance.toDecimalPlaces(2))
      .negated()
      .toDecimal()
    return decay
  }

  public decayForDuration(duration: Duration): GradidoUnit {
    return new GradidoUnit(calculateDecayNative(this.gddCentValue, duration.seconds))
  }

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
  public toString(places: number = 2): string {
    return gradidoUnitToString(this.gddCentValue, places)
  }

  public toJSON() {
    return this.toString()
  }
}
