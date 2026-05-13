import { CONFIG } from '../../src/config'
import { drizzle, MySql2Database, MySql2QueryResultHKT } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { contributionsTable, dltTransactionsTable, eventsTable, transactionsTable } from './drizzle.schema'
import { ne, or, isNull, isNotNull, and, eq, gt, asc, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'
import Decimal from 'decimal.js-light'
import { GradidoUnit } from 'shared'
import { z } from 'zod/v3'
import { calculateDecayLegacy } from './decayLegacy'

export const transactionSchema = z.object({
  id: z.number().int().positive(),
  amount: z.bigint(),  
  amountFull: z.string(),
  decay: z.bigint(),
  decayFull: z.string(),
  balance: z.bigint(),
  balanceFull: z.string(),
  balanceDate: z.coerce.date(),
})

type Transaction = z.infer<typeof transactionSchema>;


function calculateBalance(
  currentTransaction: Transaction,
  lastTransaction: Transaction | null,
): { balance: bigint, decay: bigint } {

  if (!lastTransaction) {
    // first transaction
    if (currentTransaction.amount < 0n) {
      throw new Error('invalid tx, amount_gdd4 is negative for first tx')
    }
    return {
      balance: currentTransaction.amount,
      decay: 0n
    }
  } else {    
    // update balance with decay
    const lastTransactionBalance = GradidoUnit.fromGradidoCent(lastTransaction.balance)
    const decay = lastTransactionBalance.calculateDecay(lastTransaction.balanceDate, currentTransaction.balanceDate)
    const newBalance = decay.balance.add(GradidoUnit.fromGradidoCent(currentTransaction.amount))
    
    return {
      balance: newBalance.gddCent,
      decay: decay.decay.gddCent
    }
  }
}

function calculateLegacyBalance(
  currentTransaction: Transaction,
  lastTransaction: Transaction | null,
): { balanceFull: string, decayFull: string } {
  if (!lastTransaction) {
    // first transaction
    if (new Decimal(currentTransaction.amountFull).lessThanOrEqualTo(0)) {
      throw new Error('invalid tx, amount_gdd4 is negative for first tx')
    }
    return {
      balanceFull: currentTransaction.amountFull,
      decayFull: '0'
    }
  } else {    
    // update balance with decay
    const lastTransactionBalance = new Decimal(lastTransaction.balanceFull)
    const decay = calculateDecayLegacy(lastTransactionBalance, lastTransaction.balanceDate, currentTransaction.balanceDate)
    const newBalance = decay.balance.add(new Decimal(currentTransaction.amountFull))
    
    return {
      balanceFull: newBalance.toString(),
      decayFull: decay.decay?.toString() || '0'
    }
  }
}


async function updateTransactionIds(db: MySql2Database, removedTransactionId: number): Promise<void[]> {
  const updates: Promise<any>[] = []
  // update transaction ids in transactions table
  updates.push(
    db.update(transactionsTable)
      .set({
        id: sql`${transactionsTable.id} - 1`
      })
      .where(gt(transactionsTable.id, removedTransactionId))
      .orderBy(asc(transactionsTable.id))
  )

  // update previous transaction ids in transactions table
  updates.push(
    db.update(transactionsTable)
      .set({
        previous: sql`${transactionsTable.previous} - 1`
      })
      .where(gt(transactionsTable.previous, removedTransactionId))
      .orderBy(asc(transactionsTable.previous))
  )

  // update transaction ids in contributions table
  updates.push(
    db.update(contributionsTable)
    .set({
      transactionId: sql`${contributionsTable.transactionId} - 1`
    })
    .where(gt(contributionsTable.transactionId, removedTransactionId))
    .orderBy(asc(contributionsTable.transactionId))
  )

  // update transaction ids in events table
  updates.push(
    db.update(eventsTable)
    .set({
      involvedTransactionId: sql`${eventsTable.involvedTransactionId} - 1`
    })
    .where(and(gt(eventsTable.involvedTransactionId, removedTransactionId), isNotNull(eventsTable.involvedTransactionId)))
    .orderBy(asc(eventsTable.involvedTransactionId))
  )

  // update transaction ids in dlt transactions table
  updates.push(
    db.update(dltTransactionsTable)
    .set({
      transactionId: sql`${dltTransactionsTable.transactionId} - 1`
    })
    .where(and(gt(dltTransactionsTable.transactionId, removedTransactionId), isNotNull(dltTransactionsTable.transactionId)))
    .orderBy(asc(dltTransactionsTable.transactionId))
  )
  
  return Promise.all(updates)
}


async function updateUserBalance(
  db: MySql2Database,
  transaction: typeof transactionsTable.$inferSelect, 
  previousTransaction: typeof transactionsTable.$inferSelect | null
): Promise<any[]> {
  const userId = transaction.userId
    if (!userId) {
      throw new Error('invalid tx, missing user id')
    }
  const userTransactions = await db.select()
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        gt(transactionsTable.id, transaction.id)
      )
    )
    .orderBy(asc(transactionsTable.balanceDate))

  let lastTransaction = previousTransaction
  const updatePromises: Promise<any>[] = []
  for (const userTransaction of userTransactions) {    
    const currentTransactionValidated = transactionSchema.parse(userTransaction)
    const lastTransactionValidated = lastTransaction ? transactionSchema.parse(lastTransaction) : null
    
    const { balance, decay } = calculateBalance(currentTransactionValidated, lastTransactionValidated)
    const { balanceFull, decayFull } = calculateLegacyBalance(currentTransactionValidated, lastTransactionValidated)
   
    userTransaction.balance = balance
    userTransaction.balanceFull = balanceFull
    userTransaction.decay = decay
    userTransaction.decayFull = decayFull

    updatePromises.push(
      db.update(transactionsTable)
        .set({
          previous: lastTransaction?.id ?? null,
          balance,
          balanceFull,
          decay,
          decayFull
        })
        .where(eq(transactionsTable.id, userTransaction.id))
    )

    lastTransaction = userTransaction
    
    
  }
  return Promise.all(updatePromises)
}

export async function removeCrossGroupTransactions(db: MySql2Database): Promise<void> {
  console.log('Removing cross-group transactions...')
  const previousTx = alias(transactionsTable, 'previousTx')
  let transactions: { transaction: typeof transactionsTable.$inferSelect; previousTx: typeof transactionsTable.$inferSelect | null }[] = []
  do {
    // go through all transactions, delete them, update user balances
    transactions = await db.select({
        transaction: transactionsTable,
        previousTx: previousTx,
      })
      .from(transactionsTable)
      .leftJoin(previousTx, eq(transactionsTable.previous, previousTx.id))
      .where(or(
          ne(transactionsTable.userCommunityUuid, transactionsTable.linkedUserCommunityUuid),
          and(
            isNull(transactionsTable.userCommunityUuid),
            isNotNull(transactionsTable.linkedUserCommunityUuid)
          ),
        )
      )
      .orderBy(asc(transactionsTable.balanceDate))
      .limit(1)

    if (!transactions.length) {
      break
    }    
    const workTxId = transactions[0].transaction.id
    // console.log(`Process Transaction: ${workTxId} `)
    await db.delete(transactionsTable).where(eq(transactionsTable.id, workTxId))
    await updateUserBalance(db, transactions[0].transaction, transactions[0].previousTx)    
    // await updateTransactionIds(db, workTxId)
    console.log(`Processed: ${workTxId}`)
  } while(transactions.length > 0)
  return Promise.resolve()
}


async function main() : Promise<void> {
  const startDate = new Date()
  const connection = await mysql.createConnection({
      host: CONFIG.DB_HOST,
      user: CONFIG.DB_USER,
      password: CONFIG.DB_PASSWORD,
      database: CONFIG.DB_DATABASE,
      port: CONFIG.DB_PORT,
      waitForConnections: true,
    })
  const db = drizzle({ client: connection })
  await db.transaction(async (tx) => {
    await removeCrossGroupTransactions(tx)
  })
  await connection.end()
  const endDate = new Date()
  console.log('Finished in', endDate.getTime() - startDate.getTime(), 'ms')
  return Promise.resolve()
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
