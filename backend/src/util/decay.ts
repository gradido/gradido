import { getCustomRepository } from 'typeorm'
import { Decay } from '../graphql/model/Decay'
import { TransactionRepository } from '../typeorm/repository/Transaction'

function decayFormula(amount: number, seconds: number): number {
  return amount * Math.pow(0.99999997802044727, seconds) // This number represents 50% decay a year
}

async function calculateDecay(amount: number, from: Date, to: Date): Promise<number> {
  // load decay start block
  const transactionRepository = getCustomRepository(TransactionRepository)
  const decayStartBlock = await transactionRepository.findDecayStartBlock()

  // if decay hasn't started yet we return input amount
  if (!decayStartBlock) return amount

  // what happens when from > to
  // Do we want to have negative decay?
  const decayDuration = (to.getTime() - from.getTime()) / 1000
  return decayFormula(amount, decayDuration)
}

async function calculateDecayWithInterval(
  amount: number,
  from: number | Date,
  to: number | Date,
): Promise<Decay> {
  const transactionRepository = getCustomRepository(TransactionRepository)
  const decayStartBlock = await transactionRepository.findDecayStartBlock()

  const result = new Decay(undefined)
  result.balance = amount
  const fromMillis = typeof from === 'number' ? from : from.getTime()
  const toMillis = typeof to === 'number' ? to : to.getTime()
  result.decayStart = (fromMillis / 1000).toString()
  result.decayEnd = (toMillis / 1000).toString()

  // (amount, from.getTime(), to.getTime())

  // if no decay start block exist or decay startet after end date
  if (!decayStartBlock || decayStartBlock.received.getTime() > toMillis) {
    return result
  }
  const decayStartBlockMillis = decayStartBlock.received.getTime()

  // if decay start date is before start date we calculate decay for full duration
  if (decayStartBlockMillis < fromMillis) {
    result.decayDuration = toMillis - fromMillis
  }
  // if decay start in between start date and end date we caculcate decay from decay start time to end date
  else {
    result.decayDuration = toMillis - decayStartBlockMillis
    result.decayStart = (decayStartBlockMillis / 1000).toString()
  }
  // js use timestamp in milliseconds but we calculate with seconds
  result.decayDuration /= 1000
  result.balance = decayFormula(amount, result.decayDuration)
  return result
}

export { decayFormula, calculateDecay, calculateDecayWithInterval }
