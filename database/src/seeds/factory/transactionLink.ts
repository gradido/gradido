import { randomBytes } from 'node:crypto'
import { CODE_VALID_DAYS_DURATION, Duration, GradidoUnit } from 'shared'
import { AppDatabase } from '../../AppDatabase'
import { TransactionLink, User } from '../../entity'
import { findUserByIdentifier } from '../../queries'
import { TransactionLinksInsert } from '../../schemas/drizzle.schema'
import { TransactionLinkInterface } from '../transactionLink/TransactionLinkInterface'
import { SeedUserRef } from './user'

export async function transactionLinkFactory(
  transactionLinkData: TransactionLinkInterface,
  userId?: number,
): Promise<TransactionLink> {
  if (!userId) {
    const user = await findUserByIdentifier(transactionLinkData.email)
    if (!user) {
      throw new Error(`User ${transactionLinkData.email} not found`)
    }
    userId = user.id
  }
  return createTransactionLink(transactionLinkData, userId)
}

export async function transactionLinkFactoryBulk(
  transactionLinks: TransactionLinkInterface[],
  userCreationIndexedByEmail: Map<string, User>,
): Promise<TransactionLink[]> {
  const dbTransactionLinks: TransactionLink[] = []
  for (const transactionLink of transactionLinks) {
    const user = userCreationIndexedByEmail.get(transactionLink.email)
    if (!user) {
      throw new Error(`User ${transactionLink.email} not found`)
    }
    dbTransactionLinks.push(await createTransactionLink(transactionLink, user.id, false))
  }
  const dataSource = AppDatabase.getInstance().getDataSource()
  await dataSource.getRepository(TransactionLink).insert(dbTransactionLinks)
  return dbTransactionLinks
}

export async function createTransactionLink(
  transactionLinkData: TransactionLinkInterface,
  userId: number,
  store: boolean = true,
): Promise<TransactionLink> {
  const transactionLink = Object.assign(
    new TransactionLink(),
    buildTransactionLinkRow(transactionLinkData, userId),
  )
  return store ? transactionLink.save() : transactionLink
}

// The row of one transaction link, for createTransactionLink and the seed alike.
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
  refsByEmail: Map<string, SeedUserRef>,
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
