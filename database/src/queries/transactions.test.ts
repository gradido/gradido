// AI-GENERATED — not an architecture reference
import { GradidoUnit } from 'shared'
import { clearDatabase } from '../../migration/clear'
import { User as DbUser } from '..'
import { AppDatabase } from '../AppDatabase'
import { TransactionTypeId } from '../enum'
import { createCommunity } from '../seeds/community'
import { creationFactory, nMonthsBefore } from '../seeds/factory/creation'
import { foreignReceive, transferGradidos } from '../seeds/factory/transaction'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { peterLustig } from '../seeds/users/peter-lustig'
import { dbSelectContactsByUserId, dbSelectTransactionsByUserId } from './transactions'
import { dbFindUserIdByUuids } from './user'

const appDB = AppDatabase.getInstance()

let bibi: DbUser
let peter: DbUser
let bob: DbUser

const FOREIGN_COMMUNITY = '99999999-9999-9999-9999-999999999999'
const SARAH = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
// A foreign member whose bookings still carry a pre-alias-era "First Last" -- the shape the
// X-Com path wrote before 9caba44a6. That name must reach nobody, not through the search either.
const ANNA = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
// Books on the same day as Sarah, so that the order has a real tie to break.
const TINA = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

const day = (n: number): Date => new Date(Date.UTC(2026, 7, n, 12, 0, 0))

/** The counterparty of a foreign booking, as the seed factory takes it. */
const fromAfar = (gradidoID: string, name: string) => ({
  communityUuid: FOREIGN_COMMUNITY,
  gradidoID,
  name,
})

beforeAll(async () => {
  await appDB.init()
  await clearDatabase()
  await createCommunity(false)
  bibi = await userFactory(bibiBloxberg)
  peter = await userFactory(peterLustig)
  bob = await userFactory(bobBaumeister)

  // A creation for bibi: booked with nobody, must never become a contact.
  await creationFactory(
    {
      email: 'bibi@bloxberg.de',
      amount: 1000,
      memo: 'Herzlich Willkommen bei Gradido!',
      contributionDate: nMonthsBefore(new Date()),
      confirmed: true,
      moveCreationDate: 12,
    },
    bibi,
    peter,
  )
  // ⚠️ From here on the dates only go FORWARD. Every seeded booking takes its balance
  // from the member's last one and computes the decay between the two, and decay does not
  // run backwards -- a booking dated before the previous one throws.
  //
  // The oldest contact of all: a foreign booking that stored an assembled real name.
  await foreignReceive(bibi, fromAfar(ANNA, 'Anna Müller'), day(0))
  // Three bookings with peter, two with bob, in a deliberate order of dates.
  await transferGradidos(bibi, peter, new GradidoUnit(100000n), 'one', day(1))
  await transferGradidos(bibi, bob, new GradidoUnit(50000n), 'two', day(2))
  await transferGradidos(peter, bibi, new GradidoUnit(20000n), 'three', day(3))
  await transferGradidos(bibi, peter, new GradidoUnit(30000n), 'four', day(4))
  await transferGradidos(bob, bibi, new GradidoUnit(10000n), 'five', day(5))
  // Two bookings from one foreign member, who renamed herself in between.
  await foreignReceive(bibi, fromAfar(SARAH, 'Sarah'), day(6))
  await foreignReceive(bibi, fromAfar(SARAH, 'SarahP'), day(7))
  await foreignReceive(bibi, fromAfar(TINA, 'TinaP'), day(7))
})

afterAll(async () => {
  await clearDatabase()
  await appDB.destroy()
})

describe('dbSelectContactsByUserId', () => {
  it('lists every counterparty once, newest contact first, with dates and counts', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, { limit: 25, offset: 0 })
    expect(page.count).toBe(5)
    // Tina and Sarah share the newest date; the uuid pair decides between them, descending
    // with the rest.
    expect(page.contacts.map((c) => c.gradidoId)).toEqual([
      TINA,
      SARAH,
      bob.gradidoID,
      peter.gradidoID,
      ANNA,
    ])

    const [, sarah, bobRow, peterRow] = page.contacts
    // peter's seed carries no alias, so the joined users row answers null -- asserted as
    // null on purpose: `peter.alias` on the saved entity is undefined, and toMatchObject
    // tells the two apart.
    expect(peterRow).toMatchObject({ linkedUserId: peter.id, alias: null, bookings: 3 })
    expect(peterRow.firstAt.getTime()).toBe(day(1).getTime())
    expect(peterRow.lastAt.getTime()).toBe(day(4).getTime())
    expect(bobRow).toMatchObject({ linkedUserId: bob.id, bookings: 2 })
    expect(bobRow.lastAt.getTime()).toBe(day(5).getTime())
    // The foreign member: no local id, the pair off the booking, the NEWEST name.
    expect(sarah).toMatchObject({
      linkedUserId: null,
      communityUuid: FOREIGN_COMMUNITY,
      alias: 'SarahP',
      bookings: 2,
    })
  })

  it('turns the order around when asked, oldest contact first', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, { limit: 25, offset: 0, order: 'ASC' })
    // The exact reverse of the default order, tie included.
    expect(page.contacts.map((c) => c.gradidoId)).toEqual([
      ANNA,
      peter.gradidoID,
      bob.gradidoID,
      SARAH,
      TINA,
    ])
    // And the page is taken off the reversed list, not off the default one.
    const first = await dbSelectContactsByUserId(bibi.id, { limit: 1, offset: 0, order: 'ASC' })
    expect(first.contacts[0].gradidoId).toBe(ANNA)
  })

  it('does not count the creation as a contact', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, { limit: 25, offset: 0 })
    expect(page.contacts.some((c) => c.bookings > 3)).toBe(false)
    expect(page.count).toBe(5)
  })

  it('keeps a stored real name out of the list and out of the search (NU-019)', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, { limit: 25, offset: 0 })
    const anna = page.contacts.find((c) => c.gradidoId === ANNA)
    // She is a contact -- the booking is real -- but the row names her by nothing.
    expect(anna).toMatchObject({
      linkedUserId: null,
      communityUuid: FOREIGN_COMMUNITY,
      alias: null,
    })
    // And the search cannot be used as an oracle on what the row does not show.
    const probe = await dbSelectContactsByUserId(bibi.id, { search: 'müll', limit: 25, offset: 0 })
    expect(probe.count).toBe(0)
    expect(probe.contacts).toEqual([])
  })

  it('shows the other side the same booking, from their view', async () => {
    const page = await dbSelectContactsByUserId(bob.id, { limit: 25, offset: 0 })
    expect(page.count).toBe(1)
    expect(page.contacts[0]).toMatchObject({ linkedUserId: bibi.id, bookings: 2 })
  })

  // ⛔ Two contacts share the newest date here, and every page is a separate request. An
  // order that leaves a tie to the storage engine puts such a contact on both pages or on
  // neither -- which is why the pair breaks the tie.
  it('pages without repeating or dropping anybody, tie included', async () => {
    const first = await dbSelectContactsByUserId(bibi.id, { limit: 3, offset: 0 })
    const second = await dbSelectContactsByUserId(bibi.id, { limit: 3, offset: 3 })
    expect(first.count).toBe(5)
    expect(first.contacts).toHaveLength(3)
    expect(second.contacts).toHaveLength(2)
    const all = [...first.contacts, ...second.contacts].map((c) => c.gradidoId)
    expect(new Set(all).size).toBe(5)
    // The two tied contacts land on the same page, in the order the pair gives them.
    expect(first.contacts.map((c) => c.gradidoId).slice(0, 2)).toEqual([TINA, SARAH])
  })

  it('searches the alias, case-insensitively, and counts only what matches', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, {
      search: 'sarah',
      limit: 25,
      offset: 0,
    })
    expect(page.count).toBe(1)
    expect(page.contacts[0].gradidoId).toBe(SARAH)
    const nobody = await dbSelectContactsByUserId(bibi.id, { search: 'zzz', limit: 25, offset: 0 })
    expect(nobody.count).toBe(0)
    expect(nobody.contacts).toEqual([])
  })

  it('answers an empty list for a member without any booking', async () => {
    const page = await dbSelectContactsByUserId(999999, { limit: 25, offset: 0 })
    expect(page).toEqual({ contacts: [], count: 0 })
  })
})

describe('dbSelectTransactionsByUserId narrowed to one counterparty', () => {
  /** What the resolver hands the query: the pair, and the users row carrying it if any. */
  const withMember = async (communityUuid: string, gradidoId: string) => ({
    localUserId: await dbFindUserIdByUuids(communityUuid, gradidoId),
    gradidoId,
    communityUuid,
  })
  const page = (userId: number, counterparty: Awaited<ReturnType<typeof withMember>>) =>
    dbSelectTransactionsByUserId(userId, 25, 0, 'DESC', counterparty)

  it('leaves the whole list alone when nobody is named', async () => {
    const [rows, count] = await dbSelectTransactionsByUserId(bibi.id, 25, 0, 'DESC')
    // The creation, five local bookings, four foreign ones.
    expect(count).toBe(10)
    expect(rows).toHaveLength(10)
  })

  it('counts what the contact window counts for a member of this community', async () => {
    const peterRef = await withMember(peter.communityUuid as string, peter.gradidoID)
    expect(peterRef.localUserId).toBe(peter.id)
    const [rows, count] = await page(bibi.id, peterRef)
    // Three bookings -- NOT four: the creation carries peter's id as the confirming
    // moderator, and the window does not count it either.
    expect(count).toBe(3)
    expect(rows.map((row) => row.memo)).toEqual(['four', 'three', 'one'])
    expect(rows.every((row) => row.linkedUserId === peter.id)).toBe(true)
    expect(
      rows.every((row) => [TransactionTypeId.SEND, TransactionTypeId.RECEIVE].includes(row.typeId)),
    ).toBe(true)
  })

  it('counts what the contact window counts for a member of another community', async () => {
    const sarah = await withMember(FOREIGN_COMMUNITY, SARAH)
    expect(sarah.localUserId).toBeNull()
    const [rows, count] = await page(bibi.id, sarah)
    expect(count).toBe(2)
    // Newest first, so the row on top is the one the window calls "last".
    expect(rows.map((row) => row.linkedUserName)).toEqual(['SarahP', 'Sarah'])
  })

  it('pages the narrowed list, and the count stays the narrowed one', async () => {
    const peterRef = await withMember(peter.communityUuid as string, peter.gradidoID)
    const [first, count] = await dbSelectTransactionsByUserId(bibi.id, 2, 0, 'DESC', peterRef)
    const [second] = await dbSelectTransactionsByUserId(bibi.id, 2, 2, 'DESC', peterRef)
    expect(count).toBe(3)
    expect(first.map((row) => row.memo)).toEqual(['four', 'three'])
    expect(second.map((row) => row.memo)).toEqual(['one'])
  })

  // ⛔ The property `bookingsWhere` exists to keep: the caller's own id stands in every
  // branch. bibi booked with peter and with Sarah; bob did with neither. A branch without
  // `userId` would show bob bibi's bookings -- once per branch, so both are tried.
  it("shows nobody another member's bookings", async () => {
    const [byRow, rowCount] = await page(
      bob.id,
      await withMember(peter.communityUuid as string, peter.gradidoID),
    )
    expect(rowCount).toBe(0)
    expect(byRow).toEqual([])
    const [byPair, pairCount] = await page(bob.id, await withMember(FOREIGN_COMMUNITY, SARAH))
    expect(pairCount).toBe(0)
    expect(byPair).toEqual([])
  })

  it('answers an empty list, not the whole one, for a pair nobody is stored under', async () => {
    const nobody = await withMember(FOREIGN_COMMUNITY, '00000000-0000-0000-0000-000000000000')
    expect(nobody.localUserId).toBeNull()
    const [rows, count] = await page(bibi.id, nobody)
    expect(count).toBe(0)
    expect(rows).toEqual([])
  })
})
