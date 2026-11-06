import { randomBytes } from 'node:crypto'
import { CODE_VALID_DAYS_DURATION, Duration, GradidoUnit } from 'shared'
import { dbInsertTransactionLinks } from '../../queries/transactionLinks'
import { dbFindUserByEmail } from '../../queries/user'
import { TransactionLinksInsert } from '../../schemas/drizzle.schema'
import { TransactionLinkInterface } from '../transactionLink/TransactionLinkInterface'
import { SEED_BATCH_SIZE } from './batchSize'

export async function transactionLinkFactory(
  transactionLinkData: TransactionLinkInterface,
  userId?: number,
): Promise<TransactionLinksInsert & { id: number }> {
  if (!userId) {
    const user = await dbFindUserByEmail(transactionLinkData.email)
    if (!user) {
      throw new Error(`User ${transactionLinkData.email} not found`)
    }
    userId = user.id
  }
  const row = buildTransactionLinkRow(transactionLinkData, userId)
  const [id] = await dbInsertTransactionLinks([row])
  return { ...row, id }
}

// The links with the ids the database gave them, in the order of `transactionLinks`.
export async function transactionLinkFactoryBulk(
  transactionLinks: TransactionLinkInterface[],
  usersByEmail: Map<string, { id: number }>,
): Promise<(TransactionLinksInsert & { id: number })[]> {
  const created: (TransactionLinksInsert & { id: number })[] = []
  for (let offset = 0; offset < transactionLinks.length; offset += SEED_BATCH_SIZE) {
    const batch = transactionLinks.slice(offset, offset + SEED_BATCH_SIZE)
    const rows = buildSeedTransactionLinkRows(batch, usersByEmail)
    const ids = await dbInsertTransactionLinks(rows)
    created.push(...rows.map((row, index) => ({ ...row, id: ids[index] })))
  }
  return created
}

// The row of one transaction link, for the factories and the seed alike.
export function buildTransactionLinkRow(
  transactionLinkData: TransactionLinkInterface,
  userId: number,
): TransactionLinksInsert {
  const amount = GradidoUnit.fromNumber(transactionLinkData.amount)
  const createdAt = transactionLinkData.createdAt || new Date()
  return {
    userId,
    amount,
    memo: transactionLinkData.memo,
    holdAvailableAmount: amount.requiredBeforeDecay(Duration.days(CODE_VALID_DAYS_DURATION)),
    code: transactionLinkCode(createdAt),
    createdAt,
    validUntil: Duration.days(CODE_VALID_DAYS_DURATION).addToDate(createdAt),
    deletedAt: transactionLinkData.deletedAt ? new Date(createdAt.getTime() + 1000) : undefined,
    redeemedAt: transactionLinkData.redeemedAt,
    redeemedBy: transactionLinkData.redeemedBy,
  }
}

// The rows of one batch of seed transaction links.
export function buildSeedTransactionLinkRows(
  transactionLinks: TransactionLinkInterface[],
  refsByEmail: Map<string, { id: number }>,
): TransactionLinksInsert[] {
  return transactionLinks.map((transactionLink) => {
    const user = refsByEmail.get(transactionLink.email)
    if (!user) {
      throw new Error(`User ${transactionLink.email} not found`)
    }
    return buildTransactionLinkRow(transactionLink, user.id)
  })
}

export const transactionLinkCode = (date: Date): string => {
  const time = date.getTime().toString(16)
  return (
    randomBytes(12)
      .toString('hex')
      .substring(0, 24 - time.length) + time
  )
}
