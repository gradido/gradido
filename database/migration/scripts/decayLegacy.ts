import Decimal from 'decimal.js-light'

// Set precision value
Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})

const DECAY_START_TIME = new Date('2021-05-13T17:46:31.000Z') // GMT+0

export interface Decay {
  balance: Decimal
  decay: Decimal | null
  start: Date | null
  end: Date | null
  duration: number | null
}

export enum TransactionTypeId {
  CREATION = 1,
  SEND = 2,
  RECEIVE = 3,
}

function decayFormula(value: Decimal, seconds: number): Decimal {
  // Decay factor per second: approximately 0.9999999780350404897
  // Results in ~50% decay over 1 year
  return value.mul(new Decimal('0.99999997803504048973201202316767079413460520837376').pow(seconds))
}

export function calculateDecayLegacy(
  amount: Decimal,
  from: Date,
  to: Date,
  startBlock: Date = DECAY_START_TIME,
): Decay {
  const fromMs = from.getTime()
  const toMs = to.getTime()
  const startBlockMs = startBlock.getTime()

  if (toMs < fromMs) {
    throw new Error('to < from, reverse decay calculation is invalid')
  }

  // Initialize with no decay
  const decay: Decay = {
    balance: amount,
    decay: null,
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
    decay.start = startBlock
    decay.duration = (toMs - startBlockMs) / 1000
  }

  decay.end = to
  decay.balance = decayFormula(amount, decay.duration)
  decay.decay = decay.balance.minus(amount)
  return decay
}
