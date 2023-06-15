/* MIGRATION TO INTRODUCE THE DECIMAL TYPE
 *
 * This migration adds fields of type DECIMAL
 * and corrects the corresponding values of
 * each by recalculating the history of all
 * user transactions.
 *
 * Furthermore it increases precision of the
 * stored values and stores additional data
 * points to avoid repetitive calculations.
 *
 * It will also add a link to the last
 * transaction, creating a linked list
 *
 * And it will convert all timestamps to
 * datetime.
 *
 * WARNING: This Migration must be run in TZ=UTC
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import Decimal from 'decimal.js-light'

// Set precision value
Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})

const DECAY_START_TIME = new Date('2021-05-13 17:46:31') // GMT+0

// TODO: externalize all those definitions and functions into an external decay library
interface Decay {
  balance: Decimal
  decay: Decimal | null
  start: Date | null
  end: Date | null
  duration: number | null
}

/* eslint-disable no-unused-vars */
export enum TransactionTypeId {
  CREATION = 1,
  SEND = 2,
  RECEIVE = 3,
}
/* eslint-enable no-unused-vars */

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
  // Add Columns

  // add column `previous` for a link to the previous transaction
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `previous` int(10) unsigned DEFAULT NULL AFTER `user_id`;',
  )
  // add column `dec_amount` with temporary NULL and DEFAULT NULL definition
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `dec_amount` DECIMAL(40,20) NULL DEFAULT NULL AFTER `type_id`;',
  )
  // add column `dec_balance` with temporary NULL and DEFAULT NULL definition
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `dec_balance` DECIMAL(40,20) NULL DEFAULT NULL AFTER `dec_amount`;',
  )
  // add new column `dec_decay` with temporary NULL and DEFAULT NULL definition
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `dec_decay` DECIMAL(40,20) NULL DEFAULT NULL AFTER `dec_balance`;',
  )
  // add new column `decay_start`
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `decay_start` datetime DEFAULT NULL AFTER `dec_decay`;',
  )

  // Modify columns

  // modify date type of `balance_date` to datetime
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `balance_date` datetime NOT NULL DEFAULT current_timestamp() AFTER `dec_balance`;',
  )
  // modify date type of `creation_date` to datetime
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `creation_date` datetime DEFAULT NULL AFTER `balance`;',
  )

  // Temporary columns

  // temporary decimal column `temp_dec_send_sender_final_balance`
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `temp_dec_send_sender_final_balance` DECIMAL(40,20) NULL DEFAULT NULL AFTER `linked_transaction_id`;',
  )
  // temporary decimal column `temp_dec_diff_send_sender_final_balance`
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `temp_dec_diff_send_sender_final_balance` DECIMAL(40,20) NULL DEFAULT NULL AFTER `temp_dec_send_sender_final_balance`;',
  )
  // temporary decimal column `temp_dec_old_balance`
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `temp_dec_old_balance` DECIMAL(40,20) NULL DEFAULT NULL AFTER `temp_dec_diff_send_sender_final_balance`;',
  )
  // temporary decimal column `temp_dec_diff_balance`
  await queryFn(
    'ALTER TABLE `transactions` ADD COLUMN `temp_dec_diff_balance` DECIMAL(40,20) NULL DEFAULT NULL AFTER `temp_dec_old_balance`;',
  )

  // Find all users & loop over them
  const users = await queryFn('SELECT user_id FROM transactions GROUP BY user_id')
  for (let u = 0; u < users.length; u++) {
    // find all transactions for a user
    const transactions = await queryFn(
      `SELECT * FROM transactions WHERE user_id = ${users[u].user_id} ORDER BY balance_date ASC;`,
    )
    let previous = null
    let balance = new Decimal(0)
    for (let t = 0; t < transactions.length; t++) {
      const transaction = transactions[t]

      // This should also fix the rounding error on amount
      let decAmount = new Decimal(transaction.amount).dividedBy(10000).toDecimalPlaces(2)
      if (transaction.type_id === TransactionTypeId.SEND) {
        decAmount = decAmount.mul(-1)
      }
      const decayStartDate = previous ? previous.balance_date : transaction.balance_date
      const decay = calculateDecay(balance, decayStartDate, transaction.balance_date)
      // WARNING: `toISOString()` needs UTC Timezone to work properly!
      const decayStart =
        previous && decay.start
          ? '"' + decay.start.toISOString().slice(0, 19).replace('T', ' ') + '"'
          : null
      balance = decay.balance.add(decAmount)
      const tempDecSendSenderFinalBalance = transaction.send_sender_final_balance
        ? new Decimal(transaction.send_sender_final_balance).dividedBy(10000)
        : null
      const tempDecDiffSendSenderFinalBalance = tempDecSendSenderFinalBalance
        ? balance.minus(tempDecSendSenderFinalBalance)
        : null
      const tempDecOldBalance = new Decimal(transaction.balance).dividedBy(10000)
      const tempDecDiffBalance = balance.minus(tempDecOldBalance)

      // Update
      await queryFn(`
        UPDATE transactions SET
          previous = ${previous ? previous.id : null},
          dec_amount = ${decAmount.toString()},
          dec_balance = ${balance.toString()},
          dec_decay = ${decay.decay ? decay.decay.toString() : '0'},
          decay_start = ${decayStart},
          temp_dec_send_sender_final_balance = ${
            tempDecSendSenderFinalBalance ? tempDecSendSenderFinalBalance.toString() : null
          },
          temp_dec_diff_send_sender_final_balance = ${
            tempDecDiffSendSenderFinalBalance ? tempDecDiffSendSenderFinalBalance.toString() : null
          },
          temp_dec_old_balance = ${tempDecOldBalance.toString()},
          temp_dec_diff_balance = ${tempDecDiffBalance.toString()}
        WHERE id = ${transaction.id};
      `)

      // previous
      previous = transaction
    }
  }

  // Remove null as value & default value from `dec_amount`, `dec_balance` and `dec_decay`
  await queryFn('ALTER TABLE `transactions` MODIFY COLUMN `dec_amount` DECIMAL(40,20) NOT NULL;')
  await queryFn('ALTER TABLE `transactions` MODIFY COLUMN `dec_balance` DECIMAL(40,20) NOT NULL;')
  await queryFn('ALTER TABLE `transactions` MODIFY COLUMN `dec_decay` DECIMAL(40,20) NOT NULL;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `temp_dec_diff_balance`')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `temp_dec_old_balance`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `temp_dec_diff_send_sender_final_balance`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `temp_dec_send_sender_final_balance`;')
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `creation_date` timestamp NULL DEFAULT NULL AFTER `balance`;',
  )
  await queryFn(
    'ALTER TABLE `transactions` MODIFY COLUMN `balance_date` timestamp NOT NULL DEFAULT current_timestamp() AFTER `dec_balance`;',
  )
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `decay_start`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `dec_decay`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `dec_balance`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `dec_amount`;')
  await queryFn('ALTER TABLE `transactions` DROP COLUMN `previous`;')
}
