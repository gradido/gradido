// AI-GENERATED — not an architecture reference
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { clearLogs, getLogger, printLogs } from 'config-schema/test/testSetup'
import { sendNewSupportTicketEmail } from 'core'
import {
  AppDatabase,
  creationGroupsTable,
  DbUser,
  dbCountUnfinishedSupportTicketsOfUser,
  dbUpdateHomeCommunity,
  drizzleDb,
  SupportTicketMessageType,
  supportTicketMessagesTable,
  supportTicketsTable,
  userContactsTable,
  usersTable,
} from 'database'
import { eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'
import { gql } from 'graphql-tag'
import { MESSAGE_MAX_CHARS, SUPPORT_TICKET_MESSAGES_MAX, SUPPORT_TICKETS_PER_DAY_MAX } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { SUPPORT_TICKET_READS_MAX_PER_REQUEST } from '@/data/SupportTicket.logic'
import { userFactoryDrizzle } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

// The member's side of support requests, through the schema: `@Authorized` and the request's
// budget live at the GraphQL layer, and the owner in every query's condition lives in the
// database. bibi asks, bob is another member, peter answers as the moderation (written straight
// into the tables: the moderation's side comes with K2 and K3).

// The mail to the moderation about a new request (K5) is caught here: what it says is core's
// (sendEmailVariants.newSupportTicket), who gets it the rule's (SupportTicket.logic) -- and here
// peter, the one administrator, is everybody with a role.
jest.mock('core', () => {
  const original = jest.requireActual('core')
  return {
    __esModule: true,
    ...original,
    sendNewSupportTicketEmail: jest.fn(async () => ({ accepted: ['watched'] })),
  }
})

// The count of the wallet's menu passes through to the database, and can be made to fail once:
// the menu answers null then, and the chat's beat beside it goes on (K5, Falle 2).
jest.mock('database', () => {
  const original = jest.requireActual('database')
  return {
    __esModule: true,
    ...original,
    dbCountUnfinishedSupportTicketsOfUser: jest.fn(original.dbCountUnfinishedSupportTicketsOfUser),
  }
})

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let bibi: DbUser
let bob: DbUser
let peter: DbUser

const createSupportTicket = gql`
  mutation ($text: String!, $creationGroupTag: String) {
    createSupportTicket(text: $text, creationGroupTag: $creationGroupTag) {
      id
      text
      status
      creationGroupTag
      creationGroupName
    }
  }
`
const listSupportTickets = gql`
  query ($currentPage: Int!, $pageSize: Int!) {
    listSupportTickets(currentPage: $currentPage, pageSize: $pageSize) {
      count
      tickets {
        id
        text
        status
        creationGroupTag
      }
    }
  }
`
const listSupportTicketMessages = gql`
  query ($supportTicketId: Int!) {
    listSupportTicketMessages(supportTicketId: $supportTicketId) {
      id
      message
      type
      userAlias
      userAvatarColorIndex
      userGradidoID
      userCommunityUuid
    }
  }
`
const createSupportTicketMessage = gql`
  mutation ($supportTicketId: Int!, $message: String!) {
    createSupportTicketMessage(supportTicketId: $supportTicketId, message: $message) {
      id
      message
      type
      userAlias
      userGradidoID
    }
  }
`
const closeSupportTicket = gql`
  mutation ($supportTicketId: Int!) {
    closeSupportTicket(supportTicketId: $supportTicketId)
  }
`

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  const { errors } = await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
  expect(errors).toBeUndefined()
}

const file = (text: string, creationGroupTag: string | null = null): Promise<any> =>
  mutate({ mutation: createSupportTicket, variables: { text, creationGroupTag } })

const fileOk = async (text: string, creationGroupTag: string | null = null): Promise<number> => {
  const res = await file(text, creationGroupTag)
  expect(res.errors).toBeUndefined()
  return res.data.createSupportTicket.id
}

const write = (supportTicketId: number, message: string): Promise<any> =>
  mutate({ mutation: createSupportTicketMessage, variables: { supportTicketId, message } })

const thread = async (supportTicketId: number): Promise<any[]> => {
  const res: any = await query({ query: listSupportTicketMessages, variables: { supportTicketId } })
  expect(res.errors).toBeUndefined()
  return res.data.listSupportTicketMessages
}

const statusOf = async (id: number) =>
  (await drizzleDb().select().from(supportTicketsTable).where(eq(supportTicketsTable.id, id)))[0]

/** A message of the moderation, written straight into the thread. */
const moderationWrites = (
  supportTicketId: number,
  message: string,
  type: SupportTicketMessageType = 'DIALOG',
) =>
  drizzleDb()
    .insert(supportTicketMessagesTable)
    .values({ supportTicketId, userId: peter.id, message, type, isModerator: true })

const refusedWith = (code: string) =>
  expect.objectContaining({ errors: [expect.objectContaining({ message: code })] })

const unauthorized = expect.objectContaining({ errors: [new GraphQLError('401 Unauthorized')] })

const clearTickets = async () => {
  await drizzleDb().delete(supportTicketMessagesTable)
  await drizzleDb().delete(supportTicketsTable)
}

beforeAll(async () => {
  const testEnv = await testEnvironment(logErrorLogger)
  mutate = testEnv.mutate
  query = testEnv.query
  await cleanDB()
  bibi = await userFactoryDrizzle(bibiBloxberg)
  bob = await userFactoryDrizzle(bobBaumeister)
  peter = await userFactoryDrizzle(peterLustig)
  await drizzleDb().insert(creationGroupsTable).values({ tag: 'garden', name: 'Garten' })
})

afterAll(async () => {
  await cleanDB()
  await AppDatabase.getInstance().destroy()
})

describe('SupportTicketResolver', () => {
  describe('without a login', () => {
    beforeAll(() => resetToken())

    it('files, lists, reads, writes and closes nothing', async () => {
      await expect(file('Wie schöpfe ich?')).resolves.toEqual(unauthorized)
      await expect(
        query({ query: listSupportTickets, variables: { currentPage: 1, pageSize: 25 } }),
      ).resolves.toEqual(unauthorized)
      await expect(
        query({ query: listSupportTicketMessages, variables: { supportTicketId: 1 } }),
      ).resolves.toEqual(unauthorized)
      await expect(write(1, 'Hallo')).resolves.toEqual(unauthorized)
      await expect(
        mutate({ mutation: closeSupportTicket, variables: { supportTicketId: 1 } }),
      ).resolves.toEqual(unauthorized)
    })
  })

  // First among the tests that file: the mails of an hour are capped per process (SUA-024).
  describe('the mail to the moderation (K5)', () => {
    const mail = sendNewSupportTicketEmail as jest.Mock
    /** Waits for what a request does not wait for: the mails it started. */
    const mailsSent = async (): Promise<void> => {
      for (let turn = 0; turn < 5; turn++) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }

    beforeEach(() => mail.mockClear())
    afterEach(clearTickets)

    it('mails the moderation once the request is filed: who asked, its number and group, no word of it', async () => {
      await loginAs('bibi@bloxberg.de')
      const id = await fileOk('Wie giesse ich den Garten?', 'garden')
      await mailsSent()
      expect(mail.mock.calls).toEqual([
        [
          {
            firstName: 'Peter',
            lastName: 'Lustig',
            email: 'peter@lustig.de',
            language: 'de',
            actorAlias: 'BBB',
            supportTicketNumber: id,
            groupName: 'Garten',
            reassigned: false,
          },
        ],
      ])
    })

    it('files the request all the same where the mail fails', async () => {
      await loginAs('bibi@bloxberg.de')
      mail.mockRejectedValueOnce(new Error('the mail server is gone'))
      const id = await fileOk('Und ohne Mail?')
      await mailsSent()
      expect(mail).toHaveBeenCalledTimes(1)
      expect(await statusOf(id)).toMatchObject({ status: 'OPEN', text: 'Und ohne Mail?' })
    })

    it('mails nobody about the own request of the only one there is to mail', async () => {
      await loginAs('peter@lustig.de')
      await fileOk('Ich frage selbst.')
      await mailsSent()
      expect(mail).not.toHaveBeenCalled()
    })
  })

  describe('the member who asks', () => {
    beforeAll(() => loginAs('bibi@bloxberg.de'))
    afterEach(clearTickets)

    it('files a request in a group, and finds it in the list', async () => {
      const res = await file('  Wie schöpfe ich im Garten?  ', 'garden')
      expect(res.data.createSupportTicket).toMatchObject({
        text: 'Wie schöpfe ich im Garten?',
        status: 'OPEN',
        creationGroupTag: 'garden',
        creationGroupName: 'Garten',
      })
      const list: any = await query({
        query: listSupportTickets,
        variables: { currentPage: 1, pageSize: 25 },
      })
      expect(list.data.listSupportTickets).toEqual({
        count: 1,
        tickets: [
          {
            id: res.data.createSupportTicket.id,
            text: 'Wie schöpfe ich im Garten?',
            status: 'OPEN',
            creationGroupTag: 'garden',
          },
        ],
      })
    })

    it('files a request without a group, for the support of the community', async () => {
      const res = await file('Wie schöpfe ich?')
      expect(res.data.createSupportTicket).toMatchObject({ creationGroupTag: null, status: 'OPEN' })
    })

    it('refuses a group the community does not have, with nothing filed', async () => {
      await expect(file('Wie schöpfe ich?', 'imkerei')).resolves.toEqual(
        refusedWith('SUPPORT_TICKET_UNKNOWN_GROUP'),
      )
      expect(await drizzleDb().select().from(supportTicketsTable)).toEqual([])
    })

    it('refuses words that are too short or too long', async () => {
      await expect(file('Hilf')).resolves.toEqual(refusedWith('SUPPORT_TICKET_INVALID'))
      await expect(file('x'.repeat(MESSAGE_MAX_CHARS + 1))).resolves.toEqual(
        refusedWith('SUPPORT_TICKET_INVALID'),
      )
    })

    it('reads the thread with the moderation answer and without its internal note', async () => {
      const id = await fileOk('Wie schöpfe ich?')
      await moderationWrites(id, 'Nur für uns: kennt Ramona', 'MODERATOR')
      await moderationWrites(id, 'Unter „Schöpfen“, oben links.')
      const messages = await thread(id)
      expect(messages).toEqual([
        expect.objectContaining({
          message: 'Unter „Schöpfen“, oben links.',
          type: 'DIALOG',
          userAlias: peter.alias,
          userGradidoID: peter.gradidoId,
          userCommunityUuid: peter.communityUuid,
        }),
      ])
      expect(JSON.stringify(messages)).not.toContain('Ramona')
    })

    it('writes in the thread: the request is open again, and the answer holds no note', async () => {
      const id = await fileOk('Wie schöpfe ich?')
      await drizzleDb()
        .update(supportTicketsTable)
        .set({ status: 'IN_PROGRESS' })
        .where(eq(supportTicketsTable.id, id))
      await moderationWrites(id, 'Nur für uns: kennt Ramona', 'MODERATOR')
      const res = await write(id, '  Danke, gefunden!  ')
      expect(res.errors).toBeUndefined()
      expect(res.data.createSupportTicketMessage).toMatchObject({
        message: 'Danke, gefunden!',
        type: 'DIALOG',
        userAlias: bibi.alias,
        userGradidoID: bibi.gradidoId,
      })
      expect(JSON.stringify(res.data)).not.toContain('Ramona')
      expect((await statusOf(id)).status).toBe('OPEN')
      expect((await thread(id)).map((message) => message.message)).toEqual(['Danke, gefunden!'])
    })

    it('opens a closed request again by writing in it, and forgets who closed it', async () => {
      const id = await fileOk('Wie schöpfe ich?')
      await drizzleDb()
        .update(supportTicketsTable)
        .set({ status: 'CLOSED', closedAt: new Date(), closedBy: peter.id })
        .where(eq(supportTicketsTable.id, id))
      expect((await write(id, 'Noch eine Frage')).errors).toBeUndefined()
      expect(await statusOf(id)).toMatchObject({ status: 'OPEN', closedAt: null, closedBy: null })
    })

    it('writes nothing into a deleted request', async () => {
      const id = await fileOk('Wie schöpfe ich?')
      await drizzleDb()
        .update(supportTicketsTable)
        .set({ status: 'DELETED' })
        .where(eq(supportTicketsTable.id, id))
      await expect(write(id, 'Hallo?')).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
      expect(await drizzleDb().select().from(supportTicketMessagesTable)).toEqual([])
      expect((await statusOf(id)).status).toBe('DELETED')
    })

    it('closes an own request, and closes it only once', async () => {
      const id = await fileOk('Wie schöpfe ich?')
      const closed: any = await mutate({
        mutation: closeSupportTicket,
        variables: { supportTicketId: id },
      })
      expect(closed.data.closeSupportTicket).toBe(true)
      expect(await statusOf(id)).toMatchObject({ status: 'CLOSED', closedBy: bibi.id })
      await expect(
        mutate({ mutation: closeSupportTicket, variables: { supportTicketId: id } }),
      ).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
    })

    it('files at most so many requests in 24 hours, the older ones not counted', async () => {
      const now = Date.now()
      await drizzleDb()
        .insert(supportTicketsTable)
        .values([
          { userId: bibi.id, text: 'two days ago', createdAt: new Date(now - 25 * 60 * 60 * 1000) },
          ...Array.from({ length: SUPPORT_TICKETS_PER_DAY_MAX - 1 }, () => ({
            userId: bibi.id,
            text: 'today',
            createdAt: new Date(now - 60 * 1000),
          })),
        ])
      expect((await file('the last one today')).errors).toBeUndefined()
      await expect(file('one too many')).resolves.toEqual(
        refusedWith('SUPPORT_TICKETS_PER_DAY_REACHED'),
      )
      expect(await drizzleDb().select().from(supportTicketsTable)).toHaveLength(
        SUPPORT_TICKETS_PER_DAY_MAX + 1,
      )
    })

    it('writes at most so many messages in a thread, counting what the member reads', async () => {
      const id = await fileOk('Wie schöpfe ich?')
      // The notes of the moderation are no part of the limit: the member learns of them from
      // no number, also not from the moment the thread is full.
      const rows = (count: number, type: SupportTicketMessageType) =>
        Array.from({ length: count }, (_, n) => ({
          supportTicketId: id,
          userId: peter.id,
          message: `${type} ${n}`,
          type,
          isModerator: true,
        }))
      await drizzleDb()
        .insert(supportTicketMessagesTable)
        .values([...rows(SUPPORT_TICKET_MESSAGES_MAX - 1, 'DIALOG'), ...rows(5, 'MODERATOR')])
      expect((await write(id, 'the last one')).errors).toBeUndefined()
      await expect(write(id, 'one too many')).resolves.toEqual(
        refusedWith('SUPPORT_TICKET_MESSAGES_REACHED'),
      )
    })

    it('takes one write per HTTP request, however many aliases ask for more', async () => {
      const res: any = await mutate({
        mutation: gql`
          mutation {
            first: createSupportTicket(text: "Die erste Frage") {
              id
            }
            second: createSupportTicket(text: "Die zweite Frage") {
              id
            }
          }
        `,
      })
      expect(res.errors).toEqual([
        expect.objectContaining({ message: 'Too many support writes at once' }),
      ])
      expect(await drizzleDb().select().from(supportTicketsTable)).toHaveLength(1)
    })

    // Each operation counts itself in the budget of the HTTP request -- and the counters are also
    // what keeps a support answer out of the trace log (plugins.ts): one missing count would let a
    // whole thread into the log. So every operation is held here, not only the first.
    it('reads the own list at most so many times per HTTP request', async () => {
      const aliases = Array.from(
        { length: SUPPORT_TICKET_READS_MAX_PER_REQUEST + 1 },
        (_, n) => `list${n}: listSupportTickets(currentPage: 1, pageSize: 5) { count }`,
      )
      const res: any = await query({ query: gql(`query { ${aliases.join('\n')} }`) })
      expect(res.errors).toEqual([
        expect.objectContaining({ message: 'Too many support requests read at once' }),
      ])
    })

    it('reads a thread at most so many times per HTTP request', async () => {
      const id = await fileOk('Wie schöpfe ich?')
      const aliases = Array.from(
        { length: SUPPORT_TICKET_READS_MAX_PER_REQUEST + 1 },
        (_, n) => `thread${n}: listSupportTicketMessages(supportTicketId: ${id}) { id }`,
      )
      const res: any = await query({ query: gql(`query { ${aliases.join('\n')} }`) })
      expect(res.errors).toEqual([
        expect.objectContaining({ message: 'Too many support requests read at once' }),
      ])
    })

    it('writes one message per HTTP request, however many aliases ask for more', async () => {
      const id = await fileOk('Wie schöpfe ich?')
      const res: any = await mutate({
        mutation: gql`
          mutation ($id: Int!) {
            first: createSupportTicketMessage(supportTicketId: $id, message: "Erstens") {
              id
            }
            second: createSupportTicketMessage(supportTicketId: $id, message: "Zweitens") {
              id
            }
          }
        `,
        variables: { id },
      })
      expect(res.errors).toEqual([
        expect.objectContaining({ message: 'Too many support writes at once' }),
      ])
      expect(await thread(id)).toHaveLength(1)
    })

    it('closes one request per HTTP request, however many aliases ask for more', async () => {
      const first = await fileOk('Die erste Frage')
      const second = await fileOk('Die zweite Frage')
      const res: any = await mutate({
        mutation: gql`
          mutation ($first: Int!, $second: Int!) {
            first: closeSupportTicket(supportTicketId: $first)
            second: closeSupportTicket(supportTicketId: $second)
          }
        `,
        variables: { first, second },
      })
      expect(res.errors).toEqual([
        expect.objectContaining({ message: 'Too many support writes at once' }),
      ])
      expect([(await statusOf(first)).status, (await statusOf(second)).status]).toEqual([
        'CLOSED',
        'OPEN',
      ])
    })
  })

  describe('with new requests switched off (K5)', () => {
    beforeAll(() => loginAs('bibi@bloxberg.de'))
    afterEach(async () => {
      await dbUpdateHomeCommunity({ supportTicketsActive: true })
      await clearTickets()
    })

    it('files no new request, and says so', async () => {
      await dbUpdateHomeCommunity({ supportTicketsActive: false })
      await expect(file('Geht das noch?', 'garden')).resolves.toEqual(
        refusedWith('SUPPORT_TICKETS_OFF'),
      )
      expect(await drizzleDb().select().from(supportTicketsTable)).toEqual([])
    })

    it('lets the member write in a request, open a closed one again by writing, and close it', async () => {
      const open = await fileOk('Schon vorher gestellt')
      const closed = await fileOk('Schon geschlossen')
      await drizzleDb()
        .update(supportTicketsTable)
        .set({ status: 'CLOSED', closedAt: new Date(), closedBy: bibi.id })
        .where(eq(supportTicketsTable.id, closed))
      await dbUpdateHomeCommunity({ supportTicketsActive: false })

      expect((await write(open, 'Noch eine Frage')).errors).toBeUndefined()
      expect((await write(closed, 'Doch noch etwas')).errors).toBeUndefined()
      expect(await statusOf(closed)).toMatchObject({ status: 'OPEN', closedAt: null })
      expect(await thread(closed)).toHaveLength(1)
      const res = await mutate({
        mutation: closeSupportTicket,
        variables: { supportTicketId: open },
      })
      expect(res.errors).toBeUndefined()
      expect(await statusOf(open)).toMatchObject({ status: 'CLOSED' })
    })

    it('files again once switched on', async () => {
      await dbUpdateHomeCommunity({ supportTicketsActive: false })
      await dbUpdateHomeCommunity({ supportTicketsActive: true })
      await fileOk('Wieder offen?')
    })
  })

  describe("the wallet's menu (K5)", () => {
    const supportTicketsMenu = gql`
      query {
        supportTicketsMenu {
          active
          inProgress
          unfinished
        }
      }
    `
    // the document of the chat's beat as the wallet sends it, the menu as its second field
    const chatBeat = gql`
      query {
        newChatMessagesSince {
          latestId
          unreadConversations
        }
        supportTicketsMenu {
          active
          inProgress
          unfinished
        }
      }
    `
    const menu = async () => {
      const res: any = await query({ query: supportTicketsMenu })
      expect(res.errors).toBeUndefined()
      return res.data.supportTicketsMenu
    }
    const setStatus = (id: number, status: 'IN_PROGRESS' | 'CLOSED' | 'DELETED') =>
      drizzleDb().update(supportTicketsTable).set({ status }).where(eq(supportTicketsTable.id, id))

    afterEach(async () => {
      await dbUpdateHomeCommunity({ supportTicketsActive: true })
      await clearTickets()
    })

    it("counts the member's own requests with a question back and those not closed, none of another's", async () => {
      await loginAs('bob@baumeister.de')
      await setStatus(await fileOk('Bobs Rückfrage'), 'IN_PROGRESS')
      await loginAs('bibi@bloxberg.de')
      await fileOk('Offen')
      await setStatus(await fileOk('Mit Rückfrage'), 'IN_PROGRESS')
      await setStatus(await fileOk('Geschlossen'), 'CLOSED')
      await setStatus(await fileOk('Gelöscht'), 'DELETED')

      expect(await menu()).toEqual({ active: true, inProgress: 1, unfinished: 2 })
    })

    it('says whether new requests are switched on', async () => {
      await loginAs('bibi@bloxberg.de')
      await dbUpdateHomeCommunity({ supportTicketsActive: false })
      expect(await menu()).toEqual({ active: false, inProgress: 0, unfinished: 0 })
    })

    it('answers nothing where it cannot count, and the chat beside it goes on', async () => {
      await loginAs('bibi@bloxberg.de')
      ;(dbCountUnfinishedSupportTicketsOfUser as jest.Mock).mockRejectedValueOnce(
        Object.assign(new Error('the database is gone'), { code: 'ECONNRESET' }),
      )
      const res: any = await query({ query: chatBeat })
      expect(res.errors).toBeUndefined()
      expect(res.data.supportTicketsMenu).toBeNull()
      expect(res.data.newChatMessagesSince).toEqual(
        expect.objectContaining({ unreadConversations: 0 }),
      )
    })

    it("counts in no budget of the support: the chat's beat may ask it beside a list", async () => {
      await loginAs('bibi@bloxberg.de')
      const res: any = await query({
        query: gql`
          query {
            a: supportTicketsMenu { active }
            b: supportTicketsMenu { active }
            c: supportTicketsMenu { active }
            d: supportTicketsMenu { active }
            e: supportTicketsMenu { active }
            f: supportTicketsMenu { active }
            listSupportTickets(currentPage: 1, pageSize: 25) { count }
          }
        `,
      })
      expect(res.errors).toBeUndefined()
    })

    it("reaches an account unconfirmed past its grace period, and a project account, in the chat's beat", async () => {
      // confirmed so that a password exists, then unconfirmed and two days old (as in the chat)
      const garrick = await userFactoryDrizzle({ ...garrickOllivander, emailChecked: true })
      await drizzleDb()
        .update(usersTable)
        .set({ createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) })
        .where(eq(usersTable.id, garrick.id))
      await drizzleDb()
        .update(userContactsTable)
        .set({ emailChecked: false })
        .where(eq(userContactsTable.userId, garrick.id))
      const raeuber = await userFactoryDrizzle(raeuberHotzenplotz)
      await drizzleDb()
        .update(usersTable)
        .set({ creationAllowed: false })
        .where(eq(usersTable.id, raeuber.id))

      for (const email of ['garrick@ollivander.com', 'raeuber@hotzenplotz.de']) {
        await loginAs(email)
        const res: any = await query({ query: chatBeat })
        expect([email, res.errors]).toEqual([email, undefined])
        expect(res.data.supportTicketsMenu).toEqual({ active: true, inProgress: 0, unfinished: 0 })
      }
    })
  })

  describe('another member', () => {
    let ticket: number

    beforeAll(async () => {
      await loginAs('bibi@bloxberg.de')
      ticket = await fileOk('Meine Frage an den Support')
      await moderationWrites(ticket, 'Die Antwort')
      await loginAs('bob@baumeister.de')
    })
    afterAll(clearTickets)

    it('does not find the request in the list', async () => {
      const list: any = await query({
        query: listSupportTickets,
        variables: { currentPage: 1, pageSize: 25 },
      })
      expect(list.data.listSupportTickets).toEqual({ count: 0, tickets: [] })
    })

    it('reads no message of its thread', async () => {
      expect(await thread(ticket)).toEqual([])
    })

    it('writes nothing in it and closes nothing, answered as for a request that does not exist', async () => {
      await expect(write(ticket, 'Ich mische mich ein')).resolves.toEqual(
        refusedWith('SUPPORT_TICKET_NOT_FOUND'),
      )
      await expect(write(ticket + 1000, 'Ich mische mich ein')).resolves.toEqual(
        refusedWith('SUPPORT_TICKET_NOT_FOUND'),
      )
      await expect(
        mutate({ mutation: closeSupportTicket, variables: { supportTicketId: ticket } }),
      ).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
      expect(await statusOf(ticket)).toMatchObject({ status: 'OPEN', closedBy: null })
      expect(
        await drizzleDb()
          .select()
          .from(supportTicketMessagesTable)
          .where(eq(supportTicketMessagesTable.userId, bob.id)),
      ).toEqual([])
    })
  })

  describe('the log', () => {
    beforeAll(() => loginAs('bibi@bloxberg.de'))
    afterAll(clearTickets)

    it('gets nothing of the words a member writes, also where a write is refused', async () => {
      clearLogs()
      const id = await fileOk('Geheimnis: meine Tochter heisst Ramona', 'garden')
      await write(id, 'Ramona fragt auch')
      await thread(id)
      await file('Ramona im falschen Garten', 'imkerei')
      await write(id + 1000, 'Ramona nirgends')
      const lines: string[] = []
      const stdout = jest.spyOn(process.stdout, 'write').mockImplementation((line) => {
        lines.push(String(line))
        return true
      })
      printLogs()
      stdout.mockRestore()
      // the fixture has to prove itself: the refusals were logged
      expect(lines.join('')).toContain('SUPPORT_TICKET_UNKNOWN_GROUP')
      expect(lines.join('')).not.toContain('Ramona')
    })
  })
})
