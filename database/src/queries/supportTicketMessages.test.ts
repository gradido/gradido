// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { DbUser } from '../data'
import {
  SupportTicketMessageType,
  supportTicketMessagesTable,
  supportTicketsTable,
} from '../schemas'
import { createCommunity } from '../seeds/community'
import { userFactoryDrizzle } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { peterLustig } from '../seeds/users/peter-lustig'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'
import {
  dbCountSupportTicketDialogOfOwner,
  dbCountSupportTicketMessagesOfModerator,
  dbInsertSupportTicketMessage,
  dbSelectNewestSupportTicketDialogs,
  dbSelectSupportTicketDialogOfOwner,
  dbSelectSupportTicketThread,
} from './supportTicketMessages'
import { dbInsertSupportTicket, SupportTicketScope } from './supportTickets'

const appDB = AppDatabase.getInstance()
let db: MySql2Database
// bibi asks, peter answers as a moderator
let bibi: DbUser
let peter: DbUser
let ticketId: number

const AT = new Date('2026-11-14T08:00:00.000Z')
const LATER = new Date('2026-11-14T09:00:00.000Z')

const inTransaction = <T>(work: (tx: DrizzleTransaction) => Promise<T>): Promise<T> =>
  drizzleDb().transaction(work)

const write = (
  userId: number,
  message: string,
  createdAt: Date,
  type: SupportTicketMessageType = 'DIALOG',
) =>
  inTransaction((tx) =>
    dbInsertSupportTicketMessage(
      {
        supportTicketId: ticketId,
        userId,
        message,
        type,
        isModerator: userId === peter.id,
        createdAt,
      },
      tx,
    ),
  )

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await dbDeleteAllRowsExceptMigrations()
  await createCommunity(false)
  bibi = await userFactoryDrizzle(bibiBloxberg)
  peter = await userFactoryDrizzle(peterLustig)
  ticketId = await inTransaction((tx) =>
    dbInsertSupportTicket(
      { userId: bibi.id, creationGroupId: null, text: 'Hilfe', createdAt: AT },
      tx,
    ),
  )
})
afterAll(async () => {
  await dbDeleteAllRowsExceptMigrations()
  await appDB.destroy()
})
afterEach(async () => {
  await db.delete(supportTicketMessagesTable)
})

describe('supportTicketMessages query test', () => {
  it('files a message and answers its id', async () => {
    const id = await write(bibi.id, 'Noch eine Frage', AT)
    expect(await db.select().from(supportTicketMessagesTable)).toEqual([
      {
        id,
        supportTicketId: ticketId,
        userId: bibi.id,
        message: 'Noch eine Frage',
        type: 'DIALOG',
        isModerator: false,
        aiModel: null,
        createdAt: AT,
      },
    ])
  })

  describe('counting a thread', () => {
    it('counts the dialog of the owner request, not the notes of the moderation', async () => {
      await write(bibi.id, 'question', AT)
      await write(peter.id, 'note', AT, 'MODERATOR')
      await write(peter.id, 'answer', LATER)
      expect(
        await inTransaction((tx) => dbCountSupportTicketDialogOfOwner(ticketId, bibi.id, tx)),
      ).toBe(2)
    })

    it('answers 0 for the request of another member, as for a missing one', async () => {
      await write(bibi.id, 'question', AT)
      expect(
        await inTransaction((tx) => dbCountSupportTicketDialogOfOwner(ticketId, peter.id, tx)),
      ).toBe(0)
      expect(
        await inTransaction((tx) =>
          dbCountSupportTicketDialogOfOwner(ticketId + 1000, bibi.id, tx),
        ),
      ).toBe(0)
    })
  })

  describe('the thread as its owner reads it', () => {
    it('reads the DIALOG messages, the oldest first, each with its author', async () => {
      const answer = await write(peter.id, 'answer', LATER)
      const question = await write(bibi.id, 'question', AT)
      const dialog = await dbSelectSupportTicketDialogOfOwner(ticketId, bibi.id)
      expect(dialog.map((message) => message.id)).toEqual([answer, question])
      expect(dialog[0]).toEqual({
        id: answer,
        message: 'answer',
        createdAt: LATER,
        type: 'DIALOG',
        authorId: peter.id,
        authorAlias: peter.alias,
        authorFirstName: peter.firstName,
        authorLastName: peter.lastName,
        authorGradidoId: peter.gradidoId,
        authorCommunityUuid: peter.communityUuid,
      })
    })

    it('leaves the moderation notes out', async () => {
      await write(peter.id, 'internal note', AT, 'MODERATOR')
      const answer = await write(peter.id, 'answer', LATER)
      expect(
        (await dbSelectSupportTicketDialogOfOwner(ticketId, bibi.id)).map((m) => m.id),
      ).toEqual([answer])
    })

    it('reads the line a handing on leaves, among the dialog, and still no note (K4)', async () => {
      const handedOn = await write(peter.id, 'Garten\n', AT, 'REASSIGNED')
      await write(peter.id, 'internal note', AT, 'MODERATOR')
      const answer = await write(peter.id, 'answer', LATER)
      const dialog = await dbSelectSupportTicketDialogOfOwner(ticketId, bibi.id)
      expect(dialog.map((message) => [message.id, message.type])).toEqual([
        [handedOn, 'REASSIGNED'],
        [answer, 'DIALOG'],
      ])
    })

    it('answers no message for the request of another member, as for a missing one', async () => {
      await write(peter.id, 'answer', AT)
      expect(await dbSelectSupportTicketDialogOfOwner(ticketId, peter.id)).toEqual([])
      expect(await dbSelectSupportTicketDialogOfOwner(ticketId + 1000, bibi.id)).toEqual([])
    })

    it('reads the thread of a closed request, and none of a deleted one', async () => {
      const answer = await write(peter.id, 'answer', AT)
      const setStatus = (status: 'OPEN' | 'CLOSED' | 'DELETED') =>
        db.update(supportTicketsTable).set({ status }).where(eq(supportTicketsTable.id, ticketId))
      try {
        await setStatus('CLOSED')
        expect(
          (await dbSelectSupportTicketDialogOfOwner(ticketId, bibi.id)).map((m) => m.id),
        ).toEqual([answer])
        await setStatus('DELETED')
        expect(await dbSelectSupportTicketDialogOfOwner(ticketId, bibi.id)).toEqual([])
      } finally {
        await setStatus('OPEN')
      }
    })
  })
})

// The moderation's side (K2): every kind of message, and the newest dialog message of a page.
describe('supportTicketMessages query test, the moderation side', () => {
  let otherTicketId: number
  const writeIn = (
    supportTicketId: number,
    userId: number,
    message: string,
    type: SupportTicketMessageType = 'DIALOG',
  ) =>
    inTransaction((tx) =>
      dbInsertSupportTicketMessage(
        { supportTicketId, userId, message, type, isModerator: userId === peter.id, createdAt: AT },
        tx,
      ),
    )

  beforeAll(async () => {
    otherTicketId = await inTransaction((tx) =>
      dbInsertSupportTicket(
        { userId: peter.id, creationGroupId: null, text: 'Frage', createdAt: AT },
        tx,
      ),
    )
  })

  describe('the newest dialog message of each request', () => {
    it('answers its kind and whether the moderation wrote it, a younger note left out', async () => {
      await writeIn(ticketId, bibi.id, 'question')
      await writeIn(ticketId, peter.id, 'answer')
      await writeIn(ticketId, peter.id, 'a note after the answer', 'MODERATOR')
      await writeIn(otherTicketId, peter.id, 'question of the moderator as a member')
      await writeIn(otherTicketId, bibi.id, 'answer of bibi')
      expect(await dbSelectNewestSupportTicketDialogs([ticketId, otherTicketId])).toEqual(
        new Map([
          [ticketId, { type: 'DIALOG', isModerator: true }],
          [otherTicketId, { type: 'DIALOG', isModerator: false }],
        ]),
      )
    })

    it('leaves out a request without a dialog message, also one with only a note', async () => {
      await writeIn(otherTicketId, peter.id, 'only a note', 'MODERATOR')
      expect(await dbSelectNewestSupportTicketDialogs([ticketId, otherTicketId])).toEqual(new Map())
    })

    it('answers only the requests asked about', async () => {
      await writeIn(ticketId, bibi.id, 'question')
      await writeIn(otherTicketId, bibi.id, 'another')
      expect([...(await dbSelectNewestSupportTicketDialogs([otherTicketId])).keys()]).toEqual([
        otherTicketId,
      ])
      expect(await dbSelectNewestSupportTicketDialogs([])).toEqual(new Map())
    })
  })

  describe('the thread as the moderation reads it', () => {
    it('reads the dialog and the notes, the oldest first, each with its author', async () => {
      const question = await writeIn(ticketId, bibi.id, 'question')
      const note = await writeIn(ticketId, peter.id, 'internal note', 'MODERATOR')
      const answer = await writeIn(ticketId, peter.id, 'answer')
      await writeIn(otherTicketId, bibi.id, 'another request')
      const thread = await dbSelectSupportTicketThread(ticketId)
      expect(thread.map((message) => message.id)).toEqual([question, note, answer])
      expect(thread[1]).toEqual({
        id: note,
        message: 'internal note',
        createdAt: AT,
        type: 'MODERATOR',
        isModerator: true,
        authorId: peter.id,
        authorAlias: peter.alias,
        authorFirstName: peter.firstName,
        authorLastName: peter.lastName,
        authorGradidoId: peter.gradidoId,
        authorCommunityUuid: peter.communityUuid,
      })
      expect(thread[0]).toMatchObject({ authorId: bibi.id, isModerator: false, type: 'DIALOG' })
    })

    it('reads the thread of a deleted request as well', async () => {
      const answer = await writeIn(ticketId, peter.id, 'answer')
      const setStatus = (status: 'OPEN' | 'DELETED') =>
        db.update(supportTicketsTable).set({ status }).where(eq(supportTicketsTable.id, ticketId))
      try {
        await setStatus('DELETED')
        expect((await dbSelectSupportTicketThread(ticketId)).map((m) => m.id)).toEqual([answer])
      } finally {
        await setStatus('OPEN')
      }
    })

    it('answers no message for a request nobody wrote in yet, and for a missing one', async () => {
      expect(await dbSelectSupportTicketThread(ticketId)).toEqual([])
      expect(await dbSelectSupportTicketThread(ticketId + 1000)).toEqual([])
    })
  })

  // peter moderates (K3): bibi's request has no group, the other one is peter's own
  describe('counting a thread as the moderation writes in it', () => {
    const EVERYTHING: SupportTicketScope = {
      tags: [],
      seesAllCreationGroups: true,
      seesUntagged: true,
    }
    const counted = (
      id: number,
      type: SupportTicketMessageType,
      within: SupportTicketScope = EVERYTHING,
      statusIn: ('OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'DELETED')[] = [
        'OPEN',
        'IN_PROGRESS',
        'CLOSED',
      ],
    ) =>
      inTransaction((tx) =>
        dbCountSupportTicketMessagesOfModerator(
          { id, statusIn, scope: within, moderatorId: peter.id },
          type,
          tx,
        ),
      )

    it('counts the messages of the kind asked for, each kind on its own', async () => {
      await writeIn(ticketId, bibi.id, 'question')
      await writeIn(ticketId, peter.id, 'answer')
      await writeIn(ticketId, peter.id, 'note', 'MODERATOR')
      expect(await counted(ticketId, 'DIALOG')).toBe(2)
      expect(await counted(ticketId, 'MODERATOR')).toBe(1)
    })

    it('counts where the scope reaches the request, and answers 0 outside it', async () => {
      await writeIn(ticketId, bibi.id, 'question')
      const ofNoGroup = { tags: [], seesAllCreationGroups: false, seesUntagged: true }
      const ofTheGarden = { tags: ['garden'], seesAllCreationGroups: false, seesUntagged: false }
      expect(await counted(ticketId, 'DIALOG', ofNoGroup)).toBe(1)
      expect(await counted(ticketId, 'DIALOG', ofTheGarden)).toBe(0)
    })

    it('answers 0 for the moderator own request, a request of another state and a missing one', async () => {
      await writeIn(otherTicketId, peter.id, 'my own question')
      await writeIn(ticketId, bibi.id, 'question')
      expect(await counted(otherTicketId, 'DIALOG')).toBe(0)
      expect(await counted(ticketId, 'DIALOG', EVERYTHING, ['CLOSED'])).toBe(0)
      expect(await counted(ticketId + 1000, 'DIALOG')).toBe(0)
    })
  })
})
