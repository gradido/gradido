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
  dbSelectSupportTicketsOfUser,
  dbUpdateSupportTicketOfOwner,
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
