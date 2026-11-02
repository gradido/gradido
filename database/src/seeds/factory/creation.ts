// AI-GENERATED — not an architecture reference
import { Decay, GradidoUnit } from 'shared'
import { DrizzleTransaction } from '../../AppDatabase'
import { Contribution, Transaction, User } from '../../entity'
import { ContributionStatus, ContributionType, TransactionTypeId } from '../../enum'
import { findUserByIdentifier } from '../../queries'
import { dbInsertContributions } from '../../queries/contributions'
import { dbInsertTransactions } from '../../queries/transactions'
import { ContributionsInsert, TransactionInsert } from '../../schemas/drizzle.schema'
import { CreationInterface } from '../creation/CreationInterface'
import { createTransaction } from './transaction'
import { SeedUserRef } from './user'

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
  const contribution = await createContribution(creation, user)
  if (creation.confirmed) {
    if (!moderatorUser) {
      moderatorUser = await findUserByIdentifier('peter@lustig.de')
    }
    if (!moderatorUser) {
      throw new Error('Moderator user not found')
    }
    await confirmTransaction(creation, contribution, moderatorUser)
  }
  return contribution
}

export async function createContribution(
  creation: CreationInterface,
  user: User,
  store: boolean = true,
): Promise<Contribution> {
  const contribution = new Contribution()
  contribution.user = user
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
  moderatorUser: User,
  transactionId?: number,
  store: boolean = true,
): Promise<{ contribution: Contribution; transaction: Transaction }> {
  const balanceDate = getBalanceDate(creation)
  const transaction = await createTransaction(
    contribution.amount,
    contribution.memo,
    contribution.user,
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

/** A creation with the date it is booked on, worked out once. */
export interface DatedCreation {
  creation: CreationInterface
  balanceDate: Date
}

/**
 * The creations in the order the seed books them: by balance date, as decay does not run
 * backwards. The sort is stable, creations of the same moment keep their order.
 */
export function sortCreationsByBalanceDate(creations: CreationInterface[]): DatedCreation[] {
  return creations
    .map((creation) => ({ creation, balanceDate: getBalanceDate(creation) }))
    .sort((a, b) => a.balanceDate.getTime() - b.balanceDate.getTime())
}

/**
 * What the booking of the seed carries from one batch of creations to the next: the id of the
 * next transaction and each member's last booking, the base of their next one.
 */
export interface SeedBookingState {
  nextTransactionId: number
  lastBookings: Map<number, { id: number; balance: GradidoUnit; balanceDate: Date }>
}

/** For an empty database: no transaction yet, and every balance starts from nothing. */
export function newSeedBookingState(): SeedBookingState {
  return { nextTransactionId: 1, lastBookings: new Map() }
}

/** The rows of one batch of seed creations. */
export interface SeedCreationRows {
  contributions: ContributionsInsert[]
  transactions: TransactionInsert[]
}

/**
 * The rows createContribution and confirmTransaction write, for one batch of creations and
 * without touching the database. The batch has to come in the order of
 * sortCreationsByBalanceDate, and the batches in that order too.
 *
 * Each further booking of a member builds on their previous one, which `state` carries along
 * instead of reading it back; the state is updated with this batch's bookings.
 */
export function buildSeedCreationRows(
  creations: DatedCreation[],
  refsByEmail: Map<string, SeedUserRef>,
  moderator: SeedUserRef,
  state: SeedBookingState,
): SeedCreationRows {
  const rows: SeedCreationRows = { contributions: [], transactions: [] }

  for (const { creation, balanceDate } of creations) {
    const user = refsByEmail.get(creation.email)
    if (!user) {
      throw new Error(`User ${creation.email} not found`)
    }
    const amount = GradidoUnit.fromNumber(creation.amount)
    const contribution: ContributionsInsert = {
      userId: user.id,
      amount,
      createdAt: new Date(),
      contributionDate: getContributionDate(creation),
      memo: creation.memo,
      type: ContributionType.USER,
      status: ContributionStatus.PENDING,
    }
    if (creation.confirmed) {
      const lastBooking = state.lastBookings.get(user.id)
      let balance = new GradidoUnit(0n)
      let decay: Decay | null = null
      if (lastBooking) {
        decay = lastBooking.balance.calculateDecay(lastBooking.balanceDate, balanceDate)
        balance = decay.balance
      }
      balance = balance.add(amount)

      const transactionId = state.nextTransactionId++
      rows.transactions.push({
        id: transactionId,
        typeId: TransactionTypeId.CREATION,
        memo: creation.memo,
        userId: user.id,
        userGradidoId: user.gradidoId,
        userName: user.name,
        userCommunityUuid: user.communityUuid,
        linkedUserId: moderator.id,
        linkedUserGradidoId: moderator.gradidoId,
        linkedUserName: moderator.name,
        linkedUserCommunityUuid: moderator.communityUuid,
        previous: lastBooking ? lastBooking.id : null,
        amount,
        creationDate: contribution.contributionDate,
        balance,
        balanceDate,
        decay: decay ? decay.decay : new GradidoUnit(0n),
        decayStart: decay ? decay.start : null,
      })
      state.lastBookings.set(user.id, { id: transactionId, balance, balanceDate })

      contribution.confirmedAt = balanceDate
      contribution.confirmedBy = moderator.id
      contribution.transactionId = transactionId
      contribution.status = ContributionStatus.CONFIRMED
    }
    rows.contributions.push(contribution)
  }
  return rows
}

export async function insertSeedCreationRows(
  rows: SeedCreationRows,
  tx: DrizzleTransaction,
): Promise<void> {
  await dbInsertTransactions(rows.transactions, tx)
  await dbInsertContributions(rows.contributions, tx)
}
