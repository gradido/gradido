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
import { stephenHawking } from '../seeds/users/stephen-hawking'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'
import {
  dbCountOpenSupportTicketsInScope,
  dbCountSupportTicketsOfUserSince,
  dbInsertSupportTicket,
  dbLockSupportTicketOfModerator,
  dbSelectSupportTicketOwnerInScope,
  dbSelectSupportTicketsInScope,
  dbSelectSupportTicketsOfUser,
  dbUpdateSupportTicketOfModerator,
  dbUpdateSupportTicketOfOwner,
  SupportTicketFilter,
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
// no search and any group: the list as it was before K4
const ANY: SupportTicketFilter = { words: [], group: null }

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
    const { count, tickets } = await dbSelectSupportTicketsInScope(statuses, where, ANY, 0, 25)
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
        await dbSelectSupportTicketsInScope(['OPEN', 'IN_PROGRESS'], EVERYTHING, ANY, 0, 25),
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
      expect(await dbSelectSupportTicketsInScope(['CLOSED'], EVERYTHING, ANY, 0, 25)).toEqual({
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
      expect(await dbSelectSupportTicketsInScope(['DELETED'], EVERYTHING, ANY, 0, 25)).toEqual({
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
      const page = await dbSelectSupportTicketsInScope(ALL, scope(['garden'], false), ANY, 1, 1)
      expect(page.count).toBe(3)
      expect(page.tickets.map((ticket) => ticket.id)).toEqual([ids[1]])
    })
  })

  // K4: the search and the group filter, beside the scope and never in its place
  describe('the filter', () => {
    let stephen: DbUser
    // the ids the filter leaves of the first page, and the count of all, which has to agree
    const found = async (filter: Partial<SupportTicketFilter>, within = EVERYTHING) => {
      const { count, tickets } = await dbSelectSupportTicketsInScope(
        ALL,
        within,
        { ...ANY, ...filter },
        0,
        25,
      )
      expect(count).toBe(tickets.length)
      return tickets.map((ticket) => ticket.id)
    }

    beforeAll(async () => {
      // an account deleted since: the server names it nowhere
      stephen = await userFactoryDrizzle(stephenHawking)
    })

    it('finds a request by its words, its member and its number, each word somewhere in it', async () => {
      const bibis = await file(bibi.id, 'Mein Hochbeet ist leer', MORNING, gardenId)
      const peters = await file(peter.id, 'Das Passwort fehlt', NOON)
      expect(await found({ words: ['hochbeet'] })).toEqual([bibis])
      expect(await found({ words: ['Bibi'] })).toEqual([bibis])
      expect(await found({ words: ['Lustig'] })).toEqual([peters])
      // the username, and the address
      expect(await found({ words: ['BBB'] })).toEqual([bibis])
      expect(await found({ words: ['lustig.de'] })).toEqual([peters])
      // in any order, one in the member and one in the words
      expect(await found({ words: ['leer', 'Bloxberg'] })).toEqual([bibis])
      expect(await found({ words: ['Bloxberg', 'Passwort'] })).toEqual([])
      expect(await found({ words: [String(peters)] })).toEqual([peters])
      expect(await found({ words: ['nobody-wrote-this'] })).toEqual([])
    })

    it('finds the request of a deleted account by its words, not by the member', async () => {
      const id = await file(stephen.id, 'Ein schwarzes Loch', MORNING)
      expect(await found({ words: ['Loch'] })).toEqual([id])
      expect(await found({ words: ['Hawking'] })).toEqual([])
      expect(await found({ words: ['StephenH'] })).toEqual([])
    })

    it('narrows to some group, to none, and to the group of a tag', async () => {
      const inGarden = await file(bibi.id, 'in the garden', MORNING, gardenId)
      const inChoir = await file(bibi.id, 'in the choir', MORNING, choirId)
      const ungrouped = await file(bibi.id, 'no group', MORNING)
      expect(await found({ group: null })).toEqual([ungrouped, inChoir, inGarden])
      expect(await found({ group: 'GROUPED' })).toEqual([inChoir, inGarden])
      expect(await found({ group: 'UNGROUPED' })).toEqual([ungrouped])
      expect(await found({ group: { tag: 'garden' } })).toEqual([inGarden])
      expect(await found({ group: { tag: 'nobody-moderates-this' } })).toEqual([])
      // and together with words
      expect(await found({ group: 'GROUPED', words: ['choir'] })).toEqual([inChoir])
    })

    it('finds nothing outside the scope, in any branch of it, with any filter', async () => {
      const inGarden = await file(bibi.id, 'Hochbeet', MORNING, gardenId)
      const inChoir = await file(bibi.id, 'Hochbeet', MORNING, choirId)
      const ungrouped = await file(bibi.id, 'Hochbeet', MORNING)
      const filters: Partial<SupportTicketFilter>[] = [
        {},
        { words: ['Hochbeet'] },
        { words: ['Bibi'] },
        { group: 'GROUPED' },
        { group: 'UNGROUPED' },
        { group: { tag: 'garden' } },
        { group: { tag: 'choir' } },
      ]
      const scopes: [SupportTicketScope, number[]][] = [
        [EVERYTHING, [inGarden, inChoir, ungrouped]],
        [scope(['garden'], false), [inGarden]],
        [scope([], true), [ungrouped]],
        [scope(['garden'], true), [inGarden, ungrouped]],
        [scope([], false), []],
      ]
      for (const [within, reaches] of scopes) {
        for (const filter of filters) {
          const outside = (await found(filter, within)).filter((id) => !reaches.includes(id))
          expect([within, filter, outside]).toEqual([within, filter, []])
        }
        // and what the scope reaches, a search that names it finds, the newest first
        expect(await found({ words: ['Hochbeet'] }, within)).toEqual([...reaches].reverse())
      }
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

  // peter moderates; bibi asks, and peter asks once himself (K3)
  describe('acting on a request', () => {
    const ANSWERS_FROM: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'CLOSED']
    const A_QUESTION_BACK = {
      status: 'IN_PROGRESS',
      closedAt: null,
      closedBy: null,
    } as const
    const where = (id: number, statusIn: SupportTicketStatus[], within = EVERYTHING) => ({
      id,
      statusIn,
      scope: within,
      moderatorId: peter.id,
    })
    const answer = (id: number, within = EVERYTHING) =>
      dbUpdateSupportTicketOfModerator(where(id, ANSWERS_FROM, within), A_QUESTION_BACK)
    const lock = (id: number, statusIn: SupportTicketStatus[], within = EVERYTHING) =>
      inTransaction((tx) => dbLockSupportTicketOfModerator(where(id, statusIn, within), tx))

    it('writes from each state it starts from, and from no other', async () => {
      for (const state of ALL) {
        const id = await file(bibi.id, `in state ${state}`, MORNING)
        await setState(id, { status: state, closedAt: NOON, closedBy: bibi.id })
        const written = await answer(id)
        expect([state, written]).toEqual([state, state !== 'DELETED'])
        expect(await rowOf(id)).toMatchObject(
          state === 'DELETED'
            ? { status: 'DELETED', closedAt: NOON, closedBy: bibi.id }
            : A_QUESTION_BACK,
        )
      }
    })

    it('closes and deletes with the moment and the moderator, from open and a question back only', async () => {
      const open = await file(bibi.id, 'open', MORNING)
      const asked = await file(bibi.id, 'asked', MORNING)
      await setState(asked, { status: 'IN_PROGRESS' })
      const closed = await file(bibi.id, 'closed', MORNING)
      await setState(closed, { status: 'CLOSED', closedAt: MORNING, closedBy: bibi.id })
      const closes = (id: number) =>
        dbUpdateSupportTicketOfModerator(where(id, ['OPEN', 'IN_PROGRESS']), {
          status: 'CLOSED',
          closedAt: NOON,
          closedBy: peter.id,
        })
      const deletes = (id: number) =>
        dbUpdateSupportTicketOfModerator(where(id, ['OPEN', 'IN_PROGRESS']), {
          status: 'DELETED',
          deletedAt: NOON,
          deletedBy: peter.id,
        })

      expect(await closes(open)).toBe(true)
      expect(await rowOf(open)).toMatchObject({
        status: 'CLOSED',
        closedAt: NOON,
        closedBy: peter.id,
      })
      expect(await deletes(asked)).toBe(true)
      expect(await rowOf(asked)).toMatchObject({
        status: 'DELETED',
        deletedAt: NOON,
        deletedBy: peter.id,
        closedAt: null,
      })
      // a closed one is neither closed again nor deleted
      expect(await closes(closed)).toBe(false)
      expect(await deletes(closed)).toBe(false)
      expect(await rowOf(closed)).toMatchObject({
        status: 'CLOSED',
        closedAt: MORNING,
        closedBy: bibi.id,
        deletedAt: null,
      })
    })

    it('answers true where nothing changes: an answer to a question back leaves one', async () => {
      const id = await file(bibi.id, 'asked', MORNING)
      await setState(id, { status: 'IN_PROGRESS' })
      expect(await answer(id)).toBe(true)
      expect(await rowOf(id)).toMatchObject(A_QUESTION_BACK)
    })

    it('writes in each branch of the scope what the scope reaches, and nothing outside it', async () => {
      const inGarden = await file(bibi.id, 'in the garden', MORNING, gardenId)
      const inChoir = await file(bibi.id, 'in the choir', MORNING, choirId)
      const ungrouped = await file(bibi.id, 'no group', MORNING)
      const cases: [SupportTicketScope, number[]][] = [
        [EVERYTHING, [inGarden, inChoir, ungrouped]],
        [scope(['garden'], false), [inGarden]],
        [scope([], true), [ungrouped]],
        [scope(['choir'], true), [inChoir, ungrouped]],
        [scope([], false), []],
        [scope(['nobody-moderates-this'], false), []],
      ]
      for (const [within, reaches] of cases) {
        for (const id of [inGarden, inChoir, ungrouped]) {
          await setState(id, { status: 'OPEN' })
          expect([within, id, await answer(id, within)]).toEqual([within, id, reaches.includes(id)])
          expect((await rowOf(id)).status).toBe(reaches.includes(id) ? 'IN_PROGRESS' : 'OPEN')
        }
      }
    })

    it('writes nothing on the moderator own request, and nothing on a missing one', async () => {
      const own = await file(peter.id, 'my own question', MORNING)
      expect(await answer(own)).toBe(false)
      expect(await rowOf(own)).toMatchObject({ status: 'OPEN' })
      expect(await answer(own + 1000)).toBe(false)
    })

    it('holds a request for a note where it is the moderator one to act on, and changes nothing of it', async () => {
      const id = await file(bibi.id, 'in the garden', MORNING, gardenId)
      // the member closed it just before the note
      await setState(id, { status: 'CLOSED', closedAt: NOON, closedBy: bibi.id })
      expect(await lock(id, ANSWERS_FROM)).toBe(true)
      expect(await rowOf(id)).toMatchObject({ status: 'CLOSED', closedAt: NOON, closedBy: bibi.id })
      expect(await lock(id, ANSWERS_FROM, scope(['garden'], false))).toBe(true)
    })

    it('holds nothing outside the scope, of a deleted request, of the own one and of a missing one', async () => {
      const inChoir = await file(bibi.id, 'in the choir', MORNING, choirId)
      expect(await lock(inChoir, ANSWERS_FROM, scope(['garden'], true))).toBe(false)
      const deleted = await file(bibi.id, 'deleted', MORNING)
      await setState(deleted, { status: 'DELETED', deletedAt: NOON, deletedBy: peter.id })
      expect(await lock(deleted, ANSWERS_FROM)).toBe(false)
      const own = await file(peter.id, 'my own', MORNING)
      expect(await lock(own, ANSWERS_FROM)).toBe(false)
      expect(await lock(own + 1000, ANSWERS_FROM)).toBe(false)
    })
  })

  describe('counting the open tab', () => {
    it('counts the open and the questions back apart, the closed and the deleted not', async () => {
      await file(bibi.id, 'open 1', MORNING)
      await file(bibi.id, 'open 2', MORNING, gardenId)
      const asked = await file(bibi.id, 'asked', MORNING)
      await setState(asked, { status: 'IN_PROGRESS' })
      const closed = await file(bibi.id, 'closed', MORNING)
      await setState(closed, { status: 'CLOSED', closedAt: NOON, closedBy: bibi.id })
      const deleted = await file(bibi.id, 'deleted', MORNING)
      await setState(deleted, { status: 'DELETED', deletedAt: NOON, deletedBy: peter.id })
      // the moderator's own counts as the tab lists it
      await file(peter.id, 'my own', MORNING)

      expect(await dbCountOpenSupportTicketsInScope(EVERYTHING)).toEqual({
        forModeration: 3,
        forMember: 1,
      })
    })

    it('counts in each branch of the scope what the scope reaches, and nothing outside it', async () => {
      await file(bibi.id, 'in the garden', MORNING, gardenId)
      const inChoir = await file(bibi.id, 'in the choir', MORNING, choirId)
      await setState(inChoir, { status: 'IN_PROGRESS' })
      await file(bibi.id, 'no group', MORNING)

      expect(await dbCountOpenSupportTicketsInScope(scope(['garden'], false))).toEqual({
        forModeration: 1,
        forMember: 0,
      })
      expect(await dbCountOpenSupportTicketsInScope(scope(['choir'], true))).toEqual({
        forModeration: 1,
        forMember: 1,
      })
      expect(await dbCountOpenSupportTicketsInScope(scope([], true))).toEqual({
        forModeration: 1,
        forMember: 0,
      })
      expect(await dbCountOpenSupportTicketsInScope(scope([], false))).toEqual({
        forModeration: 0,
        forMember: 0,
      })
    })
  })
})
