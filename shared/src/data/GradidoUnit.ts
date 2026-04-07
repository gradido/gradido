import Decimal from 'decimal.js-light'
import { getLogger } from 'log4js'
import { calculateDecay as calculateDecayNative, fromString as fromStringNative, toString as toStringNative } from 'shared-native'
import { DECAY_START_TIME, LOG4JS_BASE_CATEGORY_NAME } from '../const'
import { Decay } from '../schema'
import { Duration } from './Duration'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.data.GradidoUnit`)

export class GradidoUnit {
  protected gddCentValue: bigint = 0n

  constructor(value: bigint) {
    this.gddCentValue = value
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

  public decayed(from: Date, to: Date): GradidoUnit {
    const duration = GradidoUnit.effectiveDecayDuration(from, to)
    return new GradidoUnit(calculateDecayNative(this.gddCentValue, duration.seconds))
  }

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
   * Computes the initial Gradido amount required so that after applying decay
   * over a given period, the remaining balance equals the current amount.
   *
   * This is effectively the "reverse decay" calculation: instead of asking
   * how much a balance decays over time, it answers the question:
   * "How much do I need to start with so that after decay I end up with this balance?"
   * Used by Transaction Links to calculate the required initial amount.
   *
   * @param from The starting point of the period for the reverse decay calculation
   * @param to The end point of the period for the reverse decay calculation
   * @returns A GradidoUnit representing the required initial amount
   */
  public requiredBeforeDecay(from: Date, to: Date): GradidoUnit {
    const duration = GradidoUnit.effectiveDecayDuration(from, to)
    return new GradidoUnit(calculateDecayNative(this.gddCentValue, -duration.seconds))
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

  public static fromNumber(value: number): GradidoUnit {
    return new GradidoUnit(BigInt(Math.round(value * 10000)))
  }

  /**
   * @deprecated best construct from gddCent directly or use fromNumber
   */
  public static fromDecimal(gdd: Decimal): GradidoUnit {
    return new GradidoUnit(BigInt(gdd.mul(10000).toDecimalPlaces(0, Decimal.ROUND_DOWN).toString()))
  }

  public static fromString(value: string): GradidoUnit {
    return new GradidoUnit(fromStringNative(value))
  }

  /**
   * @deprecated best use gddCent directly or use toNumber
   */
  public toDecimal(): Decimal {
    return new Decimal(this.gddCentValue.toString()).div(10000)
  }
  public toNumber(): number {
    return Number(this.gddCentValue) / 10000
  }
  public toString(places: number = 4): string {
    return toStringNative(this.gddCentValue, places)
  }
}
