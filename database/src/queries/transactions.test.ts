// AI-GENERATED — not an architecture reference
import { and, eq } from 'drizzle-orm'
import { ContactOrigin, GradidoUnit, Order } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { clearDatabase } from '../../migration/clear'
import { User as DbUser, UserContact as DbUserContact } from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { TransactionTypeId } from '../enum'
import { transactionsTable } from '../schemas'
import { createCommunity } from '../seeds/community'
import { creationFactory, nMonthsBefore } from '../seeds/factory/creation'
import { foreignReceive, transferGradidos } from '../seeds/factory/transaction'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { garrickOllivander } from '../seeds/users/garrick-ollivander'
import { peterLustig } from '../seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '../seeds/users/raeuber-hotzenplotz'
import { stephenHawking } from '../seeds/users/stephen-hawking'
import { dbUpdateChatConversationMemberLastRead } from './chatConversationMembers'
import { dbEnsureDirectChatConversation } from './chatConversations'
import { dbInsertChatMessage } from './chatMessages'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'
import {
  dbCountAndSumTransactionsOfType,
  dbCountAndSumTransactionsOfTypeByWeek,
  dbSelectBookingLinesOfUser,
  dbSelectContactsByUserId,
  dbSelectReceivedTransferOfUser,
  dbSelectTransactionsByUserId,
} from './transactions'
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

/**
 * The asking member's own pair -- what the contact query asks the chat bundle with, beside
 * the id it asks everything else with. The same person, in the form conversation members
 * are stored in.
 */
const memberOf = (user: DbUser) => ({
  communityUuid: user.communityUuid as string,
  gradidoId: user.gradidoID,
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
    const page = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      limit: 25,
      offset: 0,
    })
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
    const page = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      limit: 25,
      offset: 0,
      order: Order.ASC,
    })
    // The exact reverse of the default order, tie included.
    expect(page.contacts.map((c) => c.gradidoId)).toEqual([
      ANNA,
      peter.gradidoID,
      bob.gradidoID,
      SARAH,
      TINA,
    ])
    // And the page is taken off the reversed list, not off the default one.
    const first = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      limit: 1,
      offset: 0,
      order: Order.ASC,
    })
    expect(first.contacts[0].gradidoId).toBe(ANNA)
  })

  // The line under each name (E-083): the newest booking with each contact, and when it was booked.
  it('points at the newest booking with each contact', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      limit: 25,
      offset: 0,
    })
    const byId = Object.fromEntries(page.contacts.map((c) => [c.gradidoId, c]))
    const lines = await dbSelectBookingLinesOfUser(
      bibi.id,
      page.contacts.map((c) => c.lastBookingId).filter((id): id is number => id !== null),
    )
    const memoOf = (gradidoId: string) =>
      lines.find((line) => line.id === byId[gradidoId].lastBookingId)?.memo
    // Three bookings with peter, the newest "four"; two with bob, the newest "five".
    expect(memoOf(peter.gradidoID)).toBe('four')
    expect(memoOf(bob.gradidoID)).toBe('five')
    expect(byId[peter.gradidoID].lastBookingAt?.getTime()).toBe(day(4).getTime())
    // A member of another community: the newest of her two bookings.
    expect(byId[SARAH].lastBookingAt?.getTime()).toBe(day(7).getTime())
    expect(lines.find((line) => line.id === byId[SARAH].lastBookingId)?.balanceDate.getTime()).toBe(
      day(7).getTime(),
    )
    // Nobody here was written with: no message to point at.
    expect(page.contacts.every((c) => c.lastChatMessageId === null)).toBe(true)
  })

  it('does not count the creation as a contact', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      limit: 25,
      offset: 0,
    })
    expect(page.contacts.some((c) => c.bookings > 3)).toBe(false)
    expect(page.count).toBe(5)
  })

  it('keeps a stored real name out of the list and out of the search (NU-019)', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      limit: 25,
      offset: 0,
    })
    const anna = page.contacts.find((c) => c.gradidoId === ANNA)
    // She is a contact -- the booking is real -- but the row names her by nothing.
    expect(anna).toMatchObject({
      linkedUserId: null,
      communityUuid: FOREIGN_COMMUNITY,
      alias: null,
    })
    // And the search cannot be used as an oracle on what the row does not show.
    const probe = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      search: 'müll',
      limit: 25,
      offset: 0,
    })
    expect(probe.count).toBe(0)
    expect(probe.contacts).toEqual([])
  })

  it('shows the other side the same booking, from their view', async () => {
    const page = await dbSelectContactsByUserId(bob.id, {
      member: memberOf(bob),
      limit: 25,
      offset: 0,
    })
    expect(page.count).toBe(1)
    expect(page.contacts[0]).toMatchObject({ linkedUserId: bibi.id, bookings: 2 })
  })

  // ⛔ Two contacts share the newest date here, and every page is a separate request. An
  // order that leaves a tie to the storage engine puts such a contact on both pages or on
  // neither -- which is why the pair breaks the tie.
  it('pages without repeating or dropping anybody, tie included', async () => {
    const first = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      limit: 3,
      offset: 0,
    })
    const second = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      limit: 3,
      offset: 3,
    })
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
      member: memberOf(bibi),
      search: 'sarah',
      limit: 25,
      offset: 0,
    })
    expect(page.count).toBe(1)
    expect(page.contacts[0].gradidoId).toBe(SARAH)
    const nobody = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      search: 'zzz',
      limit: 25,
      offset: 0,
    })
    expect(nobody.count).toBe(0)
    expect(nobody.contacts).toEqual([])
  })

  it('answers an empty list for a member without any booking', async () => {
    const page = await dbSelectContactsByUserId(999999, {
      member: {
        communityUuid: FOREIGN_COMMUNITY,
        gradidoId: 'bbbbbbbb-0000-4000-8000-000000000000',
      },
      limit: 25,
      offset: 0,
    })
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
    const page = await dbSelectContactsByUserId(peter.id, {
      member: memberOf(peter),
      limit: 25,
      offset: 0,
    })

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
    // And the newest booking is the newest of both groupings, whichever was seen first (E-083).
    expect(lotte[0].lastBookingAt?.getTime()).toBe(day(9).getTime())
    const [line] = await dbSelectBookingLinesOfUser(peter.id, [lotte[0].lastBookingId as number])
    expect(line.balanceDate.getTime()).toBe(day(9).getTime())
  })

  it('counts her once in the page count as well', async () => {
    const page = await dbSelectContactsByUserId(peter.id, {
      member: memberOf(peter),
      limit: 25,
      offset: 0,
    })
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
      member: memberOf(peter),
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
  const contactFor = (user: DbUser, counterparty: Awaited<ReturnType<typeof withMember>>) =>
    dbSelectContactsByUserId(user.id, {
      member: memberOf(user),
      counterparty,
      limit: 25,
      offset: 0,
    })

  it('answers one contact for a member of this community, by their users row', async () => {
    const peterRef = await withMember(peter.communityUuid as string, peter.gradidoID)
    expect(peterRef.localUserId).toBe(peter.id)
    const page = await contactFor(bibi, peterRef)
    expect(page.count).toBe(1)
    expect(page.contacts[0]).toMatchObject({ linkedUserId: peter.id, bookings: 3 })
    expect(page.contacts[0].firstAt.getTime()).toBe(day(1).getTime())
    expect(page.contacts[0].lastAt.getTime()).toBe(day(4).getTime())
  })

  it('answers one contact for a member of another community, by the pair', async () => {
    const sarah = await withMember(FOREIGN_COMMUNITY, SARAH)
    expect(sarah.localUserId).toBeNull()
    const page = await contactFor(bibi, sarah)
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
    const page = await contactFor(bibi, nobody)
    expect(page).toEqual({ contacts: [], count: 0 })
  })

  // ⛔ The same property `bookingsWhere` keeps, in the grouped domain: the answer is built
  // from the CALLER's own bookings and nobody else's. bibi booked with peter, bob did not.
  it("does not answer about another member's contact", async () => {
    const peterRef = await withMember(peter.communityUuid as string, peter.gradidoID)
    const page = await contactFor(bob, peterRef)
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
      const contacts = await contactFor(bibi, counterparty)
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
 * The row a reaction to a transfer hangs on (migration 0159): the member's own RECEIVE booking.
 * Only the recipient of a transfer reacts to it, and this read is how a caller is known to be
 * one.
 */
describe('dbSelectReceivedTransferOfUser', () => {
  /** The bookings of a member with this memo, newest first, as their own list has them. */
  const bookingsOf = async (user: DbUser) =>
    (await dbSelectTransactionsByUserId(user.id, 50, 0, Order.DESC))[0]
  const rowOf = async (user: DbUser, typeId: TransactionTypeId, memo: string) => {
    const found = (await bookingsOf(user)).find(
      (booking) => booking.typeId === typeId && booking.memo === memo,
    )
    if (!found) {
      throw new Error(`fixture: no ${typeId} booking "${memo}"`)
    }
    return found
  }

  it("finds the recipient's own RECEIVE row, and that its sender is a member here", async () => {
    // Peter sent "three" to Bibi.
    const received = await rowOf(bibi, TransactionTypeId.RECEIVE, 'three')

    const found = await dbSelectReceivedTransferOfUser(received.id, bibi.id)

    expect(found).toEqual({
      success: true,
      value: { id: received.id, senderIsMemberHere: true },
    })
  })

  // ⛔ Only the recipient: the sender holds the transfer too, as a SEND row.
  it('finds nothing for the sender, neither by their own row nor by the recipient’s', async () => {
    const received = await rowOf(bibi, TransactionTypeId.RECEIVE, 'three')
    const sent = await rowOf(peter, TransactionTypeId.SEND, 'three')

    for (const id of [sent.id, received.id]) {
      const refused = await dbSelectReceivedTransferOfUser(id, peter.id)
      expect(refused.success).toBe(false)
      expect(!refused.success && refused.error.name).toBe('DBNotFoundError')
    }
  })

  it('finds nothing for a member the transfer is not between', async () => {
    const received = await rowOf(bibi, TransactionTypeId.RECEIVE, 'three')

    expect((await dbSelectReceivedTransferOfUser(received.id, bob.id)).success).toBe(false)
  })

  it("finds nothing for the member's own SEND row, a creation, or an id without a booking", async () => {
    const sent = await rowOf(bibi, TransactionTypeId.SEND, 'one')
    const creation = (await bookingsOf(bibi)).find(
      (booking) => booking.typeId === TransactionTypeId.CREATION,
    )

    expect((await dbSelectReceivedTransferOfUser(sent.id, bibi.id)).success).toBe(false)
    expect(creation).toBeDefined()
    expect((await dbSelectReceivedTransferOfUser(creation?.id as number, bibi.id)).success).toBe(
      false,
    )
    expect((await dbSelectReceivedTransferOfUser(4_000_000_000, bibi.id)).success).toBe(false)
  })

  // A transfer from another community is found as the member's own -- and says that its
  // sender is no member here: what follows from that is not this query's to decide.
  it('finds a transfer from another community, whose sender is no member here', async () => {
    const received = (await bookingsOf(bibi)).find(
      (booking) => booking.linkedUserGradidoID === SARAH,
    )

    expect(await dbSelectReceivedTransferOfUser(received?.id as number, bibi.id)).toEqual({
      success: true,
      value: { id: received?.id, senderIsMemberHere: false },
    })
  })

  // ⛔ By this server's own row of the sender, not by what the booking says: `users` holds
  // rows for members of other communities too, and a booking may carry such an id (LOTTE on
  // peter) -- an id is no proof of a member of this community.
  it('takes a sender the federation stored a row for as no member here, with or without the id on the booking', async () => {
    const fromLotte = (await bookingsOf(peter)).filter(
      (booking) => booking.linkedUserGradidoID === LOTTE,
    )
    expect(fromLotte.map((booking) => booking.linkedUserId).sort()).toEqual(
      [null, lotteRowId].sort(),
    )

    for (const booking of fromLotte) {
      expect(await dbSelectReceivedTransferOfUser(booking.id, peter.id)).toEqual({
        success: true,
        value: { id: booking.id, senderIsMemberHere: false },
      })
    }
  })
})

/**
 * The second source: people the referral trace puts beside this member, with and without
 * bookings behind them (KF-012).
 *
 * ⚠️ LAST in the file, and it undoes everything it does: it writes `referrer_id` and
 * `created_at` onto members the blocks above count and order, and it creates a member of
 * its own rather than adding one to the shared fixture -- an extra row in `users` would
 * move the counts those blocks assert. Both are put back in `afterAll`, which is what lets
 * the next person add a describe below this one.
 *
 * ⛔ Every registration date here is EARLIER than the bookings of the same member, because
 * that is the only order production can produce: an account has to exist before it can
 * book. A fixture that registers somebody after their bookings pins a state that cannot
 * occur -- and hides the one the merge really does, which is `firstAt` reaching BACK to
 * the registration while `lastAt` stays on the last booking.
 */
describe('dbSelectContactsByUserId with the referral trace', () => {
  let carla: DbUser

  /** Before day(0), so bob's registration is older than every booking of his. */
  const bobArrived = new Date(Date.UTC(2026, 6, 20, 12, 0, 0))

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
    // bob came over bibi AND has two bookings with her: one contact, both truths. He
    // registered before he could book, so the joined span reaches BACK to that day.
    await DbUser.update(bob.id, { referrerId: bibi.id, createdAt: bobArrived })
    // The other direction: peter showed bibi Gradido, and they have booked three times.
    await DbUser.update(bibi.id, { referrerId: peter.id })
  })

  afterAll(async () => {
    await DbUser.update([carla.id, bob.id, bibi.id], { referrerId: null })
    await DbUser.update(bob.id, { createdAt: bob.createdAt })
    // The member this block created, and the address row that came with her.
    await DbUser.delete(carla.id)
    await DbUserContact.delete({ userId: carla.id })
  })

  const contactsOf = async (user: DbUser) =>
    (await dbSelectContactsByUserId(user.id, { member: memberOf(user), limit: 25, offset: 0 }))
      .contacts

  it('adds somebody with no bookings at all as a contact of their own', async () => {
    const carlaRow = (await contactsOf(bibi)).find((c) => c.linkedUserId === carla.id)
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
    const rows = (await contactsOf(bibi)).filter((c) => c.linkedUserId === bob.id)
    expect(rows).toHaveLength(1)
    // The bookings are untouched by the second source, and the origin came along.
    expect(rows[0]).toMatchObject({ bookings: 2, origin: ContactOrigin.ARRIVAL })
    // Oldest of both sources, newest of both -- not one source's pair of dates. The
    // registration reaches back before the first booking; the last booking stays the last.
    expect(rows[0].firstAt.getTime()).toBe(bobArrived.getTime())
    expect(rows[0].lastAt.getTime()).toBe(day(5).getTime())
  })

  it("joins the other direction too, and dates it with the asking member's arrival", async () => {
    const rows = (await contactsOf(bibi)).filter((c) => c.linkedUserId === peter.id)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ bookings: 3, origin: ContactOrigin.REFERRER })
    // bibi registered in 2021, long before the first booking with peter.
    expect(rows[0].firstAt.getTime()).toBe(bibi.createdAt.getTime())
    expect(rows[0].lastAt.getTime()).toBe(day(4).getTime())
  })

  it('leaves a contact that is only a booking without an origin', async () => {
    const anna = (await contactsOf(bibi)).find((c) => c.gradidoId === ANNA)
    expect(anna).toMatchObject({ bookings: 1, origin: null })
  })

  it('counts the new person once, and nobody twice', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      limit: 25,
      offset: 0,
    })
    // The five from the bookings plus carla; bob and peter were contacts already.
    expect(page.count).toBe(6)
    expect(page.contacts).toHaveLength(6)
    expect(new Set(page.contacts.map((c) => c.gradidoId)).size).toBe(6)
  })

  it('pages over the joined list without a duplicate or a gap', async () => {
    const first = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      limit: 3,
      offset: 0,
    })
    const second = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      limit: 3,
      offset: 3,
    })
    const seen = [...first.contacts, ...second.contacts].map((c) => c.gradidoId)
    expect(seen).toHaveLength(6)
    expect(new Set(seen).size).toBe(6)
  })

  it('finds her by her alias, like any other contact', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
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
      member: memberOf(bibi),
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

  it('answers the other direction by the pair as well', async () => {
    // ⛔ Guards the narrowed REFERRER look specifically: peter is reached through the
    // aliased side of the join, so a narrowing put on the wrong column of that join
    // answers nobody here while every un-narrowed test stays green.
    const peterRef = await withMember(peter.communityUuid as string, peter.gradidoID)
    const page = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      counterparty: peterRef,
      limit: 25,
      offset: 0,
    })
    expect(page.count).toBe(1)
    expect(page.contacts[0]).toMatchObject({
      linkedUserId: peter.id,
      bookings: 3,
      origin: ContactOrigin.REFERRER,
    })
  })

  it('still answers about a member of another community, who is on no trace', async () => {
    // The pair resolves to no local row, so the referral bundle cannot contribute and is
    // not asked for at all -- the booking half must still answer.
    const annaRef = await withMember(FOREIGN_COMMUNITY, ANNA)
    expect(annaRef.localUserId).toBeNull()
    const page = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      counterparty: annaRef,
      limit: 25,
      offset: 0,
    })
    expect(page.count).toBe(1)
    expect(page.contacts[0]).toMatchObject({ gradidoId: ANNA, bookings: 1, origin: null })
  })

  it('is not a contact of somebody who only shares the referrer', async () => {
    // carla and bob both came over bibi. That makes each of them a contact of BIBI, not of
    // each other -- they share no event.
    const carlaSees = (await contactsOf(carla)).map((c) => c.linkedUserId)
    expect(carlaSees).toEqual([bibi.id])
  })
})

/**
 * The fourth source: the people this member has a conversation with (E-023, KF-012).
 *
 * ⚠️ LAST in the file and undoing what it does, like the referral block above it: the
 * conversations, bob's arrival over bibi and the member it creates all go in `afterAll`.
 *
 * bob is the person all three kinds of event meet in -- two bookings with bibi, his arrival
 * over her, and a conversation -- so ONE contact has to carry the booking count, the origin
 * and the chat fields, dated from the oldest of the three to the youngest.
 */
describe('dbSelectContactsByUserId with conversations', () => {
  // A member of another community bibi wrote to, who never booked with anybody here. bibi's
  // own copy names her by the pair alone; an answer from her would need a users row here
  // (the receiving server finds the sender by it), so without one this is the shape there is.
  const FRIDA = {
    communityUuid: FOREIGN_COMMUNITY,
    gradidoId: 'f1f1f1f1-0000-4000-8000-000000000001',
  }
  const bobArrived = new Date(Date.UTC(2026, 6, 20, 12, 0, 0))
  let dora: DbUser
  let bobsMessage: number

  const write = async (
    conversationId: number,
    sender: { communityUuid: string; gradidoId: string },
    at: Date,
  ) => {
    const stored = await dbInsertChatMessage({
      messageUuid: uuidv4(),
      conversationId,
      senderCommunityUuid: sender.communityUuid,
      senderGradidoId: sender.gradidoId,
      subject: null,
      body: 'hello',
      notify: 'email',
      deliveryState: 'delivered',
      createdAt: at,
    })
    if (!stored.success) {
      throw new Error('fixture: a message was not filed')
    }
    return stored.value.id
  }

  const contactsOf = async (user: DbUser) =>
    (await dbSelectContactsByUserId(user.id, { member: memberOf(user), limit: 25, offset: 0 }))
      .contacts

  beforeAll(async () => {
    // A member of this community who only ever wrote -- no booking, no trace.
    dora = await userFactory({ email: 'dora@writes.de', alias: 'doraWrites', emailChecked: true })

    await DbUser.update(bob.id, { referrerId: bibi.id, createdAt: bobArrived })
    const withBob = await dbEnsureDirectChatConversation(memberOf(bibi), memberOf(bob))
    await write(withBob.id, memberOf(bibi), day(20))
    bobsMessage = await write(withBob.id, memberOf(bob), day(21))

    const withFrida = await dbEnsureDirectChatConversation(memberOf(bibi), FRIDA)
    await write(withFrida.id, memberOf(bibi), day(12))

    const withDora = await dbEnsureDirectChatConversation(memberOf(dora), memberOf(bibi))
    await write(withDora.id, memberOf(dora), day(15))
  })

  afterAll(async () => {
    const db = AppDatabase.getInstance().getDataSource()
    for (const table of ['chat_messages', 'chat_conversation_members', 'chat_conversations']) {
      await db.query(`DELETE FROM \`${table}\``)
    }
    await DbUser.update(bob.id, { referrerId: null, createdAt: bob.createdAt })
    await DbUser.delete(dora.id)
    await DbUserContact.delete({ userId: dora.id })
  })

  it('brings somebody the member only wrote with, with no bookings', async () => {
    const frida = (await contactsOf(bibi)).find((c) => c.gradidoId === FRIDA.gradidoId)
    expect(frida).toMatchObject({
      linkedUserId: null,
      communityUuid: FOREIGN_COMMUNITY,
      alias: null,
      bookings: 0,
      origin: null,
      // bibi's own message: nothing unread.
      unreadChatMessages: 0,
    })
    expect(frida?.firstAt.getTime()).toBe(day(12).getTime())
    expect(frida?.lastAt.getTime()).toBe(day(12).getTime())
    expect(frida?.lastChatMessageAt?.getTime()).toBe(day(12).getTime())
    // The line under her name (E-083): her conversation's message, and no booking.
    expect(frida?.lastChatMessageId).toEqual(expect.any(Number))
    expect(frida).toMatchObject({ lastBookingId: null, lastBookingAt: null })
  })

  it('joins bookings, the trace and a conversation with one person into ONE contact', async () => {
    const rows = (await contactsOf(bibi)).filter((c) => c.linkedUserId === bob.id)
    expect(rows).toHaveLength(1)
    // The count is the bookings' alone: a conversation brings none.
    expect(rows[0]).toMatchObject({
      bookings: 2,
      origin: ContactOrigin.ARRIVAL,
      unreadChatMessages: 1,
    })
    expect(rows[0].lastChatMessageAt?.getTime()).toBe(day(21).getTime())
    // The line under his name (E-083) can point at either: his latest message, and the latest
    // booking with him -- each from its own bundle, joined like the dates.
    expect(rows[0].lastChatMessageId).toBe(bobsMessage)
    expect(rows[0].lastBookingAt?.getTime()).toBe(day(5).getTime())
    const [line] = await dbSelectBookingLinesOfUser(bibi.id, [rows[0].lastBookingId as number])
    expect(line.memo).toBe('five')
    // The oldest of the three events -- his arrival -- to the youngest, his message.
    expect(rows[0].firstAt.getTime()).toBe(bobArrived.getTime())
    expect(rows[0].lastAt.getTime()).toBe(day(21).getTime())
  })

  it('puts a fresh message at the top of the list, and counts people once', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      limit: 25,
      offset: 0,
    })
    expect(page.contacts.map((c) => c.gradidoId)).toEqual([
      bob.gradidoID,
      dora.gradidoID,
      FRIDA.gradidoId,
      TINA,
      SARAH,
      peter.gradidoID,
      ANNA,
    ])
    expect(page.count).toBe(7)
  })

  it('leaves nothing unread and no last message on a contact without a conversation', async () => {
    const peterRow = (await contactsOf(bibi)).find((c) => c.linkedUserId === peter.id)
    expect(peterRow).toMatchObject({ unreadChatMessages: 0, lastChatMessageAt: null })
  })

  it('finds a partner with a users row by the alias', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      search: 'writes',
      limit: 25,
      offset: 0,
    })
    expect(page.count).toBe(1)
    expect(page.contacts[0]).toMatchObject({ linkedUserId: dora.id, bookings: 0 })
  })

  it('answers about a partner by the pair, with the chat fields, both shapes', async () => {
    for (const [who, localUserId, unread] of [
      [FRIDA, null, 0],
      [memberOf(dora), dora.id, 1],
    ] as const) {
      const counterparty = await withMember(who.communityUuid, who.gradidoId)
      expect(counterparty.localUserId).toBe(localUserId)
      const page = await dbSelectContactsByUserId(bibi.id, {
        member: memberOf(bibi),
        counterparty,
        limit: 25,
        offset: 0,
      })
      expect(page.count).toBe(1)
      expect(page.contacts[0]).toMatchObject({
        gradidoId: who.gradidoId,
        bookings: 0,
        unreadChatMessages: unread,
      })
    }
  })

  it("counts what the member has not read, and the other side's count is their own", async () => {
    const withBob = await dbEnsureDirectChatConversation(memberOf(bibi), memberOf(bob))
    await dbUpdateChatConversationMemberLastRead(withBob.id, memberOf(bibi), bobsMessage)
    const bobRow = (await contactsOf(bibi)).find((c) => c.linkedUserId === bob.id)
    expect(bobRow?.unreadChatMessages).toBe(0)
    // bibi's message is still unread to bob: her pointer is not his.
    const bibiRow = (await contactsOf(bob)).find((c) => c.linkedUserId === bibi.id)
    expect(bibiRow?.unreadChatMessages).toBe(1)
  })
})

/**
 * One person spelled two ways (coderabbit on #3965): a member of another community with no
 * `users` row here, whose booking stored the pair in small letters, and whose conversation
 * member row holds it in capitals -- a gradido id typed in capitals passes the uuid check the
 * chat files by. The contact list must still name her once.
 *
 * ⚠️ LAST in the file, and it leaves its booking behind: a seeded booking cannot be taken
 * back, and nothing runs after this block (the file ends with clearDatabase).
 */
describe('dbSelectContactsByUserId with one person spelled two ways', () => {
  const GRETA = 'abcdef00-0000-4000-8000-0000000000aa'
  const GRETA_SHOUTING = { communityUuid: FOREIGN_COMMUNITY, gradidoId: GRETA.toUpperCase() }

  beforeAll(async () => {
    // After every booking bibi has, so the seeded balance only moves forward.
    await foreignReceive(bibi, fromAfar(GRETA, 'GretaG'), day(14))
    const withGreta = await dbEnsureDirectChatConversation(memberOf(bibi), GRETA_SHOUTING)
    const stored = await dbInsertChatMessage({
      messageUuid: uuidv4(),
      conversationId: withGreta.id,
      senderCommunityUuid: bibi.communityUuid as string,
      senderGradidoId: bibi.gradidoID,
      subject: null,
      body: 'hello',
      notify: 'email',
      deliveryState: 'delivered',
      createdAt: day(15),
    })
    if (!stored.success) {
      throw new Error('fixture: the message was not filed')
    }
  })

  afterAll(async () => {
    const db = AppDatabase.getInstance().getDataSource()
    for (const table of ['chat_messages', 'chat_conversation_members', 'chat_conversations']) {
      await db.query(`DELETE FROM \`${table}\``)
    }
  })

  const gretaRows = <T extends { gradidoId: string }>(contacts: T[]): T[] =>
    contacts.filter((c) => c.gradidoId.toLowerCase() === GRETA)

  it('lists her once, with the booking and the conversation', async () => {
    const page = await dbSelectContactsByUserId(bibi.id, {
      member: memberOf(bibi),
      limit: 25,
      offset: 0,
    })
    const [greta, ...more] = gretaRows(page.contacts)
    expect(more).toEqual([])
    expect(greta).toMatchObject({ gradidoId: GRETA, bookings: 1, unreadChatMessages: 0 })
    expect(greta.lastChatMessageAt?.getTime()).toBe(day(15).getTime())
    expect(greta.lastAt.getTime()).toBe(day(15).getTime())
    // Counted once as well.
    expect(new Set(page.contacts.map((c) => c.gradidoId.toLowerCase())).size).toBe(page.count)
  })

  it('answers about her by the pair in either spelling', async () => {
    for (const gradidoId of [GRETA, GRETA.toUpperCase()]) {
      const counterparty = await withMember(FOREIGN_COMMUNITY, gradidoId)
      const page = await dbSelectContactsByUserId(bibi.id, {
        member: memberOf(bibi),
        counterparty,
        limit: 25,
        offset: 0,
      })
      expect(page.count).toBe(1)
      expect(page.contacts[0]).toMatchObject({ bookings: 1, unreadChatMessages: 0 })
      expect(page.contacts[0].lastChatMessageAt?.getTime()).toBe(day(15).getTime())
    }
  })
})

// The counts of the admin's start page. Every booking is written with its moment, and every
// moment is days away from one `now` -- far enough from the moments the counts start at that
// the seconds a test runs change nothing. Last in the file with the counts by week below: both
// empty the database.
describe('dbCountAndSumTransactionsOfType', () => {
  const now = Date.now()
  const daysAgo = (days: number): Date => new Date(now - days * 24 * 60 * 60 * 1000)

  /** One row as the server books it: a SEND row carries the amount negative, the sender's loss. */
  const book = (typeId: TransactionTypeId, user: DbUser, gddCent: bigint, days: number) =>
    drizzleDb()
      .insert(transactionsTable)
      .values({
        typeId,
        userId: user.id,
        userGradidoId: user.gradidoID,
        userCommunityUuid: user.communityUuid,
        amount: new GradidoUnit(gddCent),
        memo: 'figures',
        balanceDate: daysAgo(days),
      })

  beforeAll(async () => {
    await dbDeleteAllRowsExceptMigrations()
    await createCommunity(false)
    const sender = await userFactory(bibiBloxberg)
    const recipient = await userFactory(peterLustig)
    // 20 GDD yesterday and 5.5 GDD forty days ago, each a SEND and a RECEIVE row.
    await book(TransactionTypeId.SEND, sender, -200000n, 1)
    await book(TransactionTypeId.RECEIVE, recipient, 200000n, 1)
    await book(TransactionTypeId.SEND, sender, -55000n, 40)
    await book(TransactionTypeId.RECEIVE, recipient, 55000n, 40)
    // A creation of 100 GDD, booked ten days ago.
    await book(TransactionTypeId.CREATION, sender, 1000000n, 10)
  })

  const moments = [daysAgo(5), daysAgo(20), null]

  it('counts the rows of one type and the Gradido they moved, in whole ones, from each moment on', async () => {
    // 25.5 over all of it, rounded.
    expect(await dbCountAndSumTransactionsOfType(TransactionTypeId.SEND, moments)).toEqual({
      counts: [1, 1, 2],
      gdd: [20, 20, 26],
    })
  })

  it('counts each type on its own', async () => {
    expect(await dbCountAndSumTransactionsOfType(TransactionTypeId.CREATION, moments)).toEqual({
      counts: [0, 1, 1],
      gdd: [0, 100, 100],
    })
  })

  it('refuses to count without a moment', async () => {
    await expect(dbCountAndSumTransactionsOfType(TransactionTypeId.SEND, [])).rejects.toThrow()
  })
})

// The same by calendar week, from Monday 7 September 2026: two transfers in its week -- one at its
// very last moment --, none in the week after, one in the week of 21 September, one in the week
// before the first. Last in the file: it empties the database.
describe('dbCountAndSumTransactionsOfTypeByWeek', () => {
  const from = new Date('2026-09-07T00:00:00.000Z')

  const book = (typeId: TransactionTypeId, user: DbUser, gddCent: bigint, moment: string) =>
    drizzleDb()
      .insert(transactionsTable)
      .values({
        typeId,
        userId: user.id,
        userGradidoId: user.gradidoID,
        userCommunityUuid: user.communityUuid,
        amount: new GradidoUnit(gddCent),
        memo: 'figures by week',
        balanceDate: new Date(moment),
      })

  beforeAll(async () => {
    await dbDeleteAllRowsExceptMigrations()
    await createCommunity(false)
    const sender = await userFactory(bibiBloxberg)
    const recipient = await userFactory(peterLustig)
    // 20 GDD and 5.5 GDD in the first week, each a SEND and a RECEIVE row.
    await book(TransactionTypeId.SEND, sender, -200000n, '2026-09-08T12:00:00.000Z')
    await book(TransactionTypeId.RECEIVE, recipient, 200000n, '2026-09-08T12:00:00.000Z')
    await book(TransactionTypeId.SEND, sender, -55000n, '2026-09-13T23:59:59.999Z')
    await book(TransactionTypeId.RECEIVE, recipient, 55000n, '2026-09-13T23:59:59.999Z')
    // 1 GDD in the third week, 3 GDD the week before the first.
    await book(TransactionTypeId.SEND, sender, -10000n, '2026-09-21T00:00:00.000Z')
    await book(TransactionTypeId.SEND, sender, -30000n, '2026-09-06T23:59:59.999Z')
    // A creation of 100 GDD, booked in the first week.
    await book(TransactionTypeId.CREATION, sender, 1000000n, '2026-09-09T12:00:00.000Z')
  })

  it('counts the rows of one type and the Gradido they moved in each week, in whole ones', async () => {
    // 25.5 in the first week, rounded.
    expect(await dbCountAndSumTransactionsOfTypeByWeek(TransactionTypeId.SEND, from)).toEqual([
      { weekStart: '2026-09-07', n: 2, gdd: 26 },
      { weekStart: '2026-09-21', n: 1, gdd: 1 },
    ])
  })

  it('counts each type on its own', async () => {
    expect(await dbCountAndSumTransactionsOfTypeByWeek(TransactionTypeId.CREATION, from)).toEqual([
      { weekStart: '2026-09-07', n: 1, gdd: 100 },
    ])
  })
})

/**
 * The newest booking with a contact, whose memo stands under the name on "Kontakte & Chat"
 * (E-083), and the rows it is read from. Two members of their own, so that nothing the tests
 * above count changes.
 */
describe('the newest booking with a contact (E-083)', () => {
  let garrick: DbUser
  let stephen: DbUser
  let bookedFirst: [{ id: number }, { id: number }]
  let bookedSecond: [{ id: number }, { id: number }]

  beforeAll(async () => {
    garrick = await userFactory(garrickOllivander)
    stephen = await userFactory(stephenHawking)
    bookedFirst = await transferGradidos(
      garrick,
      stephen,
      new GradidoUnit(10000n),
      'booked first',
      day(20),
    )
    bookedSecond = await transferGradidos(
      garrick,
      stephen,
      new GradidoUnit(20000n),
      'booked second',
      day(21),
    )
    // A booking time written after the row, as dbUpdateBalanceAndDate writes it: the row with the
    // LOWER id is now the newest booking.
    await drizzleDb()
      .update(transactionsTable)
      .set({ balanceDate: day(22) })
      .where(
        and(eq(transactionsTable.id, bookedFirst[0].id), eq(transactionsTable.userId, garrick.id)),
      )
  })

  it('takes the newest by booking time, not by id', async () => {
    const page = await dbSelectContactsByUserId(garrick.id, {
      member: memberOf(garrick),
      limit: 25,
      offset: 0,
    })
    expect(page.contacts).toHaveLength(1)
    expect(bookedFirst[0].id).toBeLessThan(bookedSecond[0].id)
    expect(page.contacts[0].lastBookingId).toBe(bookedFirst[0].id)
    expect(page.contacts[0].lastBookingAt?.getTime()).toBe(day(22).getTime())
  })

  // ⚠️ The seed writes both rows of a transfer with the amount as given; the server writes the
  // SEND row negative (TransactionResolver). So the sign is not what this asserts -- the line
  // builder takes the amount without it either way (chatPreviews.test.ts).
  it("hands back the member's own rows: what was given, its amount, memo and time", async () => {
    const lines = await dbSelectBookingLinesOfUser(garrick.id, [
      bookedFirst[0].id,
      bookedSecond[0].id,
    ])
    const second = lines.find((line) => line.id === bookedSecond[0].id)
    expect(lines).toHaveLength(2)
    expect(second).toMatchObject({ typeId: TransactionTypeId.SEND, memo: 'booked second' })
    expect(Number(second?.amount?.abs().toString())).toBe(2)
    expect(second?.balanceDate.getTime()).toBe(day(21).getTime())
  })

  it('and what was received', async () => {
    const [received] = await dbSelectBookingLinesOfUser(stephen.id, [bookedSecond[1].id])
    expect(received).toMatchObject({ typeId: TransactionTypeId.RECEIVE, memo: 'booked second' })
    expect(Number(received.amount?.toString())).toBe(2)
  })

  it("hands out no other member's row, no id without a row, and asks nothing for none", async () => {
    // Garrick's SEND row, asked for as stephen's: nobody else's booking is read.
    expect(await dbSelectBookingLinesOfUser(stephen.id, [bookedSecond[0].id])).toEqual([])
    expect(await dbSelectBookingLinesOfUser(garrick.id, [99999999])).toEqual([])
    expect(await dbSelectBookingLinesOfUser(garrick.id, [])).toEqual([])
  })

  it('hands out no creation: it was booked with nobody', async () => {
    const [bookings] = await dbSelectTransactionsByUserId(bibi.id, 50, 0, Order.DESC)
    const creation = bookings.find((booking) => booking.typeId === TransactionTypeId.CREATION)
    expect(creation).toBeDefined()
    expect(await dbSelectBookingLinesOfUser(bibi.id, [creation?.id as number])).toEqual([])
  })
})

/**
 * A person both groupings found, split the other way round from Lotte: the booking with the
 * `users` row is the OLDER one, so the newest booking is in the grouping joined second. It is
 * still the one under the name (E-083) -- the order of the groupings decides nothing.
 */
describe('the newest booking of a person both groupings found, in the grouping joined second', () => {
  const MIRA = 'bbbbbbbb-1111-2222-3333-444444444444'
  let hotzenplotz: DbUser
  let miraRowId: number

  beforeAll(async () => {
    hotzenplotz = await userFactory(raeuberHotzenplotz)
    const miraRow = new DbUser()
    miraRow.gradidoID = MIRA
    miraRow.communityUuid = FOREIGN_COMMUNITY
    miraRow.alias = 'mira'
    miraRow.foreign = true
    await miraRow.save()
    miraRowId = miraRow.id
    await foreignReceive(
      hotzenplotz,
      { ...fromAfar(MIRA, 'Mira'), linkedUserId: miraRowId },
      day(23),
    )
    await foreignReceive(hotzenplotz, fromAfar(MIRA, 'Mira'), day(24))
  })

  it('takes the newer of the two, whichever grouping found it', async () => {
    const page = await dbSelectContactsByUserId(hotzenplotz.id, {
      member: memberOf(hotzenplotz),
      limit: 25,
      offset: 0,
    })
    expect(page.contacts).toHaveLength(1)
    expect(page.contacts[0]).toMatchObject({ linkedUserId: miraRowId, bookings: 2 })
    expect(page.contacts[0].lastBookingAt?.getTime()).toBe(day(24).getTime())
    const [line] = await dbSelectBookingLinesOfUser(hotzenplotz.id, [
      page.contacts[0].lastBookingId as number,
    ])
    expect(line.balanceDate.getTime()).toBe(day(24).getTime())
  })
})
