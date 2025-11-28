import { Contribution, User } from '../../entity'
import { Decimal } from 'decimal.js-light'
import { CreationInterface } from '../creation/CreationInterface'
import { ContributionType, ContributionStatus, TransactionTypeId } from '../../enum'
import { findUserByIdentifier } from '../../queries'
import { createTransaction } from './transaction'

export function nMonthsBefore(date: Date, months = 1): string {
  return new Date(date.getFullYear(), date.getMonth() - months, 1).toISOString()
}

export async function creationFactory(
  creation: CreationInterface,
  user?: User | null,
  moderatorUser?: User | null,
): Promise<Contribution> {
  if (!user) {
    user = await findUserByIdentifier(creation.email)
  }
  if (!user) {
    throw new Error(`User ${creation.email} not found`)
  }
  let contribution = await createContribution(creation, user)
  if (creation.confirmed) {
    if (!moderatorUser) {
      moderatorUser = await findUserByIdentifier('peter@lustig.de')
    }
    if (!moderatorUser) {
      throw new Error('Moderator user not found')
    }
    contribution = await confirmTransaction(contribution, moderatorUser)
  }
  return contribution
}

export async function createContribution(creation: CreationInterface, user: User, store: boolean = true): Promise<Contribution> {
  const contribution = new Contribution()
  contribution.user = user
  contribution.userId = user.id
  contribution.amount = new Decimal(creation.amount)
  contribution.createdAt = new Date()
  contribution.contributionDate = getContributionDate(creation)
  contribution.memo = creation.memo
  contribution.contributionType = ContributionType.USER
  contribution.contributionStatus = ContributionStatus.PENDING
  
  return store ? contribution.save() : contribution
}

export async function confirmTransaction(contribution: Contribution, moderatorUser: User, store: boolean = true): Promise<Contribution> {
  const now = new Date()
  const transaction = await createTransaction(
    contribution.amount,
    contribution.memo,
    contribution.user,
    moderatorUser,
    TransactionTypeId.CREATION,
    now,
    contribution.contributionDate,
    true,
  )
  contribution.confirmedAt = now
  contribution.confirmedBy = moderatorUser.id
  contribution.transactionId = transaction.id
  contribution.transaction = transaction
  contribution.contributionStatus = ContributionStatus.CONFIRMED

  return store ? contribution.save() : contribution
}
    
function getContributionDate(creation: CreationInterface): Date {
  if (creation.moveCreationDate) {
      return new Date(nMonthsBefore(new Date(creation.contributionDate), creation.moveCreationDate))
  }
  return new Date(creation.contributionDate)
}