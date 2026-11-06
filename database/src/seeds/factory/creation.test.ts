// AI-GENERATED — not an architecture reference
import { GradidoUnit } from 'shared'
import { AppDatabase, drizzleDb } from '../../AppDatabase'
import { User } from '../../entity'
import { ContributionStatus, TransactionTypeId } from '../../enum'
import { dbDeleteAllRowsExceptMigrations } from '../../queries/informationSchemaTables'
import { contributionsTable, transactionsTable } from '../../schemas'
import { createCommunity } from '../community'
import { CreationInterface } from '../creation/CreationInterface'
import { bibiBloxberg } from '../users/bibi-bloxberg'
import { peterLustig } from '../users/peter-lustig'
import {
  buildSeedCreationRows,
  creationFactory,
  newSeedBookingState,
  sortCreationsByBalanceDate,
} from './creation'
import { SeedUserRef, userFactory } from './user'

const COMMUNITY_UUID = '0bd3a4a9-31a4-4b0a-8f3c-0c1d7a4b6f00'
const ref = (id: number, name: string): SeedUserRef => ({
  id,
  gradidoId: `gradido-id-${id}`,
  communityUuid: COMMUNITY_UUID,
  name,
})
const moderator = ref(1, 'Mo Derator')
const anna = ref(2, 'Anna A')
const ben = ref(3, 'Ben B')
const refsByEmail = new Map([
  ['moderator@seed.de', moderator],
  ['anna@seed.de', anna],
  ['ben@seed.de', ben],
])

const creation = (email: string, extra: Partial<CreationInterface> = {}): CreationInterface => ({
  email,
  amount: 100,
  memo: 'seed creation',
  contributionDate: new Date(2026, 0, 1).toISOString(),
  confirmed: true,
  ...extra,
})

const build = (creations: CreationInterface[], state = newSeedBookingState()) =>
  buildSeedCreationRows(sortCreationsByBalanceDate(creations), refsByEmail, moderator, state)

describe('sortCreationsByBalanceDate', () => {
  it('orders by balance date, whatever the order of the list', () => {
    const dated = sortCreationsByBalanceDate([
      creation('anna@seed.de', { memo: 'now' }),
      creation('anna@seed.de', { memo: 'moved', moveCreationDate: 2 }),
    ])

    expect(dated.map(({ creation }) => creation.memo)).toEqual(['moved', 'now'])
  })
})

describe('buildSeedCreationRows', () => {
  it("builds each booking of a member on the previous one, decayed to the booking's date", () => {
    const rows = build([
      creation('anna@seed.de', { moveCreationDate: 12 }),
      creation('anna@seed.de'),
    ])

    const [first, second] = rows.transactions
    expect(first.previous).toBeNull()
    expect(first.balance).toEqual(GradidoUnit.fromNumber(100))
    expect(second.previous).toBe(first.id)
    const decay = (first.balance as GradidoUnit).calculateDecay(
      first.balanceDate as Date,
      second.balanceDate as Date,
    )
    expect(second.decay).toEqual(decay.decay)
    expect(second.balance).toEqual(decay.balance.add(GradidoUnit.fromNumber(100)))
  })

  it('keeps a chain per member', () => {
    const rows = build([
      creation('anna@seed.de'),
      creation('ben@seed.de'),
      creation('anna@seed.de'),
    ])

    const [annaFirst, benFirst, annaSecond] = rows.transactions
    expect(benFirst.userId).toBe(ben.id)
    expect(benFirst.previous).toBeNull()
    expect(annaSecond.previous).toBe(annaFirst.id)
  })

  it('carries the chain and the ids on into the next batch', () => {
    const state = newSeedBookingState()
    const firstBatch = build([creation('anna@seed.de', { moveCreationDate: 1 })], state)
    const secondBatch = build([creation('anna@seed.de')], state)

    const [first] = firstBatch.transactions
    const [second] = secondBatch.transactions
    expect(second.id).toBe((first.id as number) + 1)
    expect(second.previous).toBe(first.id)
    const decay = (first.balance as GradidoUnit).calculateDecay(
      first.balanceDate as Date,
      second.balanceDate as Date,
    )
    expect(second.balance).toEqual(decay.balance.add(GradidoUnit.fromNumber(100)))
  })

  it('confirms a creation with the moderator and links its booking', () => {
    const rows = build([creation('anna@seed.de')])

    const [contribution] = rows.contributions
    const [transaction] = rows.transactions
    expect(contribution.status).toBe(ContributionStatus.CONFIRMED)
    expect(contribution.confirmedBy).toBe(moderator.id)
    expect(contribution.transactionId).toBe(transaction.id)
    expect(transaction.userId).toBe(anna.id)
    expect(transaction.userName).toBe(anna.name)
    expect(transaction.linkedUserId).toBe(moderator.id)
    expect(transaction.linkedUserName).toBe(moderator.name)
    expect(transaction.creationDate).toEqual(contribution.contributionDate)
  })

  it('books nothing for a creation that is not confirmed', () => {
    const state = newSeedBookingState()
    const rows = build([creation('anna@seed.de', { confirmed: false })], state)

    expect(rows.contributions).toHaveLength(1)
    expect(rows.contributions[0].status).toBe(ContributionStatus.PENDING)
    expect(rows.contributions[0].transactionId).toBeUndefined()
    expect(rows.transactions).toHaveLength(0)
    expect(state.nextTransactionId).toBe(1)
  })

  it('throws for an address no seed user has', () => {
    expect(() => build([creation('nobody@seed.de')])).toThrow('nobody@seed.de')
  })
})

describe('creationFactory', () => {
  const db = AppDatabase.getInstance()
  let bibi: User
  let peter: User
  const contributionsOf = () => drizzleDb().select().from(contributionsTable)
  const bookingsOf = () => drizzleDb().select().from(transactionsTable)

  beforeAll(async () => {
    await db.init()
    await dbDeleteAllRowsExceptMigrations()
    await createCommunity(false)
    bibi = await userFactory(bibiBloxberg)
    peter = await userFactory(peterLustig)
  })

  afterAll(async () => {
    await dbDeleteAllRowsExceptMigrations()
    await db.destroy()
  })

  beforeEach(async () => {
    await drizzleDb().delete(contributionsTable)
    await drizzleDb().delete(transactionsTable)
  })

  it('writes a confirmed creation with its booking, the two linked', async () => {
    const created = await creationFactory(creation(bibi.emailContact.email), bibi, peter)

    const [contribution] = await contributionsOf()
    const [booking] = await bookingsOf()
    expect(contribution.id).toBe(created.id)
    expect(contribution.status).toBe(ContributionStatus.CONFIRMED)
    expect(contribution.confirmedBy).toBe(peter.id)
    expect(contribution.transactionId).toBe(booking.id)
    expect(booking.typeId).toBe(TransactionTypeId.CREATION)
    expect(booking.userId).toBe(bibi.id)
    expect(booking.linkedUserId).toBe(peter.id)
    expect(booking.creationDate).toEqual(contribution.contributionDate)
  })

  it('builds on the last booking the member has in the database', async () => {
    const earlier = await creationFactory(
      creation(bibi.emailContact.email, { moveCreationDate: 12 }),
      bibi,
      peter,
    )
    await creationFactory(creation(bibi.emailContact.email), bibi, peter)

    const bookings = await bookingsOf()
    expect(bookings).toHaveLength(2)
    expect(bookings[1].previous).toBe(bookings[0].id)
    expect(earlier.transactionId).toBe(bookings[0].id)
    expect(bookings[1].balance?.gddCent).toBeGreaterThan(GradidoUnit.fromNumber(100).gddCent)
  })

  it('writes no booking for a creation that is not confirmed', async () => {
    await creationFactory(creation(bibi.emailContact.email, { confirmed: false }), bibi, peter)

    expect((await contributionsOf())[0].status).toBe(ContributionStatus.PENDING)
    expect(await bookingsOf()).toHaveLength(0)
  })

  it('finds member and moderator by address when none is given', async () => {
    await creationFactory(creation(bibi.emailContact.email))

    const [booking] = await bookingsOf()
    expect(booking.userId).toBe(bibi.id)
    expect(booking.linkedUserId).toBe(peter.id)
  })

  it('throws for an address nobody has, and writes nothing', async () => {
    await expect(creationFactory(creation('nobody@seed.de'))).rejects.toThrow('nobody@seed.de')

    expect(await contributionsOf()).toHaveLength(0)
  })
})
