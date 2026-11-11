// AI-GENERATED — not an architecture reference
import { fullName, GradidoUnit } from 'shared'
import { DrizzleTransaction, drizzleDb } from '../../AppDatabase'
import { User } from '../../entity'
import { ContributionStatus, ContributionType, TransactionTypeId } from '../../enum'
import { dbInsertContributions } from '../../queries/contributions'
import { dbInsertTransactions, dbSelectLastTransaction } from '../../queries/transactions'
import { dbFindUserByEmail } from '../../queries/user'
import { ContributionsInsert, TransactionInsert } from '../../schemas/drizzle.schema'
import { CreationInterface } from '../creation/CreationInterface'
import { bookingRow, LastBooking } from './transaction'
import { SeedUserRef, seedUserRefOf } from './user'

export function nMonthsBefore(date: Date, months = 1): string {
  return new Date(date.getFullYear(), date.getMonth() - months, 1).toISOString()
}

/**
 * One creation as a member files it, confirmed by the moderator if the creation says so.
 *
 * ⚠️ Seed a member's bookings in CHRONOLOGICAL order, see foreignReceive.
 */
export async function creationFactory(
  creation: CreationInterface,
  user?: User | null,
  moderatorUser?: User | null,
): Promise<ContributionsInsert & { id: number }> {
  const member = await seedUserRefByEmail(creation.email, user, `User ${creation.email} not found`)
  const contribution = contributionRow(creation, member)
  if (creation.confirmed) {
    const moderator = await seedUserRefByEmail(
      'peter@lustig.de',
      moderatorUser,
      'Moderator user not found',
    )
    const balanceDate = getBalanceDate(creation)
    return drizzleDb().transaction(async (tx) => {
      const booking = creationBookingRow(
        creation,
        contribution,
        balanceDate,
        member,
        moderator,
        await dbSelectLastTransaction(member.id, tx),
      )
      const [transactionId] = await dbInsertTransactions([booking], tx)
      confirmContribution(contribution, balanceDate, moderator, transactionId)
      const [id] = await dbInsertContributions([contribution], tx)
      return { ...contribution, id }
    })
  }
  const [id] = await dbInsertContributions([contribution])
  return { ...contribution, id }
}

async function seedUserRefByEmail(
  email: string,
  user: User | null | undefined,
  notFound: string,
): Promise<SeedUserRef> {
  if (user) {
    return seedUserRefOf(user)
  }
  const found = await dbFindUserByEmail(email, true)
  if (!found) {
    throw new Error(notFound)
  }
  return {
    id: found.id,
    gradidoId: found.gradidoId,
    communityUuid: found.communityUuid,
    name: fullName(found.firstName ?? '', found.lastName ?? ''),
  }
}

function contributionRow(creation: CreationInterface, user: SeedUserRef): ContributionsInsert {
  return {
    userId: user.id,
    amount: GradidoUnit.fromNumber(creation.amount),
    createdAt: new Date(),
    contributionDate: getContributionDate(creation),
    memo: creation.memo,
    type: ContributionType.USER,
    status: ContributionStatus.PENDING,
  }
}

function creationBookingRow(
  creation: CreationInterface,
  contribution: ContributionsInsert,
  balanceDate: Date,
  user: SeedUserRef,
  moderator: SeedUserRef,
  lastBooking: LastBooking | null,
): TransactionInsert {
  return bookingRow(
    GradidoUnit.fromNumber(creation.amount),
    creation.memo,
    user,
    moderator,
    TransactionTypeId.CREATION,
    balanceDate,
    lastBooking,
    contribution.contributionDate,
  )
}

function confirmContribution(
  contribution: ContributionsInsert,
  balanceDate: Date,
  moderator: SeedUserRef,
  transactionId: number,
): void {
  contribution.confirmedAt = balanceDate
  contribution.confirmedBy = moderator.id
  contribution.transactionId = transactionId
  contribution.status = ContributionStatus.CONFIRMED
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
  lastBookings: Map<number, LastBooking>
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
    const contribution = contributionRow(creation, user)
    if (creation.confirmed) {
      const booking = creationBookingRow(
        creation,
        contribution,
        balanceDate,
        user,
        moderator,
        state.lastBookings.get(user.id) ?? null,
      )
      const transactionId = state.nextTransactionId++
      rows.transactions.push({ ...booking, id: transactionId })
      state.lastBookings.set(user.id, {
        id: transactionId,
        balance: booking.balance as GradidoUnit,
        balanceDate,
      })
      confirmContribution(contribution, balanceDate, moderator, transactionId)
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
