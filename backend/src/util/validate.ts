import { calculateDecay } from './decay'
import Decimal from 'decimal.js-light'
import { Transaction } from '@entity/Transaction'
import { Decay } from '@model/Decay'
import { getCustomRepository } from '@dbTools/typeorm'
import { TransactionLinkRepository } from '@repository/TransactionLink'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { decimalSubtraction, decimalAddition } from './utilities'
import { logger } from '@test/testSetup'

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

async function calculateBalance(
  userId: number,
  amount: Decimal,
  time: Date,
  transactionLink?: dbTransactionLink | null,
): Promise<{ balance: Decimal; decay: Decay; lastTransactionId: number }> {
  // negative or empty amount should not be allowed
  if (amount.lessThanOrEqualTo(0)) {
    logger.error(`Transaction amount must be greater than 0: ${amount}`)
    throw new Error('Transaction amount must be greater than 0')
  }

  // check if user has prior transactions
  const lastTransaction = await Transaction.findOne({ userId }, { order: { balanceDate: 'DESC' } })

  if (!lastTransaction) {
    logger.error(`No prior transaction found for user with id: ${userId}`)
    throw new Error('User has not received any GDD yet')
  }

  const decay = calculateDecay(lastTransaction.balance, lastTransaction.balanceDate, time)

  // new balance is the old balance minus the amount used
  const balance = decimalSubtraction(decay.balance, amount)

  const transactionLinkRepository = getCustomRepository(TransactionLinkRepository)
  const { sumHoldAvailableAmount } = await transactionLinkRepository.summary(userId, time)

  // If we want to redeem a link we need to make sure that the link amount is not considered as blocked
  // else we cannot redeem links which are more or equal to half of what an account actually owns
  const releasedLinkAmount = transactionLink ? transactionLink.holdAvailableAmount : new Decimal(0)

  const availableBalance = decimalSubtraction(balance, sumHoldAvailableAmount)

  if (decimalAddition(availableBalance, releasedLinkAmount).lessThan(0)) {
    logger.error(
      `Not enough funds for a transaction of ${amount} GDD, user with id: ${userId} has only ${balance} GDD available`,
    )
    throw new Error('Not enough funds for transaction')
  }

  logger.debug(`calculated Balance=${balance}`)
  return { balance, lastTransactionId: lastTransaction.id, decay }
}

export { isHexPublicKey, calculateBalance, isStringBoolean }
