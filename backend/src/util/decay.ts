import CONFIG from '../config'
import { Decay } from '../graphql/model/Decay'

function decayFormula(amount: number, seconds: number): number {
  return amount * Math.pow(0.99999997802044727, seconds) // This number represents 50% decay a year
}

function calculateDecay(amount: number, from: Date, to: Date): Decay {
  const fromMs = from.getTime()
  const toMs = to.getTime()
  const decayStartBlockMs = CONFIG.DECAY_START_TIME.getTime()

  if (toMs < fromMs) {
    throw new Error('to < from, reverse decay calculation is invalid')
  }

  // Initialize with no decay
  const decay = new Decay({
    balance: amount,
    decayStart: null,
    decayEnd: null,
    decayDuration: 0,
    decayStartBlock: (decayStartBlockMs / 1000).toString(),
  })

  // decay started after end date; no decay
  if (decayStartBlockMs > toMs) {
    return decay
  }
  // decay started before start date; decay for full duration
  else if (decayStartBlockMs < fromMs) {
    decay.decayStart = (fromMs / 1000).toString()
    decay.decayDuration = (toMs - fromMs) / 1000
  }
  // decay started between start and end date; decay from decay start till end date
  else {
    decay.decayStart = (decayStartBlockMs / 1000).toString()
    decay.decayDuration = (toMs - decayStartBlockMs) / 1000
  }

  decay.decayEnd = (toMs / 1000).toString()
  decay.balance = decayFormula(amount, decay.decayDuration)
  return decay
}

export { decayFormula, calculateDecay }
