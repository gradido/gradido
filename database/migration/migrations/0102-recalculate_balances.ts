import { DecayCalculationType, GradidoUnit } from 'shared'
import { calculateDecay } from 'shared-native'

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Find all users & loop over them
  const runningRequests: Promise<Array<any>>[] = []
  const users = await queryFn('SELECT id FROM users')
  let countDiffs = 0
  for (let u = 0; u < users.length; u++) {
    process.stdout.write(`Recalculating balances for user ${u}/${users.length}\r`)
    // find all transactions for a user
    const transactions = await queryFn(
      `
       SELECT id, amount_gdd4, balance_gdd4, balance_legacy, decay_gdd4, balance_date
       FROM transactions
       WHERE user_id = ?
       ORDER BY balance_date ASC, id ASC
       ;
    `,
      [users[u].id],
    )

    let previous = null
    let balance = 0n
    const transactionsToUpdate: string[] = []

    for (let t = 0; t < transactions.length; t++) {
      const transaction = transactions[t]
      const amount = BigInt(transaction.amount_gdd4)
      let decay = 0n
      if (balance > 0n && previous) {
        const decayedBalance = calculateDecay(
          balance,
          GradidoUnit.effectiveDecayDuration(previous.balance_date, transaction.balance_date)
            .seconds,
        )
        decay = decayedBalance - balance
        balance = decayedBalance
      } else if (balance <= 0n) {
        if (balance < 0) {
          // biome-ignore lint/suspicious/noConsole: no logger in migration
          console.warn(
            `set negative balance: ${balance.toString()} for transaction: ${transaction.id} to zero.`,
          )
        }
        balance = 0n
      }
      balance += amount
      if (!transaction.balance_gdd4 || BigInt(transaction.balance_gdd4) !== balance) {
        countDiffs++
        transactionsToUpdate.push(
          `UPDATE transactions
           SET balance_gdd4 = '${balance.toString()}',
               decay_gdd4 = '${decay.toString()}'
           WHERE id = ${transaction.id}
           ;
        `,
        )
        previous = transaction
      }
    }
    if (transactionsToUpdate.length) {
      runningRequests.push(queryFn(transactionsToUpdate.join('\n')))
    }
  }
  await Promise.all(runningRequests)
  await queryFn(`UPDATE transactions set decay_calculation_type = ?`, [
    DecayCalculationType.NATIVE_C_FIXED_FACTOR_INTEGER,
  ])
  process.stdout.write(`\n`)
  // biome-ignore lint/suspicious/noConsole: no logger present
  console.log(`${countDiffs} updated transactions`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    UPDATE transactions
    SET balance_gdd4 = CAST(ROUND(balance_legacy * 10000) AS SIGNED),
        decay_gdd4 = CAST(ROUND(decay_legacy * 10000) AS SIGNED); `)
  await queryFn(
    `UPDATE transactions set decay_calculation_type = ${DecayCalculationType.DECIMAL_JS_FIXED_FACTOR}`,
  )
}
