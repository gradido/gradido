// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { DbUser } from '../data'
import { creationGroupsTable, SupportTicketStatus, supportTicketsTable } from '../schemas'
import { createCommunity } from '../seeds/community'
import { userFactoryDrizzle } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { peterLustig } from '../seeds/users/peter-lustig'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'
import {
  dbCountSupportTicketsOfUserSince,
  dbInsertSupportTicket,
  dbSelectSupportTicketOwnerInScope,
  dbSelectSupportTicketsInScope,
  dbSelectSupportTicketsOfUser,
  dbUpdateSupportTicketOfOwner,
  SupportTicketScope,
} from './supportTickets'

const appDB = AppDatabase.getInstance()
let db: MySql2Database
let bibi: DbUser
let peter: DbUser
let gardenId: number

const DAY_BEFORE = new Date('2026-11-13T08:00:00.000Z')
const MORNING = new Date('2026-11-14T08:00:00.000Z')
const NOON = new Date('2026-11-14T12:00:00.000Z')
const ALL: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'CLOSED', 'DELETED']

const inTransaction = <T>(work: (tx: DrizzleTransaction) => Promise<T>): Promise<T> =>
  drizzleDb().transaction(work)

const file = (
  userId: number,
  text: string,
  createdAt: Date,
  creationGroupId: number | null = null,
) => inTransaction((tx) => dbInsertSupportTicket({ userId, creationGroupId, text, createdAt }, tx))

const rowOf = async (id: number) =>
  (await db.select().from(supportTicketsTable).where(eq(supportTicketsTable.id, id)))[0]

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await dbDeleteAllRowsExceptMigrations()
  await createCommunity(false)
  bibi = await userFactoryDrizzle(bibiBloxberg)
  peter = await userFactoryDrizzle(peterLustig)
  const [garden] = await db.insert(creationGroupsTable).values({ tag: 'garden', name: 'Garten' })
  gardenId = garden.insertId
})
afterAll(async () => {
  await dbDeleteAllRowsExceptMigrations()
  await appDB.destroy()
})
afterEach(async () => {
  await db.delete(supportTicketsTable)
})

describe('supportTickets query test', () => {
  it('files a request as an open one and answers its number', async () => {
    const id = await file(bibi.id, 'Wie schöpfe ich?', MORNING, gardenId)
    expect(await rowOf(id)).toMatchObject({
      id,
      userId: bibi.id,
      creationGroupId: gardenId,
      text: 'Wie schöpfe ich?',
      status: 'OPEN',
      createdAt: MORNING,
      closedAt: null,
      closedBy: null,
      deletedAt: null,
    })
  })

  describe('counting what a member filed', () => {
    it('counts the member own requests since the moment, the moment itself included', async () => {
      await file(bibi.id, 'the day before', DAY_BEFORE)
      await file(bibi.id, 'in the morning', MORNING)
      await file(bibi.id, 'at noon', NOON)
      await file(peter.id, 'somebody else', NOON)
      expect(
        await inTransaction((tx) => dbCountSupportTicketsOfUserSince(bibi.id, MORNING, tx)),
      ).toBe(2)
    })

    it('counts a deleted request as well: it was filed all the same', async () => {
      const id = await file(bibi.id, 'deleted later', NOON)
      await db
        .update(supportTicketsTable)
        .set({ status: 'DELETED' })
        .where(eq(supportTicketsTable.id, id))
      expect(
        await inTransaction((tx) => dbCountSupportTicketsOfUserSince(bibi.id, MORNING, tx)),
      ).toBe(1)
    })
  })

  describe('the member own list', () => {
    it('lists the member own requests, the newest first, with the group by tag and name', async () => {
      const first = await file(bibi.id, 'first', MORNING, gardenId)
      const second = await file(bibi.id, 'second', NOON)
      await file(peter.id, 'not bibi', NOON)
      expect(await dbSelectSupportTicketsOfUser(bibi.id, 0, 25)).toEqual({
        count: 2,
        tickets: [
          {
            id: second,
            text: 'second',
            status: 'OPEN',
            createdAt: NOON,
            creationGroupTag: null,
            creationGroupName: null,
          },
          {
            id: first,
            text: 'first',
            status: 'OPEN',
            createdAt: MORNING,
            creationGroupTag: 'garden',
            creationGroupName: 'Garten',
          },
        ],
      })
    })

    it('answers a page and the count of all', async () => {
      const ids: number[] = []
      for (const text of ['a', 'b', 'c']) {
        ids.push(await file(bibi.id, text, NOON))
      }
      const page = await dbSelectSupportTicketsOfUser(bibi.id, 1, 1)
      expect(page.count).toBe(3)
      expect(page.tickets.map((ticket) => ticket.id)).toEqual([ids[1]])
    })
  })

  describe('setting the state of an own request', () => {
    it('sets it where the request is the member own and stands in one of the states', async () => {
      const id = await file(bibi.id, 'done', MORNING)
      const written = await inTransaction((tx) =>
        dbUpdateSupportTicketOfOwner(
          { id, userId: bibi.id, statusIn: ['OPEN', 'IN_PROGRESS'] },
          { status: 'CLOSED', closedAt: NOON, closedBy: bibi.id },
          tx,
        ),
      )
      expect(written).toBe(true)
      expect(await rowOf(id)).toMatchObject({ status: 'CLOSED', closedAt: NOON, closedBy: bibi.id })
    })

    it('answers true where nothing changes: an open request written into stays open', async () => {
      const id = await file(bibi.id, 'still open', MORNING)
      const written = await inTransaction((tx) =>
        dbUpdateSupportTicketOfOwner(
          { id, userId: bibi.id, statusIn: ['OPEN', 'IN_PROGRESS', 'CLOSED'] },
          { status: 'OPEN', closedAt: null, closedBy: null },
          tx,
        ),
      )
      expect(written).toBe(true)
    })

    it('writes nothing on the request of another member, and answers as for a missing one', async () => {
      const id = await file(bibi.id, 'bibi', MORNING)
      const byPeter = await inTransaction((tx) =>
        dbUpdateSupportTicketOfOwner(
          { id, userId: peter.id, statusIn: ALL },
          { status: 'CLOSED', closedAt: NOON, closedBy: peter.id },
          tx,
        ),
      )
      const missing = await inTransaction((tx) =>
        dbUpdateSupportTicketOfOwner(
          { id: id + 1000, userId: bibi.id, statusIn: ALL },
          { status: 'CLOSED', closedAt: NOON, closedBy: bibi.id },
          tx,
        ),
      )
      expect(byPeter).toBe(false)
      expect(missing).toBe(false)
      expect(await rowOf(id)).toMatchObject({ status: 'OPEN', closedAt: null, closedBy: null })
    })

    it('writes nothing where the request stands in another state', async () => {
      const id = await file(bibi.id, 'deleted', MORNING)
      await db
        .update(supportTicketsTable)
        .set({ status: 'DELETED' })
        .where(eq(supportTicketsTable.id, id))
      const written = await inTransaction((tx) =>
        dbUpdateSupportTicketOfOwner(
          { id, userId: bibi.id, statusIn: ['OPEN', 'IN_PROGRESS', 'CLOSED'] },
          { status: 'OPEN', closedAt: null, closedBy: null },
          tx,
        ),
      )
      expect(written).toBe(false)
      expect((await rowOf(id)).status).toBe('DELETED')
    })
  })
})

// The moderation's side (K2): a moderator reaches the requests their scope covers -- in the list,
// in its count and in the check of a single request, through the one condition.
describe('supportTickets query test, the moderation side', () => {
  let choirId: number
  const EVERYTHING: SupportTicketScope = {
    tags: [],
    seesAllCreationGroups: true,
    seesUntagged: true,
  }
  const scope = (tags: string[], seesUntagged: boolean): SupportTicketScope => ({
    tags,
    seesAllCreationGroups: false,
    seesUntagged,
  })
  // the ids of the first page, and the count of all, which has to agree with them here
  const reached = async (where: SupportTicketScope, statuses: SupportTicketStatus[] = ALL) => {
    const { count, tickets } = await dbSelectSupportTicketsInScope(statuses, where, 0, 25)
    expect(count).toBe(tickets.length)
    return tickets.map((ticket) => ticket.id)
  }
  const setState = (id: number, set: Partial<typeof supportTicketsTable.$inferInsert>) =>
    db.update(supportTicketsTable).set(set).where(eq(supportTicketsTable.id, id))

  beforeAll(async () => {
    const [choir] = await db.insert(creationGroupsTable).values({ tag: 'choir', name: 'Chor' })
    choirId = choir.insertId
  })

  describe('the scope', () => {
    let inGarden: number
    let inChoir: number
    let ungrouped: number
    beforeEach(async () => {
      inGarden = await file(bibi.id, 'in the garden', MORNING, gardenId)
      inChoir = await file(bibi.id, 'in the choir', MORNING, choirId)
      ungrouped = await file(bibi.id, 'no group', MORNING)
    })

    it('reaches every request where the moderator sees all of them', async () => {
      expect(await reached(EVERYTHING)).toEqual([ungrouped, inChoir, inGarden])
    })

    it('reaches the requests of the groups of the scope and no other', async () => {
      expect(await reached(scope(['garden'], false))).toEqual([inGarden])
      expect(await reached(scope(['garden', 'choir'], false))).toEqual([inChoir, inGarden])
    })

    it('reaches the requests of no group where the scope says "untagged"', async () => {
      expect(await reached(scope([], true))).toEqual([ungrouped])
    })

    it('reaches both where the scope names a group and "untagged"', async () => {
      expect(await reached(scope(['choir'], true))).toEqual([ungrouped, inChoir])
    })

    it('reaches nothing where the scope names no group and not "untagged"', async () => {
      expect(await reached(scope([], false))).toEqual([])
    })

    it('reaches nothing of a tag that names no group', async () => {
      expect(await reached(scope(['nobody-moderates-this'], false))).toEqual([])
    })
  })

  describe('the list', () => {
    it('lists the requests in these states, the newest first, with group and closing', async () => {
      const open = await file(bibi.id, 'open', MORNING, gardenId)
      const asked = await file(bibi.id, 'a question back', MORNING)
      await setState(asked, { status: 'IN_PROGRESS' })
      const closed = await file(peter.id, 'closed', NOON)
      await setState(closed, { status: 'CLOSED', closedAt: NOON, closedBy: bibi.id })
      const deleted = await file(bibi.id, 'deleted', NOON)
      await setState(deleted, { status: 'DELETED', deletedAt: NOON, deletedBy: peter.id })

      expect(
        await dbSelectSupportTicketsInScope(['OPEN', 'IN_PROGRESS'], EVERYTHING, 0, 25),
      ).toEqual({
        count: 2,
        tickets: [
          {
            id: asked,
            userId: bibi.id,
            text: 'a question back',
            status: 'IN_PROGRESS',
            createdAt: MORNING,
            creationGroupTag: null,
            creationGroupName: null,
            closedAt: null,
            closedBy: null,
            deletedAt: null,
            deletedBy: null,
          },
          expect.objectContaining({
            id: open,
            status: 'OPEN',
            creationGroupTag: 'garden',
            creationGroupName: 'Garten',
          }),
        ],
      })
      expect(await dbSelectSupportTicketsInScope(['CLOSED'], EVERYTHING, 0, 25)).toEqual({
        count: 1,
        tickets: [
          expect.objectContaining({
            id: closed,
            userId: peter.id,
            closedAt: NOON,
            closedBy: bibi.id,
          }),
        ],
      })
      expect(await dbSelectSupportTicketsInScope(['DELETED'], EVERYTHING, 0, 25)).toEqual({
        count: 1,
        tickets: [expect.objectContaining({ id: deleted, deletedAt: NOON, deletedBy: peter.id })],
      })
      expect(await reached(EVERYTHING)).toEqual([deleted, closed, asked, open])
    })

    it('answers a page and the count of all the scope reaches', async () => {
      const ids: number[] = []
      for (const text of ['a', 'b', 'c']) {
        ids.push(await file(bibi.id, text, NOON, gardenId))
      }
      await file(bibi.id, 'outside the scope', NOON, choirId)
      const page = await dbSelectSupportTicketsInScope(ALL, scope(['garden'], false), 1, 1)
      expect(page.count).toBe(3)
      expect(page.tickets.map((ticket) => ticket.id)).toEqual([ids[1]])
    })
  })

  describe('a single request', () => {
    it('answers its owner where the scope reaches it, in any state', async () => {
      const id = await file(bibi.id, 'in the garden', MORNING, gardenId)
      expect(await dbSelectSupportTicketOwnerInScope(id, scope(['garden'], false))).toBe(bibi.id)
      await setState(id, { status: 'DELETED', deletedAt: NOON, deletedBy: peter.id })
      expect(await dbSelectSupportTicketOwnerInScope(id, scope(['garden'], false))).toBe(bibi.id)
      const ungrouped = await file(peter.id, 'no group', MORNING)
      expect(await dbSelectSupportTicketOwnerInScope(ungrouped, scope([], true))).toBe(peter.id)
      expect(await dbSelectSupportTicketOwnerInScope(ungrouped, EVERYTHING)).toBe(peter.id)
    })

    it('answers null outside the scope and for a missing request alike', async () => {
      const inChoir = await file(bibi.id, 'in the choir', MORNING, choirId)
      const ungrouped = await file(bibi.id, 'no group', MORNING)
      expect(await dbSelectSupportTicketOwnerInScope(inChoir, scope(['garden'], true))).toBeNull()
      expect(
        await dbSelectSupportTicketOwnerInScope(ungrouped, scope(['garden'], false)),
      ).toBeNull()
      expect(await dbSelectSupportTicketOwnerInScope(inChoir, scope([], false))).toBeNull()
      expect(await dbSelectSupportTicketOwnerInScope(inChoir + 1000, EVERYTHING)).toBeNull()
    })
  })
})
