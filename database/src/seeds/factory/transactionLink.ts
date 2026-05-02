import { randomBytes } from 'node:crypto'
import { CODE_VALID_DAYS_DURATION, Duration, GradidoUnit } from 'shared'
import { AppDatabase } from '../../AppDatabase'
import { TransactionLink, User } from '../../entity'
import { findUserByIdentifier } from '../../queries'
import { TransactionLinkInterface } from '../transactionLink/TransactionLinkInterface'

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
  const amount = GradidoUnit.fromNumber(transactionLinkData.amount)
  const holdAvailableAmount = amount.requiredBeforeDecay(Duration.days(CODE_VALID_DAYS_DURATION))
  const createdAt = transactionLinkData.createdAt || new Date()
  const validUntil = Duration.days(CODE_VALID_DAYS_DURATION).addToDate(createdAt)

  const transactionLink = new TransactionLink()
  transactionLink.userId = userId
  transactionLink.amount = GradidoUnit.fromNumber(transactionLinkData.amount)
  transactionLink.memo = transactionLinkData.memo
  transactionLink.holdAvailableAmount = holdAvailableAmount
  transactionLink.code = transactionLinkCode(createdAt)
  transactionLink.createdAt = createdAt
  transactionLink.validUntil = validUntil

  if (transactionLinkData.deletedAt) {
    transactionLink.deletedAt = new Date(createdAt.getTime() + 1000)
  }

  return store ? transactionLink.save() : transactionLink
}

export const transactionLinkCode = (date: Date): string => {
  const time = date.getTime().toString(16)
  return (
    randomBytes(12)
      .toString('hex')
      .substring(0, 24 - time.length) + time
  )
}
