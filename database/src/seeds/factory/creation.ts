import { GradidoUnit } from 'shared'
import { AppDatabase } from '../../AppDatabase'
import { Contribution, Transaction } from '../../entity'
import { ContributionStatus, ContributionType, TransactionTypeId } from '../../enum'
import { FullUser } from '../../schemas'
import { CreationInterface } from '../creation/CreationInterface'
import { createTransaction } from './transaction'
import { findFullUserByEmail } from './user'

export function nMonthsBefore(date: Date, months = 1): string {
  return new Date(date.getFullYear(), date.getMonth() - months, 1).toISOString()
}

export async function creationFactory(
  creation: CreationInterface,
  user?: FullUser | null,
  moderatorUser?: FullUser | null,
): Promise<Contribution> {
  if (!user) {
    user = await findFullUserByEmail(creation.email)
  }
  if (!user) {
    throw new Error(`User ${creation.email} not found`)
  }
  const contribution = await createContribution(creation, user)
  if (creation.confirmed) {
    if (!moderatorUser) {
      moderatorUser = await findFullUserByEmail('peter@lustig.de')
    }
    if (!moderatorUser) {
      throw new Error('Moderator user not found')
    }
    await confirmTransaction(creation, contribution, user, moderatorUser)
  }
  return contribution
}

export async function creationFactoryBulk(
  creations: CreationInterface[],
  userCreationIndexedByEmail: Map<string, FullUser>,
  moderatorUser: FullUser,
): Promise<Contribution[]> {
  const lastTransaction = await Transaction.findOne({
    order: { id: 'DESC' },
    select: ['id'],
    where: {},
  })
  let transactionId = lastTransaction ? lastTransaction.id + 1 : 1
  const dbContributions: Contribution[] = []
  const dbTransactions: Transaction[] = []

  for (const creation of creations) {
    const user = userCreationIndexedByEmail.get(creation.email)
    if (!user) {
      throw new Error(`User ${creation.email} not found`)
    }
    const contribution = await createContribution(creation, user, false)
    if (creation.confirmed) {
      const { contribution: _, transaction } = await confirmTransaction(
        creation,
        contribution,
        user,
        moderatorUser,
        transactionId,
        false,
      )
      dbTransactions.push(transaction)
      transactionId++
    }
    dbContributions.push(contribution)
  }
  const dataSource = AppDatabase.getInstance().getDataSource()
  await dataSource.transaction(async (transaction) => {
    await dataSource.getRepository(Contribution).insert(dbContributions)
    await dataSource.getRepository(Transaction).insert(dbTransactions)
  })
  return dbContributions
}

export async function createContribution(
  creation: CreationInterface,
  user: FullUser,
  store: boolean = true,
): Promise<Contribution> {
  const contribution = new Contribution()
  contribution.userId = user.id
  contribution.amount = GradidoUnit.fromNumber(creation.amount)
  contribution.createdAt = new Date()
  contribution.contributionDate = getContributionDate(creation)
  contribution.memo = creation.memo
  contribution.contributionType = ContributionType.USER
  contribution.contributionStatus = ContributionStatus.PENDING

  return store ? contribution.save() : contribution
}

export async function confirmTransaction(
  creation: CreationInterface,
  contribution: Contribution,
  user: FullUser,
  moderatorUser: FullUser,
  transactionId?: number,
  store: boolean = true,
): Promise<{ contribution: Contribution; transaction: Transaction }> {
  const balanceDate = getBalanceDate(creation)
  const transaction = await createTransaction(
    contribution.amount,
    contribution.memo,
    user,
    moderatorUser,
    TransactionTypeId.CREATION,
    balanceDate,
    contribution.contributionDate,
    transactionId,
    store,
  )
  contribution.confirmedAt = balanceDate
  contribution.confirmedBy = moderatorUser.id
  contribution.transactionId = transaction.id
  contribution.transaction = transaction
  contribution.contributionStatus = ContributionStatus.CONFIRMED

  if (store) {
    await contribution.save()
    await transaction.save()
  }

  return { contribution, transaction }
}

function getContributionDate(creation: CreationInterface): Date {
  if (creation.moveCreationDate) {
    return new Date(nMonthsBefore(new Date(creation.contributionDate), creation.moveCreationDate))
  }
  return new Date(creation.contributionDate)
}

function getBalanceDate(creation: CreationInterface): Date {
  const now = new Date()
  if (creation.moveCreationDate) {
    return new Date(nMonthsBefore(now, creation.moveCreationDate))
  }
  return now
}
