// AI-GENERATED — not an architecture reference
import { IsNull } from 'typeorm'
import { Event as DbEvent, User as DbUser } from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { EventType } from '../enum/EventType'
import { createCommunity } from '../seeds/community'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { peterLustig } from '../seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '../seeds/users/raeuber-hotzenplotz'
import { stephenHawking } from '../seeds/users/stephen-hawking'
import {
  dbCountDistinctActingUsersOfType,
  dbCountDistinctAffectedUsersOfType,
  dbCountEventsOfTypes,
  dbCountRegisterEventsWithReferrer,
  dbCountReturningMembers,
  dbFindLatestEventForAffectedUser,
  dbHasRegisterRedeemEvent,
  dbInsertEvent,
} from './events'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'
import { dbUserUpdateField } from './user'

const db = AppDatabase.getInstance()

const HOUR_MS = 60 * 60 * 1000

/** The timestamp fills itself on insert, so an event that has to look old is aged by hand. */
async function recordEvent(
  type: string,
  affectedUserId: number,
  createdAt: Date,
): Promise<DbEvent> {
  const event = DbEvent.create({ type, affectedUserId, actingUserId: affectedUserId })
  await event.save()
  await db
    .getDataSource()
    .query('UPDATE events SET created_at = ? WHERE id = ?', [createdAt, event.id])
  return event
}

/** A registration through a redeem code: the event the half-sentence in the mail reads. */
async function recordRegisterRedeem(affectedUserId: number, transactionLinkId: number) {
  return recordLinkEvent('USER_REGISTER_REDEEM', affectedUserId, transactionLinkId)
}

async function recordLinkEvent(type: string, affectedUserId: number, transactionLinkId: number) {
  const event = DbEvent.create({
    type,
    affectedUserId,
    actingUserId: affectedUserId,
    involvedTransactionLinkId: transactionLinkId,
  })
  await event.save()
  return event
}

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('events.queries', () => {
  describe('dbFindLatestEventForAffectedUser', () => {
    let bibi: DbUser
    let peter: DbUser
    let latest: DbEvent

    beforeAll(async () => {
      await dbDeleteAllRowsExceptMigrations()

      await createCommunity(false)
      bibi = await userFactory(bibiBloxberg)
      peter = await userFactory(peterLustig)

      const now = Date.now()
      await recordEvent('EMAIL_CHANGE_REQUEST', bibi.id, new Date(now - 3 * HOUR_MS))
      latest = await recordEvent('EMAIL_CHANGE_REQUEST', bibi.id, new Date(now - HOUR_MS))
      // Younger, but of another type or about another member - neither may be picked.
      await recordEvent('EMAIL_CHANGE_CONFIRMED', bibi.id, new Date(now - 60 * 1000))
      await recordEvent('EMAIL_CHANGE_REQUEST', peter.id, new Date(now - 60 * 1000))
    })

    it('returns the youngest event of that type about that member', async () => {
      const found = await dbFindLatestEventForAffectedUser('EMAIL_CHANGE_REQUEST', bibi.id)
      expect(found?.id).toBe(latest.id)
    })

    it('returns null when nothing of that type was ever recorded for them', async () => {
      expect(await dbFindLatestEventForAffectedUser('NEVER_RECORDED', bibi.id)).toBeNull()
      expect(
        await dbFindLatestEventForAffectedUser('EMAIL_CHANGE_REQUEST', bibi.id + 1000),
      ).toBeNull()
    })
  })

  describe('dbHasRegisterRedeemEvent', () => {
    let bibi: DbUser
    let peter: DbUser
    const MY_LINK = 4711
    const OTHER_LINK = 4712

    beforeAll(async () => {
      await dbDeleteAllRowsExceptMigrations()

      await createCommunity(false)
      bibi = await userFactory(bibiBloxberg)
      peter = await userFactory(peterLustig)

      await recordRegisterRedeem(bibi.id, MY_LINK)
      // A registration that found no link behind its redeem code: the event is written
      // all the same, with nothing in the link column.
      await recordEvent('USER_REGISTER_REDEEM', peter.id, new Date())
      await recordRegisterRedeem(peter.id, OTHER_LINK)
    })

    it('is true for the link the account was registered with', async () => {
      expect(await dbHasRegisterRedeemEvent(bibi.id, MY_LINK)).toBe(true)
    })

    it('is false for another link of the same member', async () => {
      expect(await dbHasRegisterRedeemEvent(bibi.id, OTHER_LINK)).toBe(false)
    })

    it('is false for another member on that link', async () => {
      expect(await dbHasRegisterRedeemEvent(peter.id, MY_LINK)).toBe(false)
    })

    it('is false for a registration whose event carries no link', async () => {
      const withoutLink = await DbEvent.findOne({
        where: {
          type: 'USER_REGISTER_REDEEM',
          affectedUserId: peter.id,
          involvedTransactionLinkId: IsNull(),
        },
      })
      // The fixture has to be the thing the assertion is about, or it proves nothing.
      expect(withoutLink).not.toBeNull()
      expect(await dbHasRegisterRedeemEvent(peter.id, 0)).toBe(false)
    })

    it('is false for an event of another type on that link', async () => {
      await recordLinkEvent('USER_REGISTER', peter.id, MY_LINK)
      expect(await dbHasRegisterRedeemEvent(peter.id, MY_LINK)).toBe(false)
    })
  })

  // A registration whose link vouches writes its event in the transaction that opens the
  // account: the event is there once that commits, and gone with it when it does not.
  describe('dbInsertEvent inside a transaction', () => {
    const TX_LINK = 9001
    let bibi: DbUser

    const eventsOf = (transactionLinkId: number) =>
      DbEvent.count({ where: { involvedTransactionLinkId: transactionLinkId } })

    const linkEvent = (transactionLinkId: number) => ({
      type: 'USER_REGISTER_REDEEM',
      affectedUserId: bibi.id,
      actingUserId: bibi.id,
      involvedTransactionLinkId: transactionLinkId,
    })

    beforeAll(async () => {
      await dbDeleteAllRowsExceptMigrations()
      await createCommunity(false)
      bibi = await userFactory(bibiBloxberg)
    })

    it('stores the event when the transaction commits', async () => {
      await drizzleDb().transaction((tx) => dbInsertEvent(linkEvent(TX_LINK), tx))

      expect(await eventsOf(TX_LINK)).toBe(1)
    })

    it('takes the event back with the transaction', async () => {
      await expect(
        drizzleDb().transaction(async (tx) => {
          await dbInsertEvent(linkEvent(TX_LINK + 1), tx)
          throw new Error('taken back')
        }),
      ).rejects.toThrow('taken back')

      expect(await eventsOf(TX_LINK + 1)).toBe(0)
    })

    it('stores it at once without a transaction, as before', async () => {
      await dbInsertEvent(linkEvent(TX_LINK + 2))

      expect(await eventsOf(TX_LINK + 2)).toBe(1)
    })
  })
})

// The counts of the admin's start page. Every event is written with its moment, and every
// moment is days away from one `now` -- far enough from the moments the counts start at that
// the seconds a test runs change nothing.
describe('the counts of the figures page', () => {
  const now = Date.now()
  const daysAgo = (days: number): Date => new Date(now - days * 24 * HOUR_MS)

  // An event about one member, by another member or by themself, at a moment.
  const note = (type: EventType, affectedUserId: number, createdAt: Date, actingUserId?: number) =>
    dbInsertEvent({ type, affectedUserId, actingUserId: actingUserId ?? affectedUserId, createdAt })

  const REGISTRATIONS = [
    EventType.USER_REGISTER,
    EventType.USER_REGISTER_GUARANTOR,
    EventType.USER_REGISTER_REDEEM,
  ]

  describe('dbCountEventsOfTypes', () => {
    beforeAll(async () => {
      await dbDeleteAllRowsExceptMigrations()
      await note(EventType.USER_REGISTER, 1, daysAgo(1))
      await note(EventType.USER_REGISTER_GUARANTOR, 2, daysAgo(10), 7)
      await note(EventType.USER_REGISTER_REDEEM, 3, daysAgo(40))
      // Of a type nobody asks for here.
      await note(EventType.USER_LOGIN, 1, daysAgo(1))
    })

    it('counts the events of the types it is given, once from each moment on', async () => {
      expect(await dbCountEventsOfTypes(REGISTRATIONS, [daysAgo(5), daysAgo(20), null])).toEqual([
        1, 2, 3,
      ])
    })

    it('counts only the types it is given', async () => {
      expect(
        await dbCountEventsOfTypes([EventType.USER_REGISTER_GUARANTOR], [daysAgo(5), null]),
      ).toEqual([0, 1])
    })

    it('counts an event written at the very moment it counts from', async () => {
      const moment = daysAgo(60)
      await note(EventType.GUARANTOR_CODE_SHOW, 4, moment)
      expect(await dbCountEventsOfTypes([EventType.GUARANTOR_CODE_SHOW], [moment])).toEqual([1])
    })

    it('counts nothing from a moment still to come', async () => {
      expect(await dbCountEventsOfTypes(REGISTRATIONS, [new Date(now + 24 * HOUR_MS)])).toEqual([0])
    })

    it('refuses to count without a type or without a moment', async () => {
      await expect(dbCountEventsOfTypes([], [null])).rejects.toThrow()
      await expect(dbCountEventsOfTypes(REGISTRATIONS, [])).rejects.toThrow()
    })
  })

  describe('dbCountDistinctAffectedUsersOfType and dbCountDistinctActingUsersOfType', () => {
    beforeAll(async () => {
      await dbDeleteAllRowsExceptMigrations()
      // Member 1 signs in twice, member 2 once, long ago; member 3 only signs out.
      await note(EventType.USER_LOGIN, 1, daysAgo(1))
      await note(EventType.USER_LOGIN, 1, daysAgo(2))
      await note(EventType.USER_LOGIN, 2, daysAgo(30))
      await note(EventType.USER_LOGOUT, 3, daysAgo(1))
      // Host 7 brought two guests lately, host 8 one long ago: three guests, two hosts.
      await note(EventType.USER_REGISTER_GUARANTOR, 101, daysAgo(1), 7)
      await note(EventType.USER_REGISTER_GUARANTOR, 102, daysAgo(2), 7)
      await note(EventType.USER_REGISTER_GUARANTOR, 103, daysAgo(30), 8)
    })

    it('counts each member the events concern once, from each moment on', async () => {
      expect(
        await dbCountDistinctAffectedUsersOfType(EventType.USER_LOGIN, [daysAgo(5), null]),
      ).toEqual([1, 2])
    })

    it('counts each member who wrote the events once, from each moment on', async () => {
      expect(
        await dbCountDistinctActingUsersOfType(EventType.USER_REGISTER_GUARANTOR, [
          daysAgo(5),
          null,
        ]),
      ).toEqual([1, 2])
    })

    it('tells the member the events concern from the member who wrote them', async () => {
      expect(
        await dbCountDistinctAffectedUsersOfType(EventType.USER_REGISTER_GUARANTOR, [null]),
      ).toEqual([3])
    })
  })

  describe('dbCountRegisterEventsWithReferrer', () => {
    beforeAll(async () => {
      await dbDeleteAllRowsExceptMigrations()
      await createCommunity(false)
      // Peter brings people along: Bibi over his address, Räuber at his table, Stephen over
      // his address too, who deleted his account since. Bob came on his own.
      const peter = await userFactory(peterLustig)
      const bibi = await userFactory(bibiBloxberg)
      const bob = await userFactory(bobBaumeister)
      const raeuber = await userFactory(raeuberHotzenplotz)
      const stephen = await userFactory(stephenHawking)
      for (const guest of [bibi, raeuber, stephen]) {
        await dbUserUpdateField(guest.id, 'referrerId', peter.id)
      }
      await note(EventType.USER_REGISTER, bibi.id, daysAgo(1), peter.id)
      await note(EventType.USER_REGISTER, bob.id, daysAgo(1))
      await note(EventType.USER_REGISTER_GUARANTOR, raeuber.id, daysAgo(1), peter.id)
      await note(EventType.USER_REGISTER, stephen.id, daysAgo(40), peter.id)
    })

    it('counts the plain registrations of accounts that name a referrer, deleted ones too', async () => {
      expect(await dbCountRegisterEventsWithReferrer([daysAgo(5), null])).toEqual([1, 2])
    })
  })

  describe('dbCountReturningMembers', () => {
    // Counted from ten days ago; the 90 quiet days before that end there.
    const since = daysAgo(10)
    const RETURNER = 1
    const REGULAR = 2
    const NEWCOMER = 3
    const GONE = 4

    beforeAll(async () => {
      await dbDeleteAllRowsExceptMigrations()
      // Signed in long before the quiet days, and twice again since: comes back, once.
      await note(EventType.USER_LOGIN, RETURNER, daysAgo(200))
      await note(EventType.USER_LOGIN, RETURNER, daysAgo(2))
      await note(EventType.USER_LOGIN, RETURNER, daysAgo(1))
      // Did something else within the quiet days, but did not sign in: still quiet.
      await note(EventType.TRANSACTION_RECEIVE, RETURNER, daysAgo(40))
      // Signed in long before, within the quiet days and since: never quiet.
      await note(EventType.USER_LOGIN, REGULAR, daysAgo(200))
      await note(EventType.USER_LOGIN, REGULAR, daysAgo(40))
      await note(EventType.USER_LOGIN, REGULAR, daysAgo(2))
      // Signed in for the first time since; long before, they only signed out.
      await note(EventType.USER_LOGOUT, NEWCOMER, daysAgo(200))
      await note(EventType.USER_LOGIN, NEWCOMER, daysAgo(2))
      // Signed in long before and never again: has not come back.
      await note(EventType.USER_LOGIN, GONE, daysAgo(200))
    })

    it('counts the member who signs in again after the quiet days, and only them', async () => {
      expect(await dbCountReturningMembers(since)).toBe(1)
    })

    it('takes the quiet days it is given', async () => {
      // Twenty quiet days end at the same moment, so the regular's login 40 days ago lies
      // before them: the regular comes back, too.
      expect(await dbCountReturningMembers(since, 20)).toBe(2)
    })

    it('counts nobody from a moment still to come', async () => {
      expect(await dbCountReturningMembers(new Date(now + 24 * HOUR_MS))).toBe(0)
    })
  })
})
