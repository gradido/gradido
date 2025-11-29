import { TransactionLinkInterface } from '../transactionLink/TransactionLinkInterface'
import { TransactionLink, User } from '../../entity'
import { Decimal } from 'decimal.js-light'
import { findUserByIdentifier } from '../../queries'
import { compoundInterest } from 'shared'
import { randomBytes } from 'node:crypto'
import { AppDatabase } from '../../AppDatabase'

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
  userCreationIndexedByEmail: Map<string, User>
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

export async function createTransactionLink(transactionLinkData: TransactionLinkInterface, userId: number, store: boolean = true): Promise<TransactionLink> {
  const holdAvailableAmount = compoundInterest(new Decimal(transactionLinkData.amount.toString()), CODE_VALID_DAYS_DURATION * 24 * 60 * 60)
  let createdAt = transactionLinkData.createdAt || new Date()
  const validUntil = transactionLinkExpireDate(createdAt)

  const transactionLink = new TransactionLink()
  transactionLink.userId = userId
  transactionLink.amount = new Decimal(transactionLinkData.amount)
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

//////  Transaction Link BUSINESS LOGIC  //////
// TODO: move business logic to shared
export const CODE_VALID_DAYS_DURATION = 14

export const transactionLinkExpireDate = (date: Date): Date => {
  const validUntil = new Date(date)
  return new Date(validUntil.setDate(date.getDate() + CODE_VALID_DAYS_DURATION))
}

export const transactionLinkCode = (date: Date): string => {
  const time = date.getTime().toString(16)
  return (
    randomBytes(12)
      .toString('hex')
      .substring(0, 24 - time.length) + time
  )
}