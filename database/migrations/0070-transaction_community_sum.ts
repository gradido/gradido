/* MIGRATION for adding community sum
 * stored in every transaction
 * increase with contributions
 * decrease with decay
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */

import { Decimal } from 'decimal.js-light'

// it is duplicate code, can we not put this decay calculation code in a extra file in database project?
// it seems it is used multiple times

// Set precision value
Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})

const DECAY_START_TIME = new Date('2021-05-13 17:46:31+00:00') // GMT+0

interface Decay {
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
  return value.mul(new Decimal('0.99999997803504048973201202316767079413460520837376').pow(seconds))
}

function calculateDecay(
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

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `community_sum` DECIMAL(40,20) NOT NULL AFTER `decay_start`;',
  )

  // go through all transactions
  const transactions = await queryFn(
    'SELECT id, amount, balance_date, type_id, community_sum FROM transactions ORDER BY balance_date ASC;',
  )
  let previous: { community_sum: Decimal; balance_date: Date } | null = null
  transactions.forEach((transaction) => {
    // first transaction
    if (!previous) {
      if (transaction.type_id !== TransactionTypeId.CREATION) {
        throw new Error("first transaction isn't a distribution transaction")
      }
      transaction.community_sum = new Decimal(transaction.amount)
    }
    // subsequent transactions
    else {
      const decay = calculateDecay(
        previous.community_sum,
        previous.balance_date,
        transaction.balance_date,
      )
      let communitySum: Decimal = decay.balance
      if (transaction.type_id === TransactionTypeId.CREATION) {
        communitySum = communitySum.plus(transaction.amount)
      }
      transaction.community_sum = communitySum
    }
    previous = transaction
    // without await, we don't need the result, it will only slow us down
    queryFn(`UPDATE transactions SET community_sum = ? where id = ?`, [
      transaction.community_sum.toString(),
      transaction.id,
    ]).catch((e) => {
      throw new Error('error on update transaction with id: ' + transaction.id.toString())
    })
  })
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */
export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `community_sum`;')
}
