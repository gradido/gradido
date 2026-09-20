// AI-GENERATED — not an architecture reference
import { ContactOrigin, GradidoUnit, Order } from 'shared'
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
/**
 * A foreign member the federation eventually stored a `users` row for -- so PETER's
 * bookings with her exist in both shapes, and the two groupings find her twice.
 *
 * ⚠️ Seeded on peter and nobody else, so that every count and every order this file
 * already asserts for bibi and bob stays exactly as it was.
 */
const LOTTE = 'aaaaaaaa-1111-2222-3333-444444444444'
let lotteRowId: number

const day = (n: number): Date => new Date(Date.UTC(2026, 7, n, 12, 0, 0))

/**
 * What the resolver hands either query: the pair, and the users row carrying it if any.
 *
 * At module scope because BOTH narrowings take it -- the booking list and the contact
 * behind the window over it. One definition here is what lets the test below hold the two
 * against each other.
 */
const withMember = async (communityUuid: string, gradidoId: string) => ({
  localUserId: await dbFindUserIdByUuids(communityUuid, gradidoId),
  gradidoId,
  communityUuid,
})

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

  // ★ The split person, on peter. First the booking from before her row existed -- no
  // `linked_user_id`, the pair on the booking. Then the row the federation stored, and a
  // booking from after it, which carries the id the way settlePendingReceiveTransaction
  // writes it. One person, two groupings.
  await foreignReceive(peter, fromAfar(LOTTE, 'Lotte'), day(8))
  const lotteRow = new DbUser()
  lotteRow.gradidoID = LOTTE
  lotteRow.communityUuid = FOREIGN_COMMUNITY
  lotteRow.alias = 'lotte'
  lotteRow.foreign = true
  await lotteRow.save()
  lotteRowId = lotteRow.id
  await foreignReceive(peter, { ...fromAfar(LOTTE, 'Lotte'), linkedUserId: lotteRowId }, day(9))
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
    const page = await dbSelectContactsByUserId(bibi.id, { limit: 25, offset: 0, order: Order.ASC })
    // The exact reverse of the default order, tie included.
    expect(page.contacts.map((c) => c.gradidoId)).toEqual([
      ANNA,
      peter.gradidoID,
      bob.gradidoID,
      SARAH,
      TINA,
    ])
    // And the page is taken off the reversed list, not off the default one.
    const first = await dbSelectContactsByUserId(bibi.id, { limit: 1, offset: 0, order: Order.ASC })
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

/**
 * ⛔ One person, however many groupings found them (KF-004: each person once).
 *
 * A member of another community whose `users` row the federation stored partway through has
 * bookings of both shapes, and the two groupings each hold a PART of the figures. The
 * booking list has always united them (`bookingsWhere`), so an unmerged contact list stated
 * a count that its own link could not show. (coderabbit, PR #3842.)
 */
describe('dbSelectContactsByUserId with a person both groupings found', () => {
  it('lists her once, with every booking counted', async () => {
    const page = await dbSelectContactsByUserId(peter.id, { limit: 25, offset: 0 })

    const lotte = page.contacts.filter((c) => c.gradidoId === LOTTE)
    expect(lotte).toHaveLength(1)
    expect(lotte[0]).toMatchObject({
      // The half with the users row wins the identity, so the caller reads her CURRENT
      // alias and picture rather than the name one booking happened to record.
      linkedUserId: lotteRowId,
      communityUuid: FOREIGN_COMMUNITY,
      alias: 'lotte',
      bookings: 2,
    })
    // Oldest of the two, newest of the two -- not one grouping's pair of dates.
    expect(lotte[0].firstAt.getTime()).toBe(day(8).getTime())
    expect(lotte[0].lastAt.getTime()).toBe(day(9).getTime())
  })

  it('counts her once in the page count as well', async () => {
    const page = await dbSelectContactsByUserId(peter.id, { limit: 25, offset: 0 })
    // bibi and Lotte. Three rows before merging, which is what a page of 25 would have
    // shown and what every later page would have been off by.
    expect(page.count).toBe(2)
    expect(page.contacts).toHaveLength(2)
  })

  // ⛔⛔ The property the whole delivery rests on, at the one shape that used to break it.
  it('states exactly as many bookings as the narrowed booking list has', async () => {
    const counterparty = await withMember(FOREIGN_COMMUNITY, LOTTE)
    // The pair resolves to the stored row, so BOTH branches of bookingsWhere can match.
    expect(counterparty.localUserId).toBe(lotteRowId)

    const contacts = await dbSelectContactsByUserId(peter.id, {
      counterparty,
      limit: 25,
      offset: 0,
    })
    const [, bookings] = await dbSelectTransactionsByUserId(
      peter.id,
      25,
      0,
      Order.DESC,
      counterparty,
    )

    expect(contacts.count).toBe(1)
    expect(contacts.contacts[0].bookings).toBe(bookings)
    expect(bookings).toBe(2)
  })
})

describe('dbSelectContactsByUserId narrowed to one counterparty', () => {
  const contactFor = (userId: number, counterparty: Awaited<ReturnType<typeof withMember>>) =>
    dbSelectContactsByUserId(userId, { counterparty, limit: 25, offset: 0 })

  it('answers one contact for a member of this community, by their users row', async () => {
    const peterRef = await withMember(peter.communityUuid as string, peter.gradidoID)
    expect(peterRef.localUserId).toBe(peter.id)
    const page = await contactFor(bibi.id, peterRef)
    expect(page.count).toBe(1)
    expect(page.contacts[0]).toMatchObject({ linkedUserId: peter.id, bookings: 3 })
    expect(page.contacts[0].firstAt.getTime()).toBe(day(1).getTime())
    expect(page.contacts[0].lastAt.getTime()).toBe(day(4).getTime())
  })

  it('answers one contact for a member of another community, by the pair', async () => {
    const sarah = await withMember(FOREIGN_COMMUNITY, SARAH)
    expect(sarah.localUserId).toBeNull()
    const page = await contactFor(bibi.id, sarah)
    expect(page.count).toBe(1)
    expect(page.contacts[0]).toMatchObject({
      linkedUserId: null,
      communityUuid: FOREIGN_COMMUNITY,
      alias: 'SarahP',
      bookings: 2,
    })
  })

  it('answers nothing for a pair nobody booked with', async () => {
    const nobody = await withMember(FOREIGN_COMMUNITY, '00000000-0000-0000-0000-000000000000')
    const page = await contactFor(bibi.id, nobody)
    expect(page).toEqual({ contacts: [], count: 0 })
  })

  // ⛔ The same property `bookingsWhere` keeps, in the grouped domain: the answer is built
  // from the CALLER's own bookings and nobody else's. bibi booked with peter, bob did not.
  it("does not answer about another member's contact", async () => {
    const peterRef = await withMember(peter.communityUuid as string, peter.gradidoID)
    const page = await contactFor(bob.id, peterRef)
    expect(page).toEqual({ contacts: [], count: 0 })
  })

  // ⛔⛔ The one guard that holds the two rules together. The contact window states this
  // count and the link under it opens the booking list narrowed by `bookingsWhere`; if
  // `isContactCounterparty` and that where clause ever part company, the window puts a
  // number over a list of a different length and neither screen says which is wrong.
  // Every kind of contact in the seed is tried, local and foreign, named and unnamed.
  it('states exactly as many bookings as the narrowed booking list has', async () => {
    const everyone: [string, string][] = [
      [peter.communityUuid as string, peter.gradidoID],
      [bob.communityUuid as string, bob.gradidoID],
      [FOREIGN_COMMUNITY, SARAH],
      [FOREIGN_COMMUNITY, ANNA],
      [FOREIGN_COMMUNITY, TINA],
    ]
    for (const [communityUuid, gradidoId] of everyone) {
      const counterparty = await withMember(communityUuid, gradidoId)
      const contacts = await contactFor(bibi.id, counterparty)
      const [, bookings] = await dbSelectTransactionsByUserId(
        bibi.id,
        25,
        0,
        Order.DESC,
        counterparty,
      )
      expect(contacts.count).toBe(1)
      expect(contacts.contacts[0].bookings).toBe(bookings)
    }
  })
})

describe('dbSelectTransactionsByUserId narrowed to one counterparty', () => {
  const page = (userId: number, counterparty: Awaited<ReturnType<typeof withMember>>) =>
    dbSelectTransactionsByUserId(userId, 25, 0, Order.DESC, counterparty)

  it('leaves the whole list alone when nobody is named', async () => {
    const [rows, count] = await dbSelectTransactionsByUserId(bibi.id, 25, 0, Order.DESC)
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
    const [first, count] = await dbSelectTransactionsByUserId(bibi.id, 2, 0, Order.DESC, peterRef)
    const [second] = await dbSelectTransactionsByUserId(bibi.id, 2, 2, Order.DESC, peterRef)
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

/**
 * The second source: people the referral trace puts beside this member, with and without
 * bookings behind them (KF-012).
 *
 * ⚠️ LAST in the file and it puts every column it touches back, because it writes
 * `referrer_id` onto members the blocks above count and order. Its own member is created
 * here rather than in the shared fixture for the same reason -- an extra row in `users`
 * would move the counts those blocks assert.
 */
describe('dbSelectContactsByUserId with the referral trace', () => {
  let carla: DbUser

  beforeAll(async () => {
    // Nobody has exchanged anything with her: the whole reason she is a contact is that she
    // came here over bibi.
    carla = await userFactory({
      email: 'carla@arrival.de',
      alias: 'carlaSunshine',
      emailChecked: true,
      createdAt: day(10),
    })
    await DbUser.update(carla.id, { referrerId: bibi.id })
    // bob came over bibi AND has two bookings with her: one contact, both truths. His
    // registration is dated after both of them, so the joined span has to reach forward.
    await DbUser.update(bob.id, { referrerId: bibi.id, createdAt: day(11) })
    // The other direction: peter showed bibi Gradido, and they have booked three times.
    await DbUser.update(bibi.id, { referrerId: peter.id })
  })

  afterAll(async () => {
    await DbUser.update([carla.id, bob.id, bibi.id], { referrerId: null })
    await DbUser.update(bob.id, { createdAt: bob.createdAt })
  })

  const contactsOf = async (userId: number) =>
    (await dbSelectContactsByUserId(userId, { limit: 25, offset: 0 })).contacts

  it('adds somebody with no bookings at all as a contact of their own', async () => {
    const carlaRow = (await contactsOf(bibi.id)).find((c) => c.linkedUserId === carla.id)
    expect(carlaRow).toMatchObject({
      linkedUserId: carla.id,
      gradidoId: carla.gradidoID,
      alias: 'carlaSunshine',
      bookings: 0,
      origin: ContactOrigin.ARRIVAL,
      deletedAt: null,
    })
    // One moment, not a span: an arrival happened once.
    expect(carlaRow?.firstAt.getTime()).toBe(day(10).getTime())
    expect(carlaRow?.lastAt.getTime()).toBe(day(10).getTime())
  })

  it('joins a booking counterparty and an arrival into ONE contact', async () => {
    const rows = (await contactsOf(bibi.id)).filter((c) => c.linkedUserId === bob.id)
    expect(rows).toHaveLength(1)
    // The bookings are untouched by the second source, and the origin came along.
    expect(rows[0]).toMatchObject({ bookings: 2, origin: ContactOrigin.ARRIVAL })
    // Oldest of both sources, newest of both -- not one source's pair of dates.
    expect(rows[0].firstAt.getTime()).toBe(day(2).getTime())
    expect(rows[0].lastAt.getTime()).toBe(day(11).getTime())
  })

  it("joins the other direction too, and dates it with the asking member's arrival", async () => {
    const rows = (await contactsOf(bibi.id)).filter((c) => c.linkedUserId === peter.id)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ bookings: 3, origin: ContactOrigin.REFERRER })
    // bibi registered in 2021, long before the first booking with peter.
    expect(rows[0].firstAt.getTime()).toBe(bibi.createdAt.getTime())
    expect(rows[0].lastAt.getTime()).toBe(day(4).getTime())
  })

  it('leaves a contact that is only a booking without an origin', async () => {
    const anna = (await contactsOf(bibi.id)).find((c) => c.gradidoId === ANNA)
    expect(anna).toMatchObject({ bookings: 1, origin: null })
  })

  it('counts the new person once, and nobody twice', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, { limit: 25, offset: 0 })
    // The five from the bookings plus carla; bob and peter were contacts already.
    expect(page.count).toBe(6)
    expect(page.contacts).toHaveLength(6)
    expect(new Set(page.contacts.map((c) => c.gradidoId)).size).toBe(6)
  })

  it('pages over the joined list without a duplicate or a gap', async () => {
    const first = await dbSelectContactsByUserId(bibi.id, { limit: 3, offset: 0 })
    const second = await dbSelectContactsByUserId(bibi.id, { limit: 3, offset: 3 })
    const seen = [...first.contacts, ...second.contacts].map((c) => c.gradidoId)
    expect(seen).toHaveLength(6)
    expect(new Set(seen).size).toBe(6)
  })

  it('finds her by her alias, like any other contact', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, {
      search: 'sunshine',
      limit: 25,
      offset: 0,
    })
    expect(page.count).toBe(1)
    expect(page.contacts[0].linkedUserId).toBe(carla.id)
  })

  it('answers her by the pair, which is what the contact window asks with', async () => {
    const carlaRef = await withMember(carla.communityUuid as string, carla.gradidoID)
    expect(carlaRef.localUserId).toBe(carla.id)
    const page = await dbSelectContactsByUserId(bibi.id, {
      counterparty: carlaRef,
      limit: 25,
      offset: 0,
    })
    expect(page.count).toBe(1)
    expect(page.contacts[0]).toMatchObject({ bookings: 0, origin: ContactOrigin.ARRIVAL })
    // ⛔ And the booking list behind it is empty, which is the two rules agreeing. The
    // window must therefore not draw a link to it -- see ContactWindow.vue.
    const [, bookings] = await dbSelectTransactionsByUserId(bibi.id, 25, 0, Order.DESC, carlaRef)
    expect(bookings).toBe(0)
  })

  it('is not a contact of somebody who only shares the referrer', async () => {
    // carla and bob both came over bibi. That makes each of them a contact of BIBI, not of
    // each other -- they share no event.
    const carlaSees = (await contactsOf(carla.id)).map((c) => c.linkedUserId)
    expect(carlaSees).toEqual([bibi.id])
  })
})
