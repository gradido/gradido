import { CONFIG } from '../../src/config'
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { communitiesTable, transactionsTable, usersTable } from './drizzle.schema'
import { or, and, eq, gt, asc } from 'drizzle-orm'
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
    if (currentTransaction.amount <= 0n) {
      throw new Error('invalid tx, amount_gdd4 is negative or zero for first tx')
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
      throw new Error('invalid tx, amount_gdd4 is negative or zero for first tx')
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

async function removeCrossGroupTransactions(db: MySql2Database, communityUUID: string): Promise<void> {
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
        eq(transactionsTable.userCommunityUuid, communityUUID),
        eq(transactionsTable.linkedUserCommunityUuid, communityUUID)
      ))
      .orderBy(asc(transactionsTable.balanceDate))
      .limit(1)

    if (!transactions.length) {
      break
    }
    const workTxId = transactions[0].transaction.id
    // console.log(`Process Transaction: ${workTxId} `)
    await db.delete(transactionsTable).where(eq(transactionsTable.id, workTxId))
    await updateUserBalance(db, transactions[0].transaction, transactions[0].previousTx)
    console.log(`Deleted and updated: ${workTxId}`)
  } while(transactions.length > 0)
  return Promise.resolve()
}

async function removeCommunityRemoteUser(db: MySql2Database, communityUUID: string): Promise<void> {
  console.log('Removing remote community and there remote users...')
  await Promise.all([
    db.delete(communitiesTable).where(and(eq(communitiesTable.communityUuid, communityUUID), eq(communitiesTable.foreign, 1))),
    db.delete(usersTable).where(and(eq(usersTable.communityUuid, communityUUID), eq(usersTable.foreign, 1))),
  ])
}

async function main(communityUUID: string) : Promise<void> {
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
    const community = await tx.select().from(communitiesTable).where(eq(communitiesTable.communityUuid, communityUUID)).limit(1)
    if (!community.length) {
      throw new Error('Community not found')
    }
    if (!community[0].foreign) {
      throw new Error('Cannot remove non-foreign community')
    }
    await Promise.all([
      removeCrossGroupTransactions(tx, communityUUID),
      removeCommunityRemoteUser(tx, communityUUID)
    ])
  })
  await connection.end()
  const endDate = new Date()
  console.log('Finished in', endDate.getTime() - startDate.getTime(), 'ms')
  return Promise.resolve()
}

if (require.main === module) {
  if (!process.argv[2]) {
    console.error('Usage: bun removeCrossGroupTransactions <communityUUID>')
    process.exit(1)
  }
  main(process.argv[2]).catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
