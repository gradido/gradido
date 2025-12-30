import { Decimal } from 'decimal.js-light'

import { DECAY_FACTOR, DECAY_START_TIME, SECONDS_PER_YEAR_GREGORIAN_CALENDER } from '../const'

Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})

export interface Decay {
  balance: Decimal
  decay: Decimal
  roundedDecay: Decimal
  start: Date | null
  end: Date | null
  duration: number | null
}

// legacy decay formula
export function decayFormula(value: Decimal, seconds: number): Decimal {
  // TODO why do we need to convert this here to a string to work properly?
  // chatgpt: We convert to string here to avoid precision loss:
  //          .pow(seconds) can internally round the result, especially for large values of `seconds`.
  //          Using .toString() ensures full precision is preserved in the multiplication.
  return value.mul(
    DECAY_FACTOR.pow(seconds).toString(),
  )
}

// legacy reverse decay formula
export function reverseLegacyDecay(result: Decimal, seconds: number): Decimal {
  return result.div(DECAY_FACTOR.pow(seconds).toString())
}

// fast and more correct decay formula
export function decayFormulaFast(value: Decimal, seconds: number): Decimal {
  return value.mul(
    new Decimal(2).pow(new Decimal(-seconds).div(new Decimal(SECONDS_PER_YEAR_GREGORIAN_CALENDER))),
  )
}

// compound interest formula, the reverse decay formula for decayFormulaFast
export function compoundInterest(value: Decimal, seconds: number): Decimal {
  return value.mul(
    new Decimal(2).pow(new Decimal(seconds).div(new Decimal(SECONDS_PER_YEAR_GREGORIAN_CALENDER))),
  )
}

export function calculateDecay(amount: Decimal, from: Date, to: Date): Decay {
  const fromMs = from.getTime()
  const toMs = to.getTime()
  const startBlockMs = DECAY_START_TIME.getTime()

  if (toMs < fromMs) {
    // TODO: refactor, use custom Error Classes which contain context variables
    throw new Error('calculateDecay: to < from, reverse decay calculation is invalid')
  }

  // Initialize with no decay
  const decay: Decay = {
    balance: amount,
    decay: new Decimal(0),
    roundedDecay: new Decimal(0),
    start: null,
    end: null,
    duration: null,
  }

  // decay started after end date; no decay
  if (startBlockMs > toMs) {
    return decay
  }
  // decay started before start date; decay for full duration
  if (startBlockMs < fromMs) {
    decay.start = from
    decay.duration = (toMs - fromMs) / 1000
  }
  // decay started between start and end date; decay from decay start till end date
  else {
    decay.start = DECAY_START_TIME
    decay.duration = (toMs - startBlockMs) / 1000
  }

  decay.end = to
  decay.balance = decayFormula(amount, decay.duration)
  decay.decay = decay.balance.minus(amount)
  decay.roundedDecay = amount
    .toDecimalPlaces(2, Decimal.ROUND_DOWN)
    .minus(decay.balance.toDecimalPlaces(2, Decimal.ROUND_DOWN).toString())
    .mul(-1)
  return decay
}
