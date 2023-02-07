import Decimal from 'decimal.js-light'
import CONFIG from '@/config'
import { Decay } from '@model/Decay'
import LogError from '@/server/LogError'

// TODO: externalize all those definitions and functions into an external decay library

function decayFormula(value: Decimal, seconds: number): Decimal {
  // TODO why do we need to convert this here to a stting to work properly?
  return value.mul(
    new Decimal('0.99999997803504048973201202316767079413460520837376').pow(seconds).toString(),
  )
}

function calculateDecay(
  amount: Decimal,
  from: Date,
  to: Date,
  startBlock: Date = CONFIG.DECAY_START_TIME,
): Decay {
  const fromMs = from.getTime()
  const toMs = to.getTime()
  const startBlockMs = startBlock.getTime()

  if (toMs < fromMs) {
    throw new LogError('calculateDecay: to < from, reverse decay calculation is invalid')
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
    decay.start = startBlock
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

export { decayFormula, calculateDecay }
