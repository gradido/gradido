/* MIGRATION TO FIX WRONG BALANCE
 *
 * Due to a bug in the code
 * the amount of a receive balance is substracted
 * from the previous balance instead of added.
 *
 * Therefore all balance and decay fields must
 * be recalculated
 *
 * WARNING: This Migration must be run in TZ=UTC
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'fs'
import Decimal from 'decimal.js-light'

// Set precision value
Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})

const DECAY_START_TIME = new Date('2021-05-13 17:46:31') // GMT+0

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
  // Write log file
  const logFile = 'log/0054-recalculate_balance_and_decay.log.csv'
  await fs.writeFile(
    logFile,
    `email;first_name;last_name;affected_transactions;new_balance;new_decay;old_balance;old_decay;delta;\n`,
    (err) => {
      if (err) throw err
    },
  )

  // Find all users & loop over them
  const users = await queryFn('SELECT user_id FROM transactions GROUP BY user_id;')
  for (let u = 0; u < users.length; u++) {
    const userId = users[u].user_id
    // find all transactions for a user
    const transactions = await queryFn(
      `SELECT *, CONVERT(balance, CHAR) as dec_balance, CONVERT(decay, CHAR) as dec_decay FROM transactions WHERE user_id = ${userId} ORDER BY balance_date ASC;`,
    )
  
    let previous = null
    let affectedTransactions = 0
    let balance = new Decimal(0)
    for (let t = 0; t < transactions.length; t++) {
      const transaction = transactions[t]
      const decayStartDate = previous ? previous.balance_date : transaction.balance_date
      const amount = new Decimal(transaction.amount)
      const decay = calculateDecay(balance, decayStartDate, transaction.balance_date)
      balance = decay.balance.add(amount)

      const userContact = await queryFn(
        `SELECT email, first_name, last_name FROM users LEFT JOIN user_contacts ON users.email_id = user_contacts.id WHERE users.id = ${userId}`,
      )
      const userEmail = userContact.length === 1 ? userContact[0].email : userId
      const userFirstName = userContact.length === 1 ? userContact[0].first_name : ''
      const userLastName = userContact.length === 1 ? userContact[0].last_name : ''

      // Update if needed
      if (!balance.eq(transaction.dec_balance)) {
        await queryFn(`
          UPDATE transactions SET
            balance = ${balance},
            decay = ${decay.decay ? decay.decay : 0}
          WHERE id = ${transaction.id};
        `)
        affectedTransactions++

        // Log on last entry
        if (t === transactions.length - 1) {
          fs.appendFile(
            logFile,
            `${userEmail};${userFirstName};${userLastName};${affectedTransactions};${balance};${decay.decay ? decay.decay : 0};${transaction.dec_balance};${transaction.dec_decay};${balance.sub(transaction.dec_balance)};\n`,
            (err) => {
              if (err) throw err
            },
          )
        }
      }

      // previous
      previous = transaction
    }
  }
}

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {}
