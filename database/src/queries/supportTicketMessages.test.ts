// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { DbUser } from '../data'
import { SupportTicketMessageType, supportTicketMessagesTable } from '../schemas'
import { createCommunity } from '../seeds/community'
import { userFactoryDrizzle } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { peterLustig } from '../seeds/users/peter-lustig'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'
import {
  dbCountSupportTicketMessagesOfOwner,
  dbInsertSupportTicketMessage,
  dbSelectSupportTicketDialogOfOwner,
} from './supportTicketMessages'
import { dbInsertSupportTicket } from './supportTickets'

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
    it('counts every kind of message of the owner request, the notes as well', async () => {
      await write(bibi.id, 'question', AT)
      await write(peter.id, 'note', AT, 'MODERATOR')
      await write(peter.id, 'answer', LATER)
      expect(
        await inTransaction((tx) => dbCountSupportTicketMessagesOfOwner(ticketId, bibi.id, tx)),
      ).toBe(3)
    })

    it('answers 0 for the request of another member, as for a missing one', async () => {
      await write(bibi.id, 'question', AT)
      expect(
        await inTransaction((tx) => dbCountSupportTicketMessagesOfOwner(ticketId, peter.id, tx)),
      ).toBe(0)
      expect(
        await inTransaction((tx) =>
          dbCountSupportTicketMessagesOfOwner(ticketId + 1000, bibi.id, tx),
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

    it('answers no message for the request of another member, as for a missing one', async () => {
      await write(peter.id, 'answer', AT)
      expect(await dbSelectSupportTicketDialogOfOwner(ticketId, peter.id)).toEqual([])
      expect(await dbSelectSupportTicketDialogOfOwner(ticketId + 1000, bibi.id)).toEqual([])
    })
  })
})
