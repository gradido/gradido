import { Decay } from '../graphql/models/Decay'

function decayFormula(amount: number, durationInSeconds: number): number {
  return amount * Math.pow(0.99999997802044727, durationInSeconds)
}

async function calculateDecay(amount: number, from: Date, to: Date): Promise<number> {
  // load decay start block
  const decayStartBlock = await Decay.getDecayStartBlock()

  // if decay hasn't started yet we return input amount
  if (!decayStartBlock) return amount

  const decayDuration = (to.getTime() - from.getTime()) / 1000
  return decayFormula(amount, decayDuration)
}

async function calculateDecayWithInterval(
  amount: number,
  from: number | Date,
  to: number | Date,
): Promise<Decay> {
  const decayStartBlock = await Decay.getDecayStartBlock()
  const result = new Decay(undefined)
  result.balance = amount
  const fromMillis = typeof from === 'number' ? from : from.getTime()
  const toMillis = typeof to === 'number' ? to : to.getTime()
  result.decayStart = (fromMillis / 1000).toString()
  result.decayEnd = (toMillis / 1000).toString()

  // (amount, from.getTime(), to.getTime())

  // if no decay start block exist or decay startet after end date
  if (decayStartBlock === undefined || decayStartBlock.received.getTime() > toMillis) {
    return result
  }

  // if decay start date is before start date we calculate decay for full duration
  if (decayStartBlock.received.getTime() < fromMillis) {
    result.decayDuration = toMillis - fromMillis
  }
  // if decay start in between start date and end date we caculcate decay from decay start time to end date
  else {
    result.decayDuration = toMillis - decayStartBlock.received.getTime()
  }
  // js use timestamp in milliseconds but we calculate with seconds
  result.decayDuration /= 1000
  result.balance = decayFormula(amount, result.decayDuration)
  return result
}

export { calculateDecay, calculateDecayWithInterval }
