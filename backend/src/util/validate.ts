import { User as dbUser } from '@entity/User'
import { Balance as dbBalance } from '@entity/Balance'
import { getRepository } from 'typeorm'
import { calculateDecay } from './decay'

function isStringBoolean(value: string): boolean {
  const lowerValue = value.toLowerCase()
  if (lowerValue === 'true' || lowerValue === 'false') {
    return true
  }
  return false
}

function isHexPublicKey(publicKey: string): boolean {
  return /^[0-9A-Fa-f]{64}$/i.test(publicKey)
}

async function hasUserAmount(user: dbUser, amount: number): Promise<boolean> {
  if (amount < 0) return false
  const balanceRepository = getRepository(dbBalance)
  const balance = await balanceRepository.findOne({ userId: user.id })
  if (!balance) return false

  const decay = await calculateDecay(balance.amount, balance.recordDate, new Date())
  return decay > amount
}

export { isHexPublicKey, hasUserAmount, isStringBoolean }
