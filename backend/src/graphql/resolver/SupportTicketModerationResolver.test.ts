// AI-GENERATED — not an architecture reference
import { RoleNames } from '@enum/RoleNames'
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { clearLogs, getLogger, printLogs } from 'config-schema/test/testSetup'
import { sendAddedSupportTicketMessageEmail } from 'core'
import {
  AppDatabase,
  creationGroupsTable,
  DbUser,
  drizzleDb,
  SupportTicketMessageType,
  SupportTicketStatus,
  supportTicketMessagesTable,
  supportTicketsTable,
  UserRole,
  userContactsTable,
  usersTable,
} from 'database'
import { eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'
import { gql } from 'graphql-tag'
import { MESSAGE_MAX_CHARS, SUPPORT_TICKET_MESSAGES_MAX } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { SUPPORT_TICKET_READS_MAX_PER_REQUEST } from '@/data/SupportTicket.logic'
import { userFactoryDrizzle } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'
import { stephenHawking } from '@/seeds/users/stephen-hawking'

// The moderation's side of support requests (K2, K3), through the schema: `@Authorized` and the
// request's budget live at the GraphQL layer, the scope in the database. bibi asks, peter is an
// administrator, bob moderates the garden (and asks himself), räuber the requests without a group.
// garrick has no address in force, stephen's account is deleted. The requests and their threads
// are written straight into the tables, the way the member's side (K1) and K3 write them. The
// mail to the member is caught here: what it says is core's (sendEmailVariants.supportAnswer).

jest.mock('core', () => {
  const original = jest.requireActual('core')
  return {
    __esModule: true,
    ...original,
    sendAddedSupportTicketMessageEmail: jest.fn(async () => ({ accepted: ['watched'] })),
  }
})

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let bibi: DbUser
let bob: DbUser
let raeuber: DbUser
let peter: DbUser
let garrick: DbUser
let stephen: DbUser

const adminListSupportTickets = gql`
  query ($statuses: [SupportTicketStatus!]!, $currentPage: Int!, $pageSize: Int!) {
    adminListSupportTickets(statuses: $statuses, currentPage: $currentPage, pageSize: $pageSize) {
      count
      tickets {
        id
        userId
        user {
          id
          firstName
          lastName
          alias
          gradidoID
        }
        userEmail
        text
        status
        creationGroupTag
        creationGroupName
        closedAt
        closedBy
        closedByUserName
        lastMessageType
        lastMessageByModerator
      }
    }
  }
`
const adminListSupportTicketMessages = gql`
  query ($supportTicketId: Int!) {
    adminListSupportTicketMessages(supportTicketId: $supportTicketId) {
      id
      message
      type
      isModerator
      userId
      userAlias
      userGradidoID
    }
  }
`

const ALL: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'CLOSED', 'DELETED']
const OPEN_TAB: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS']
const DAY = new Date('2026-11-14T08:00:00.000Z')
const at = (minutes: number) => new Date(DAY.getTime() + minutes * 60 * 1000)

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  const { errors } = await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
  expect(errors).toBeUndefined()
}

const list = (statuses: SupportTicketStatus[], currentPage = 1, pageSize = 25): Promise<any> =>
  query({ query: adminListSupportTickets, variables: { statuses, currentPage, pageSize } })

const listed = async (statuses: SupportTicketStatus[] = ALL): Promise<any> => {
  const res = await list(statuses)
  expect(res.errors).toBeUndefined()
  return res.data.adminListSupportTickets
}

// the ids of the page, the count agreeing with them
const idsListed = async (statuses: SupportTicketStatus[] = ALL): Promise<number[]> => {
  const { count, tickets } = await listed(statuses)
  expect(count).toBe(tickets.length)
  return tickets.map((ticket: { id: number }) => ticket.id)
}

const threadOf = (supportTicketId: number): Promise<any> =>
  query({ query: adminListSupportTicketMessages, variables: { supportTicketId } })

const ticketOf = async (id: number) => (await listed()).tickets.find((t: any) => t.id === id)

const refusedWith = (code: string) =>
  expect.objectContaining({ errors: [expect.objectContaining({ message: code })] })

const unauthorized = expect.objectContaining({ errors: [new GraphQLError('401 Unauthorized')] })

let gardenId: number
let choirId: number

const file = async (
  userId: number,
  text: string,
  minute: number,
  creationGroupId: number | null,
  more: Partial<typeof supportTicketsTable.$inferInsert> = {},
): Promise<number> => {
  const [row] = await drizzleDb()
    .insert(supportTicketsTable)
    .values({ userId, text, creationGroupId, createdAt: at(minute), ...more })
  return row.insertId
}

const writes = async (
  supportTicketId: number,
  author: DbUser,
  message: string,
  minute: number,
  type: SupportTicketMessageType = 'DIALOG',
): Promise<number> => {
  const [row] = await drizzleDb()
    .insert(supportTicketMessagesTable)
    .values({
      supportTicketId,
      userId: author.id,
      message,
      type,
      // a note is the moderation's; in the dialog peter answers, bibi and bob ask
      isModerator: type === 'MODERATOR' || author.id === peter.id,
      createdAt: at(minute),
    })
  return row.insertId
}

const moderate = async (user: DbUser, visibleCreationGroups: string[]) => {
  const role = UserRole.create()
  role.createdAt = new Date()
  role.userId = user.id
  role.role = RoleNames.MODERATOR
  role.visibleCreationGroups = JSON.stringify(visibleCreationGroups)
  await role.save()
}

// the requests, the newest last
let gardenAnswered: number // bibi, garden: peter answered, a younger note of his after it
let gardenReplied: number // bibi, garden: peter answered, bibi wrote back
let choirAsked: number // bibi, choir: a question back, and a note
let closedByMember: number // bibi, no group: bibi closed it herself
let deletedByPeter: number // bibi, no group: closed by peter, then deleted by peter
let bobsOwn: number // bob, garden: bob asks, with a note of peter on it
let noAddress: number // garrick, garden: nobody wrote in it
let ofDeleted: number // stephen, no group

beforeAll(async () => {
  const testEnv = await testEnvironment(logErrorLogger)
  mutate = testEnv.mutate
  query = testEnv.query
  await cleanDB()
  bibi = await userFactoryDrizzle(bibiBloxberg)
  bob = await userFactoryDrizzle(bobBaumeister)
  raeuber = await userFactoryDrizzle(raeuberHotzenplotz)
  peter = await userFactoryDrizzle(peterLustig) // an administrator
  garrick = await userFactoryDrizzle(garrickOllivander)
  stephen = await userFactoryDrizzle(stephenHawking) // a deleted account
  await drizzleDb().update(usersTable).set({ emailId: null }).where(eq(usersTable.id, garrick.id))
  await moderate(bob, ['garden'])
  await moderate(raeuber, ['*untagged'])
  const [garden] = await drizzleDb()
    .insert(creationGroupsTable)
    .values({ tag: 'garden', name: 'Garten' })
  gardenId = garden.insertId
  const [choir] = await drizzleDb()
    .insert(creationGroupsTable)
    .values({ tag: 'choir', name: 'Chor' })
  choirId = choir.insertId

  gardenAnswered = await file(bibi.id, 'Wie giesse ich den Garten?', 1, gardenId)
  await writes(gardenAnswered, peter, 'Morgens.', 2)
  await writes(gardenAnswered, peter, 'Sie gärtnert seit Jahren.', 3, 'MODERATOR')
  gardenReplied = await file(bibi.id, 'Wo ist die Giesskanne?', 4, gardenId)
  await writes(gardenReplied, peter, 'Im Schuppen.', 5)
  await writes(gardenReplied, bibi, 'Danke, gefunden.', 6)
  choirAsked = await file(bibi.id, 'Wann probt der Chor?', 7, choirId, { status: 'IN_PROGRESS' })
  await writes(choirAsked, peter, 'Welcher Chor?', 8)
  await writes(choirAsked, peter, 'Sie singt Alt.', 9, 'MODERATOR')
  closedByMember = await file(bibi.id, 'Erledigt sich von selbst', 10, null, {
    status: 'CLOSED',
    closedAt: at(11),
    closedBy: bibi.id,
  })
  deletedByPeter = await file(bibi.id, 'Ein Versehen', 12, null, {
    status: 'DELETED',
    closedAt: at(13),
    closedBy: peter.id,
    deletedAt: at(14),
    deletedBy: peter.id,
  })
  await writes(deletedByPeter, peter, 'Doppelt?', 15)
  bobsOwn = await file(bob.id, 'Mein eigenes Konto', 16, gardenId)
  await writes(bobsOwn, bob, 'Noch eine Zeile von mir', 17)
  await writes(bobsOwn, peter, 'Bob ist Moderator im Garten.', 18, 'MODERATOR')
  noAddress = await file(garrick.id, 'Meine Adresse ist weg', 19, gardenId)
  ofDeleted = await file(stephen.id, 'A brief question', 20, null)
})

afterAll(async () => {
  await cleanDB()
  await AppDatabase.getInstance().destroy()
})

describe('SupportTicketModerationResolver', () => {
  describe('without a login', () => {
    beforeAll(() => resetToken())

    it('lists and reads nothing', async () => {
      await expect(list(ALL)).resolves.toEqual(unauthorized)
      await expect(threadOf(gardenAnswered)).resolves.toEqual(unauthorized)
    })
  })

  describe('a member without the right', () => {
    beforeAll(() => loginAs('bibi@bloxberg.de'))

    it('lists and reads nothing, also of the own request', async () => {
      await expect(list(ALL)).resolves.toEqual(unauthorized)
      await expect(threadOf(gardenAnswered)).resolves.toEqual(unauthorized)
    })
  })

  describe('an administrator', () => {
    beforeAll(() => loginAs('peter@lustig.de'))

    it('lists every request under the tab of its state, the newest first', async () => {
      expect(await idsListed(OPEN_TAB)).toEqual([
        ofDeleted,
        noAddress,
        bobsOwn,
        choirAsked,
        gardenReplied,
        gardenAnswered,
      ])
      expect(await idsListed(['CLOSED'])).toEqual([closedByMember])
      expect(await idsListed(['DELETED'])).toEqual([deletedByPeter])
      expect((await idsListed()).length).toBe(8)
    })

    it('answers a page and the count of all', async () => {
      const res = await list(ALL, 2, 3)
      expect(res.errors).toBeUndefined()
      expect(res.data.adminListSupportTickets.count).toBe(8)
      expect(res.data.adminListSupportTickets.tickets.map((t: { id: number }) => t.id)).toEqual([
        deletedByPeter,
        closedByMember,
        choirAsked,
      ])
    })

    it('lists the member with name, username and address, and the group by tag and name', async () => {
      expect(await ticketOf(gardenAnswered)).toEqual({
        id: gardenAnswered,
        userId: bibi.id,
        user: {
          id: bibi.id,
          firstName: bibi.firstName,
          lastName: bibi.lastName,
          alias: bibi.alias,
          gradidoID: bibi.gradidoId,
        },
        userEmail: 'bibi@bloxberg.de',
        text: 'Wie giesse ich den Garten?',
        status: 'OPEN',
        creationGroupTag: 'garden',
        creationGroupName: 'Garten',
        closedAt: null,
        closedBy: null,
        closedByUserName: null,
        lastMessageType: 'DIALOG',
        lastMessageByModerator: true,
      })
    })

    it('tells who had the last word in the dialog, a younger note not counted', async () => {
      expect(await ticketOf(gardenAnswered)).toMatchObject({ lastMessageByModerator: true })
      expect(await ticketOf(gardenReplied)).toMatchObject({
        lastMessageType: 'DIALOG',
        lastMessageByModerator: false,
      })
      expect(await ticketOf(noAddress)).toMatchObject({
        lastMessageType: null,
        lastMessageByModerator: null,
      })
    })

    it('names who closed a request, and for a deleted one who deleted it', async () => {
      expect(await ticketOf(closedByMember)).toMatchObject({
        status: 'CLOSED',
        closedAt: at(11).toISOString(),
        closedBy: bibi.id,
        closedByUserName: 'Bibi Bloxberg',
      })
      expect(await ticketOf(deletedByPeter)).toMatchObject({
        status: 'DELETED',
        closedAt: at(14).toISOString(),
        closedBy: peter.id,
        closedByUserName: 'Peter Lustig',
      })
    })

    it('lists the request of a member without an address in force, and the page stands', async () => {
      expect(await ticketOf(noAddress)).toMatchObject({
        userId: garrick.id,
        user: expect.objectContaining({ id: garrick.id }),
        userEmail: null,
      })
    })

    it('lists the request of a deleted member without the member', async () => {
      expect(await ticketOf(ofDeleted)).toMatchObject({ userId: stephen.id, user: null })
    })

    it('reads the whole thread, the internal notes among it, the oldest first', async () => {
      const res = await threadOf(gardenAnswered)
      expect(res.errors).toBeUndefined()
      expect(res.data.adminListSupportTicketMessages).toEqual([
        expect.objectContaining({
          message: 'Morgens.',
          type: 'DIALOG',
          isModerator: true,
          userId: peter.id,
          userAlias: peter.alias,
          userGradidoID: peter.gradidoId,
        }),
        expect.objectContaining({ message: 'Sie gärtnert seit Jahren.', type: 'MODERATOR' }),
      ])
    })

    it('reads the thread of a deleted request, and an empty one where nobody wrote', async () => {
      const deleted = await threadOf(deletedByPeter)
      expect(deleted.data.adminListSupportTicketMessages).toEqual([
        expect.objectContaining({ message: 'Doppelt?' }),
      ])
      const empty = await threadOf(noAddress)
      expect(empty.errors).toBeUndefined()
      expect(empty.data.adminListSupportTicketMessages).toEqual([])
    })

    it('answers a request that does not exist as one outside the scope', async () => {
      await expect(threadOf(ofDeleted + 1000)).resolves.toEqual(
        refusedWith('SUPPORT_TICKET_NOT_FOUND'),
      )
    })

    it('refuses a tab without a state and a page too long', async () => {
      await expect(list([])).resolves.toEqual(refusedWith('SUPPORT_TICKET_INVALID'))
      await expect(list(ALL, 1, 26)).resolves.toEqual(refusedWith('SUPPORT_TICKET_INVALID'))
    })

    // The budget is also what keeps the answer of a support request out of the trace log
    // (plugins.ts): each operation is held, not only the first.
    it('reads the list at most so many times per HTTP request', async () => {
      const aliases = Array.from(
        { length: SUPPORT_TICKET_READS_MAX_PER_REQUEST + 1 },
        (_, n) =>
          `list${n}: adminListSupportTickets(statuses: [OPEN], currentPage: 1, pageSize: 5) { count }`,
      )
      const res: any = await query({ query: gql(`query { ${aliases.join('\n')} }`) })
      expect(res.errors).toEqual([
        expect.objectContaining({ message: 'Too many support requests read at once' }),
      ])
    })

    it('reads a thread at most so many times per HTTP request', async () => {
      const aliases = Array.from(
        { length: SUPPORT_TICKET_READS_MAX_PER_REQUEST + 1 },
        (_, n) =>
          `thread${n}: adminListSupportTicketMessages(supportTicketId: ${gardenAnswered}) { id }`,
      )
      const res: any = await query({ query: gql(`query { ${aliases.join('\n')} }`) })
      expect(res.errors).toEqual([
        expect.objectContaining({ message: 'Too many support requests read at once' }),
      ])
    })
  })

  describe('a moderator of one group', () => {
    beforeAll(() => loginAs('bob@baumeister.de'))

    it('lists the requests of the group and no other, in the count as well', async () => {
      expect(await idsListed()).toEqual([noAddress, bobsOwn, gardenReplied, gardenAnswered])
      expect(await idsListed(['CLOSED'])).toEqual([])
    })

    it('reads the thread of a request of the group, notes and all', async () => {
      const res = await threadOf(gardenAnswered)
      expect(res.errors).toBeUndefined()
      expect(res.data.adminListSupportTicketMessages.map((m: any) => m.type)).toEqual([
        'DIALOG',
        'MODERATOR',
      ])
    })

    it('reads no thread outside the group, answered as for a request that does not exist', async () => {
      // both carry a dialog message and a note: the refusal is not an empty thread
      await expect(threadOf(choirAsked)).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
      await expect(threadOf(deletedByPeter)).resolves.toEqual(
        refusedWith('SUPPORT_TICKET_NOT_FOUND'),
      )
    })

    it('lists the own request like any other, but does not read its thread', async () => {
      expect(await ticketOf(bobsOwn)).toMatchObject({ userId: bob.id, text: 'Mein eigenes Konto' })
      await expect(threadOf(bobsOwn)).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
    })
  })

  describe('a moderator of the requests without a group', () => {
    beforeAll(() => loginAs('raeuber@hotzenplotz.de'))

    it('lists exactly the requests without a group', async () => {
      expect(await idsListed()).toEqual([ofDeleted, deletedByPeter, closedByMember])
      expect(await idsListed(OPEN_TAB)).toEqual([ofDeleted])
    })

    it('reads their threads and none of a group', async () => {
      const res = await threadOf(deletedByPeter)
      expect(res.errors).toBeUndefined()
      expect(res.data.adminListSupportTicketMessages).toHaveLength(1)
      await expect(threadOf(gardenAnswered)).resolves.toEqual(
        refusedWith('SUPPORT_TICKET_NOT_FOUND'),
      )
    })
  })

  describe('the log', () => {
    it('gets nothing of the words of a request or of its thread, also where a read is refused', async () => {
      clearLogs()
      await loginAs('peter@lustig.de')
      await listed()
      await threadOf(gardenAnswered)
      await list([])
      await loginAs('bob@baumeister.de')
      await threadOf(choirAsked)
      const lines: string[] = []
      const stdout = jest.spyOn(process.stdout, 'write').mockImplementation((line) => {
        lines.push(String(line))
        return true
      })
      printLogs()
      stdout.mockRestore()
      // the fixture has to prove itself: the refusals were logged
      expect(lines.join('')).toContain('SUPPORT_TICKET_NOT_FOUND')
      expect(lines.join('')).toContain('SUPPORT_TICKET_INVALID')
      for (const words of ['giesse', 'Morgens', 'gärtnert', 'probt', 'singt']) {
        expect(lines.join('')).not.toContain(words)
      }
    })
  })
})

// K3: the moderation answers, notes, closes with the tick and deletes; the count of the open tab.
// Every request here is filed for its test: the requests above stay as K2's tests read them.
describe('SupportTicketModerationResolver, acting on a request (K3)', () => {
  const adminCreateSupportTicketMessage = gql`
    mutation (
      $supportTicketId: Int!
      $message: String!
      $type: SupportTicketMessageType!
      $close: Boolean!
    ) {
      adminCreateSupportTicketMessage(
        supportTicketId: $supportTicketId
        message: $message
        type: $type
        close: $close
      ) {
        id
        message
        type
        isModerator
        userId
        userAlias
        userGradidoID
      }
    }
  `
  const adminCloseSupportTicket = gql`
    mutation ($supportTicketId: Int!) {
      adminCloseSupportTicket(supportTicketId: $supportTicketId)
    }
  `
  const adminDeleteSupportTicket = gql`
    mutation ($supportTicketId: Int!) {
      adminDeleteSupportTicket(supportTicketId: $supportTicketId)
    }
  `
  const adminCountOpenSupportTickets = gql`
    query {
      adminCountOpenSupportTickets {
        forModeration
        forMember
      }
    }
  `
  // the member's own reading of the thread (K1)
  const listSupportTicketMessages = gql`
    query ($supportTicketId: Int!) {
      listSupportTicketMessages(supportTicketId: $supportTicketId) {
        id
        message
        type
      }
    }
  `

  const write = (
    supportTicketId: number,
    message: string,
    type: SupportTicketMessageType = 'DIALOG',
    close = false,
  ): Promise<any> =>
    mutate({
      mutation: adminCreateSupportTicketMessage,
      variables: { supportTicketId, message, type, close },
    })
  const tick = (supportTicketId: number): Promise<any> =>
    mutate({ mutation: adminCloseSupportTicket, variables: { supportTicketId } })
  const remove = (supportTicketId: number): Promise<any> =>
    mutate({ mutation: adminDeleteSupportTicket, variables: { supportTicketId } })
  const counted = (): Promise<any> => query({ query: adminCountOpenSupportTickets })

  const rowOf = async (id: number) =>
    (await drizzleDb().select().from(supportTicketsTable).where(eq(supportTicketsTable.id, id)))[0]
  const messagesOf = (id: number) =>
    drizzleDb()
      .select()
      .from(supportTicketMessagesTable)
      .where(eq(supportTicketMessagesTable.supportTicketId, id))
  const mail = sendAddedSupportTicketMessageEmail as jest.Mock
  const mails = () => mail.mock.calls.map(([data]) => data)
  // a full thread of one kind, written in one statement
  const fill = (
    supportTicketId: number,
    author: DbUser,
    howMany: number,
    type: SupportTicketMessageType,
  ) =>
    drizzleDb()
      .insert(supportTicketMessagesTable)
      .values(
        Array.from({ length: howMany }, (_, n) => ({
          supportTicketId,
          userId: author.id,
          message: `${type} ${n}`,
          type,
          isModerator: author.id === peter.id,
          createdAt: at(100 + n),
        })),
      )

  // nothing is written where nothing may be: the row as it was, no message in its thread
  const untouched = async (id: number, status: SupportTicketStatus) => {
    expect(await rowOf(id)).toMatchObject({ status, deletedAt: null })
    expect(await messagesOf(id)).toEqual([])
  }

  beforeEach(() => {
    mail.mockClear()
  })

  describe('without a login', () => {
    beforeAll(() => resetToken())

    it('answers, notes, closes, deletes and counts nothing', async () => {
      const id = await file(bibi.id, 'Hilfe ohne Anmeldung', 30, gardenId)
      await expect(write(id, 'Antwort')).resolves.toEqual(unauthorized)
      await expect(write(id, 'Notiz', 'MODERATOR')).resolves.toEqual(unauthorized)
      await expect(tick(id)).resolves.toEqual(unauthorized)
      await expect(remove(id)).resolves.toEqual(unauthorized)
      await expect(counted()).resolves.toEqual(unauthorized)
      await untouched(id, 'OPEN')
    })
  })

  describe('a member without the right', () => {
    beforeAll(() => loginAs('bibi@bloxberg.de'))

    it('answers, notes, closes, deletes and counts nothing, also in the own request', async () => {
      const id = await file(bibi.id, 'Meine eigene Anfrage', 31, gardenId)
      await expect(write(id, 'Antwort')).resolves.toEqual(unauthorized)
      await expect(write(id, 'Notiz', 'MODERATOR')).resolves.toEqual(unauthorized)
      await expect(tick(id)).resolves.toEqual(unauthorized)
      await expect(remove(id)).resolves.toEqual(unauthorized)
      await expect(counted()).resolves.toEqual(unauthorized)
      await untouched(id, 'OPEN')
    })
  })

  describe('an administrator', () => {
    beforeAll(() => loginAs('peter@lustig.de'))

    it('answers: the answer in the thread, a question back to the member, and a mail to the member', async () => {
      const id = await file(bibi.id, 'Wie schöpfe ich?', 32, gardenId)
      const res = await write(id, '  Am **Handy** oben rechts.  ')
      expect(res.errors).toBeUndefined()
      expect(res.data.adminCreateSupportTicketMessage).toMatchObject({
        message: 'Am **Handy** oben rechts.',
        type: 'DIALOG',
        isModerator: true,
        userId: peter.id,
        userGradidoID: peter.gradidoId,
      })
      expect(await rowOf(id)).toMatchObject({
        status: 'IN_PROGRESS',
        closedAt: null,
        closedBy: null,
      })
      expect(await messagesOf(id)).toEqual([
        expect.objectContaining({
          id: res.data.adminCreateSupportTicketMessage.id,
          userId: peter.id,
          message: 'Am **Handy** oben rechts.',
          type: 'DIALOG',
          isModerator: true,
        }),
      ])
      expect(mails()).toEqual([
        expect.objectContaining({
          email: 'bibi@bloxberg.de',
          firstName: 'Bibi',
          language: bibi.language,
          moderatorAlias: peter.alias || null,
          supportTicketNumber: id,
          message: 'Am **Handy** oben rechts.',
          closed: false,
        }),
      ])
    })

    it('answers and closes: closed by the moderator at the moment of the answer, mailed with it', async () => {
      const id = await file(bibi.id, 'Kann ich das so machen?', 33, gardenId)
      const res = await write(id, 'Ja, genau so.', 'DIALOG', true)
      expect(res.errors).toBeUndefined()
      const row = await rowOf(id)
      expect(row).toMatchObject({ status: 'CLOSED', closedBy: peter.id })
      expect(row.closedAt).toEqual((await messagesOf(id))[0].createdAt)
      expect(mails()).toEqual([expect.objectContaining({ supportTicketNumber: id, closed: true })])
    })

    it('writes a note that changes nothing of the request and mails nobody', async () => {
      // the member closed it just before
      const id = await file(bibi.id, 'Erledigt, danke', 34, gardenId, {
        status: 'CLOSED',
        closedAt: at(35),
        closedBy: bibi.id,
      })
      const res = await write(id, 'Intern: hat sich selbst geholfen.', 'MODERATOR')
      expect(res.errors).toBeUndefined()
      expect(res.data.adminCreateSupportTicketMessage).toMatchObject({
        type: 'MODERATOR',
        isModerator: true,
      })
      expect(await rowOf(id)).toMatchObject({
        status: 'CLOSED',
        closedAt: at(35),
        closedBy: bibi.id,
      })
      expect(await messagesOf(id)).toEqual([
        expect.objectContaining({ type: 'MODERATOR', isModerator: true }),
      ])
      expect(mail).not.toHaveBeenCalled()
    })

    it('opens a closed request again as a question back with an answer, also one the member closed', async () => {
      const id = await file(bibi.id, 'Noch eine Frage dazu', 36, gardenId, {
        status: 'CLOSED',
        closedAt: at(37),
        closedBy: bibi.id,
      })
      expect((await write(id, 'Gern, was denn?')).errors).toBeUndefined()
      expect(await rowOf(id)).toMatchObject({
        status: 'IN_PROGRESS',
        closedAt: null,
        closedBy: null,
      })
    })

    it('refuses a note that would close, words too long and none, with nothing written', async () => {
      const id = await file(bibi.id, 'Bitte hilf mir', 38, gardenId)
      await expect(write(id, 'Intern', 'MODERATOR', true)).resolves.toEqual(
        refusedWith('SUPPORT_TICKET_INVALID'),
      )
      await expect(write(id, 'a'.repeat(MESSAGE_MAX_CHARS + 1))).resolves.toEqual(
        refusedWith('SUPPORT_TICKET_INVALID'),
      )
      await expect(write(id, '   ')).resolves.toEqual(refusedWith('SUPPORT_TICKET_INVALID'))
      // the bound itself is taken, counted by characters: an emoji is one
      expect((await write(id, '😊'.repeat(MESSAGE_MAX_CHARS))).errors).toBeUndefined()
      expect(await messagesOf(id)).toHaveLength(1)
    })

    it('writes nothing into a deleted request, also where its thread is full', async () => {
      const id = await file(bibi.id, 'Gelöscht', 39, gardenId, {
        status: 'DELETED',
        deletedAt: at(40),
        deletedBy: peter.id,
      })
      await fill(id, bibi, SUPPORT_TICKET_MESSAGES_MAX, 'DIALOG')
      for (const attempt of [
        () => write(id, 'Antwort'),
        () => write(id, 'Antwort und Schluss', 'DIALOG', true),
        () => write(id, 'Notiz', 'MODERATOR'),
        () => tick(id),
        () => remove(id),
      ]) {
        await expect(attempt()).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
      }
      expect(await rowOf(id)).toMatchObject({ status: 'DELETED', deletedAt: at(40) })
      expect(await messagesOf(id)).toHaveLength(SUPPORT_TICKET_MESSAGES_MAX)
      expect(mail).not.toHaveBeenCalled()
    })

    it('takes the last message the dialog holds and refuses the next; the notes count on their own', async () => {
      const id = await file(bibi.id, 'Ein langes Gespräch', 41, gardenId)
      await fill(id, bibi, SUPPORT_TICKET_MESSAGES_MAX - 1, 'DIALOG')
      expect((await write(id, 'Die letzte Antwort')).errors).toBeUndefined()
      await expect(write(id, 'Eine zu viel')).resolves.toEqual(
        refusedWith('SUPPORT_TICKET_MESSAGES_REACHED'),
      )
      // a full dialog takes notes still, up to as many
      await fill(id, peter, SUPPORT_TICKET_MESSAGES_MAX - 1, 'MODERATOR')
      expect((await write(id, 'Die letzte Notiz', 'MODERATOR')).errors).toBeUndefined()
      await expect(write(id, 'Eine Notiz zu viel', 'MODERATOR')).resolves.toEqual(
        refusedWith('SUPPORT_TICKET_MESSAGES_REACHED'),
      )
      expect(await messagesOf(id)).toHaveLength(2 * SUPPORT_TICKET_MESSAGES_MAX)
    })

    it('closes with the tick: closed by the moderator, no message, no mail -- an open one and a question back, no other', async () => {
      const open = await file(bibi.id, 'Hat sich erledigt', 42, gardenId)
      const asked = await file(bibi.id, 'Rückfrage offen', 43, gardenId, { status: 'IN_PROGRESS' })
      const closed = await file(bibi.id, 'Schon geschlossen', 44, gardenId, {
        status: 'CLOSED',
        closedAt: at(45),
        closedBy: bibi.id,
      })
      for (const id of [open, asked]) {
        expect(await tick(id)).toEqual(
          expect.objectContaining({ data: { adminCloseSupportTicket: true } }),
        )
        expect(await rowOf(id)).toMatchObject({ status: 'CLOSED', closedBy: peter.id })
        expect(await messagesOf(id)).toEqual([])
      }
      await expect(tick(closed)).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
      expect(await rowOf(closed)).toMatchObject({ closedAt: at(45), closedBy: bibi.id })
      expect(mail).not.toHaveBeenCalled()
    })

    it('deletes: deleted by the moderator, no message, no mail -- an open one and a question back, no other', async () => {
      const open = await file(bibi.id, 'Spam', 46, gardenId)
      const asked = await file(bibi.id, 'Doppelt gefragt', 47, gardenId, { status: 'IN_PROGRESS' })
      const closed = await file(bibi.id, 'Geschlossen', 48, gardenId, {
        status: 'CLOSED',
        closedAt: at(49),
        closedBy: bibi.id,
      })
      for (const id of [open, asked]) {
        expect(await remove(id)).toEqual(
          expect.objectContaining({ data: { adminDeleteSupportTicket: true } }),
        )
        expect(await rowOf(id)).toMatchObject({ status: 'DELETED', deletedBy: peter.id })
        expect((await rowOf(id)).deletedAt).not.toBeNull()
        expect(await messagesOf(id)).toEqual([])
      }
      await expect(remove(closed)).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
      expect(await rowOf(closed)).toMatchObject({ status: 'CLOSED', deletedAt: null })
      expect(mail).not.toHaveBeenCalled()
    })

    it('answers a request that does not exist as one outside the scope', async () => {
      const missing = 9999999
      await expect(write(missing, 'Antwort')).resolves.toEqual(
        refusedWith('SUPPORT_TICKET_NOT_FOUND'),
      )
      await expect(tick(missing)).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
      await expect(remove(missing)).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
    })

    it('mails no address that is not confirmed, nobody without an address in force, and no deleted member', async () => {
      const unconfirmed = await file(raeuber.id, 'Meine Adresse ist neu', 50, null)
      const withoutAddress = await file(garrick.id, 'Ohne Adresse', 51, gardenId)
      const ofTheDeleted = await file(stephen.id, 'Ein gelöschtes Konto', 52, null)
      const confirmedAgain = () =>
        drizzleDb()
          .update(userContactsTable)
          .set({ emailChecked: true })
          .where(eq(userContactsTable.userId, raeuber.id))
      await drizzleDb()
        .update(userContactsTable)
        .set({ emailChecked: false })
        .where(eq(userContactsTable.userId, raeuber.id))
      try {
        for (const id of [unconfirmed, withoutAddress, ofTheDeleted]) {
          expect((await write(id, 'Antwort')).errors).toBeUndefined()
          expect(await rowOf(id)).toMatchObject({ status: 'IN_PROGRESS' })
        }
        expect(mail).not.toHaveBeenCalled()
      } finally {
        await confirmedAgain()
      }
    })

    it('answers alike where the mail fails: the answer stands, and is not reported as failed', async () => {
      const id = await file(bibi.id, 'Wenn die Mail nicht geht', 53, gardenId)
      mail.mockRejectedValueOnce(new Error('the transport is down'))
      const res = await write(id, 'Die Antwort steht trotzdem.')
      expect(res.errors).toBeUndefined()
      expect(await messagesOf(id)).toHaveLength(1)
      expect(await rowOf(id)).toMatchObject({ status: 'IN_PROGRESS' })
    })

    it('counts the open tab as it lists it, both halves, the moderator own requests too', async () => {
      const res = await counted()
      expect(res.errors).toBeUndefined()
      expect(res.data.adminCountOpenSupportTickets).toEqual({
        forModeration: (await listed(['OPEN'])).count,
        forMember: (await listed(['IN_PROGRESS'])).count,
      })
      expect(res.data.adminCountOpenSupportTickets.forModeration).toBeGreaterThan(0)
      expect(res.data.adminCountOpenSupportTickets.forMember).toBeGreaterThan(0)
    })

    // Each write is a transaction or a mail: one per HTTP request, over every alias (RequestBudget).
    it.each([
      [
        'an answer',
        (id: number) =>
          `adminCreateSupportTicketMessage(supportTicketId: ${id}, message: "Antwort", type: DIALOG, close: false) { id }`,
      ],
      ['a tick', (id: number) => `adminCloseSupportTicket(supportTicketId: ${id})`],
      ['a delete', (id: number) => `adminDeleteSupportTicket(supportTicketId: ${id})`],
    ])(
      'writes %s once per HTTP request: the second is refused, nothing written twice',
      async (_kind, field) => {
        const first = await file(bibi.id, 'Erste', 54, gardenId)
        const second = await file(bibi.id, 'Zweite', 55, gardenId)
        const res: any = await mutate({
          mutation: gql(`mutation { first: ${field(first)} second: ${field(second)} }`),
        })
        expect(res.errors).toEqual([
          expect.objectContaining({ message: 'Too many support writes at once' }),
        ])
        await untouched(second, 'OPEN')
        expect(mail.mock.calls.length).toBeLessThanOrEqual(1)
      },
    )

    it('reads the count at most so many times per HTTP request', async () => {
      const aliases = Array.from(
        { length: SUPPORT_TICKET_READS_MAX_PER_REQUEST + 1 },
        (_, n) => `count${n}: adminCountOpenSupportTickets { forModeration }`,
      )
      const res: any = await query({ query: gql(`query { ${aliases.join('\n')} }`) })
      expect(res.errors).toEqual([
        expect.objectContaining({ message: 'Too many support requests read at once' }),
      ])
    })
  })

  describe('a moderator of one group', () => {
    beforeAll(() => loginAs('bob@baumeister.de'))

    it('answers, notes, closes and deletes in the group', async () => {
      const answered = await file(bibi.id, 'Im Garten', 60, gardenId)
      expect((await write(answered, 'Bob antwortet.')).errors).toBeUndefined()
      expect((await write(answered, 'Bob notiert.', 'MODERATOR')).errors).toBeUndefined()
      expect(await rowOf(answered)).toMatchObject({ status: 'IN_PROGRESS' })
      const ticked = await file(bibi.id, 'Im Garten erledigt', 61, gardenId)
      expect((await tick(ticked)).errors).toBeUndefined()
      expect(await rowOf(ticked)).toMatchObject({ status: 'CLOSED', closedBy: bob.id })
      const removed = await file(bibi.id, 'Im Garten doppelt', 62, gardenId)
      expect((await remove(removed)).errors).toBeUndefined()
      expect(await rowOf(removed)).toMatchObject({ status: 'DELETED', deletedBy: bob.id })
    })

    it('reaches nothing outside the group: every act answers as for a missing request, nothing is written', async () => {
      const inChoir = await file(bibi.id, 'Im Chor', 63, choirId)
      const ungrouped = await file(bibi.id, 'Ohne Gruppe', 64, null)
      for (const id of [inChoir, ungrouped]) {
        for (const attempt of [
          () => write(id, 'Antwort'),
          () => write(id, 'Antwort und Schluss', 'DIALOG', true),
          () => write(id, 'Notiz', 'MODERATOR'),
          () => tick(id),
          () => remove(id),
        ]) {
          await expect(attempt()).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
        }
        await untouched(id, 'OPEN')
      }
      expect(mail).not.toHaveBeenCalled()
    })

    it('acts on nothing of the own request, also where it stands in the group', async () => {
      const own = await file(bob.id, 'Meine eigene Frage', 65, gardenId)
      for (const attempt of [
        () => write(own, 'Ich antworte mir selbst'),
        () => write(own, 'Ich notiere mir selbst', 'MODERATOR'),
        () => tick(own),
        () => remove(own),
      ]) {
        await expect(attempt()).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
      }
      await untouched(own, 'OPEN')
    })

    it('counts the open tab of the group only, as the tab lists it', async () => {
      const res = await counted()
      expect(res.errors).toBeUndefined()
      expect(res.data.adminCountOpenSupportTickets).toEqual({
        forModeration: (await listed(['OPEN'])).count,
        forMember: (await listed(['IN_PROGRESS'])).count,
      })
      // the choir's open request of the test before is not counted here
      await loginAs('peter@lustig.de')
      const all = (await counted()).data.adminCountOpenSupportTickets
      expect(all.forModeration).toBeGreaterThan(res.data.adminCountOpenSupportTickets.forModeration)
      await loginAs('bob@baumeister.de')
    })
  })

  describe('the member', () => {
    it('reads the answer and none of the notes, through the own operations', async () => {
      await loginAs('peter@lustig.de')
      const id = await file(bibi.id, 'Was sieht das Mitglied?', 70, gardenId)
      expect((await write(id, 'Die Antwort an Dich.')).errors).toBeUndefined()
      expect((await write(id, 'Nur für die Moderation.', 'MODERATOR')).errors).toBeUndefined()
      // both stand in the thread: what the member does not read, is there
      const stored = await messagesOf(id)
      expect(stored).toHaveLength(2)
      expect(stored).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Die Antwort an Dich.', type: 'DIALOG' }),
          expect.objectContaining({ message: 'Nur für die Moderation.', type: 'MODERATOR' }),
        ]),
      )
      await loginAs('bibi@bloxberg.de')
      const res: any = await query({
        query: listSupportTicketMessages,
        variables: { supportTicketId: id },
      })
      expect(res.errors).toBeUndefined()
      expect(res.data.listSupportTicketMessages).toEqual([
        expect.objectContaining({ message: 'Die Antwort an Dich.', type: 'DIALOG' }),
      ])
    })
  })

  describe('the log', () => {
    it('gets nothing of the words of an answer or a note, also where one is refused', async () => {
      await loginAs('peter@lustig.de')
      const id = await file(bibi.id, 'Wörter im Protokoll?', 71, gardenId)
      clearLogs()
      await write(id, 'Sonnenblumenkerne')
      await write(id, 'Kompostwürmer', 'MODERATOR')
      await write(id, 'Regentonne', 'MODERATOR', true)
      await write(id, 'x'.repeat(MESSAGE_MAX_CHARS) + 'Gartenzwerg')
      await loginAs('bob@baumeister.de')
      const inChoir = await file(bibi.id, 'Chorprobe', 72, choirId)
      await write(inChoir, 'Notenständer')
      const lines: string[] = []
      const stdout = jest.spyOn(process.stdout, 'write').mockImplementation((line) => {
        lines.push(String(line))
        return true
      })
      printLogs()
      stdout.mockRestore()
      // the fixture has to prove itself: the refusals were logged
      expect(lines.join('')).toContain('SUPPORT_TICKET_NOT_FOUND')
      expect(lines.join('')).toContain('SUPPORT_TICKET_INVALID')
      for (const words of [
        'Sonnenblumen',
        'Kompost',
        'Regentonne',
        'Gartenzwerg',
        'Notenständer',
      ]) {
        expect([words, lines.join('').includes(words)]).toEqual([words, false])
      }
    })
  })
})

// K4: the search and the group filter of the list, beside the scope and never in its place.
// Every request here is filed for this block, with a word no request above has.
describe('SupportTicketModerationResolver, the search and the group filter (K4)', () => {
  const adminListSupportTicketsFiltered = gql`
    query (
      $statuses: [SupportTicketStatus!]!
      $currentPage: Int!
      $pageSize: Int!
      $query: String!
      $creationGroup: String!
    ) {
      adminListSupportTickets(
        statuses: $statuses
        currentPage: $currentPage
        pageSize: $pageSize
        query: $query
        creationGroup: $creationGroup
      ) {
        count
        tickets {
          id
        }
      }
    }
  `
  const search = (words: string, creationGroup = '', pageSize = 25): Promise<any> =>
    query({
      query: adminListSupportTicketsFiltered,
      variables: { statuses: ALL, currentPage: 1, pageSize, query: words, creationGroup },
    })
  // the ids found, the count agreeing with them
  const found = async (words: string, creationGroup = ''): Promise<number[]> => {
    const res = await search(words, creationGroup)
    expect(res.errors).toBeUndefined()
    const { count, tickets } = res.data.adminListSupportTickets
    expect(count).toBe(tickets.length)
    return tickets.map((ticket: { id: number }) => ticket.id)
  }
  let carla: DbUser
  let inGarden: number
  let inChoir: number
  let ungrouped: number
  let peters: number

  beforeAll(async () => {
    // a moderator of a group and of the requests without one
    carla = await userFactoryDrizzle({
      email: 'carla@sonne.de',
      firstName: 'Carla',
      lastName: 'Sonne',
      alias: 'CarlaS',
      emailChecked: true,
      language: 'de',
    })
    await moderate(carla, ['choir', '*untagged'])
    inGarden = await file(bibi.id, 'Das Hochbeet im Garten', 200, gardenId)
    inChoir = await file(bibi.id, 'Ein Hochbeet für den Chor', 201, choirId)
    ungrouped = await file(bibi.id, 'Ein Hochbeet ohne Gruppe', 202, null)
    peters = await file(peter.id, 'Mein Hochbeet', 203, gardenId)
  })

  it('finds a request by its words, its member and its number, each word somewhere in it', async () => {
    await loginAs('peter@lustig.de')
    expect(await found('hochbeet chor')).toEqual([inChoir])
    expect(await found('Bloxberg Hochbeet')).toEqual([ungrouped, inChoir, inGarden])
    expect(await found('Hochbeet Bloxberg')).toEqual([ungrouped, inChoir, inGarden])
    expect(await found('lustig.de hochbeet')).toEqual([peters])
    expect(await found(String(inChoir))).toEqual([inChoir])
    // blanks only: no search -- all the requests, more than one page by now
    const all = await search('   ')
    expect(all.errors).toBeUndefined()
    expect(all.data.adminListSupportTickets.count).toBeGreaterThan(4)
  })

  it('narrows to some group, to none and to the group of a tag', async () => {
    await loginAs('peter@lustig.de')
    expect(await found('Hochbeet', '*grouped')).toEqual([peters, inChoir, inGarden])
    expect(await found('Hochbeet', '*untagged')).toEqual([ungrouped])
    expect(await found('Hochbeet', 'garden')).toEqual([peters, inGarden])
    expect(await found('Hochbeet', 'nobody-moderates-this')).toEqual([])
  })

  // Each role with each value of the filter: what it finds lies in its scope, the count agrees,
  // and the empty value -- the first one of the page for every role -- finds all it reaches.
  it.each([
    ['an administrator', 'peter@lustig.de', () => [peters, ungrouped, inChoir, inGarden]],
    ['a moderator of one group', 'bob@baumeister.de', () => [peters, inGarden]],
    ['a moderator of the requests without a group', 'raeuber@hotzenplotz.de', () => [ungrouped]],
    ['a moderator of a group and of those without', 'carla@sonne.de', () => [ungrouped, inChoir]],
  ])('%s finds nothing outside the scope, with any filter', async (_role, email, reaches) => {
    await loginAs(email)
    const of: Record<string, number[]> = {
      '': [peters, ungrouped, inChoir, inGarden],
      '*grouped': [peters, inChoir, inGarden],
      '*untagged': [ungrouped],
      garden: [peters, inGarden],
      choir: [inChoir],
      'nobody-moderates-this': [],
    }
    for (const [creationGroup, inFilter] of Object.entries(of)) {
      const expected = inFilter.filter((id) => reaches().includes(id))
      expect([creationGroup, await found('Hochbeet', creationGroup)]).toEqual([
        creationGroup,
        expected,
      ])
    }
    expect(await found('Hochbeet')).toEqual(reaches())
  })

  it('gets nothing of the search in the log, also where the list is refused', async () => {
    await loginAs('bob@baumeister.de')
    clearLogs()
    await search('Kartoffelacker', 'choir')
    await search('Rhabarberbeet', '', 26)
    const lines: string[] = []
    const stdout = jest.spyOn(process.stdout, 'write').mockImplementation((line) => {
      lines.push(String(line))
      return true
    })
    printLogs()
    stdout.mockRestore()
    // the fixture has to prove itself: the refusal was logged
    expect(lines.join('')).toContain('SUPPORT_TICKET_INVALID')
    expect(lines.join('')).not.toContain('Kartoffelacker')
    expect(lines.join('')).not.toContain('Rhabarberbeet')
  })
})

// K4: the resubmission -- set with an answer or a note, hidden from the open tab while it waits,
// counted apart, and taken away by every word or act that ends the waiting.
describe('SupportTicketModerationResolver, the resubmission (K4)', () => {
  const adminCreateSupportTicketMessage = gql`
    mutation (
      $supportTicketId: Int!
      $message: String!
      $type: SupportTicketMessageType!
      $close: Boolean!
      $resubmissionAt: String
    ) {
      adminCreateSupportTicketMessage(
        supportTicketId: $supportTicketId
        message: $message
        type: $type
        close: $close
        resubmissionAt: $resubmissionAt
      ) {
        id
      }
    }
  `
  const adminListHidden = gql`
    query ($hideResubmission: Boolean!, $query: String!) {
      adminListSupportTickets(
        statuses: [OPEN, IN_PROGRESS]
        currentPage: 1
        pageSize: 25
        query: $query
        hideResubmission: $hideResubmission
      ) {
        count
        tickets {
          id
          resubmissionAt
        }
      }
    }
  `
  const adminCountOpenSupportTickets = gql`
    query {
      adminCountOpenSupportTickets {
        forModeration
        forMember
        onResubmission
      }
    }
  `
  const adminCloseSupportTicket = gql`
    mutation ($supportTicketId: Int!) {
      adminCloseSupportTicket(supportTicketId: $supportTicketId)
    }
  `
  const adminDeleteSupportTicket = gql`
    mutation ($supportTicketId: Int!) {
      adminDeleteSupportTicket(supportTicketId: $supportTicketId)
    }
  `
  // the member's own operations (K1)
  const createSupportTicketMessage = gql`
    mutation ($supportTicketId: Int!, $message: String!) {
      createSupportTicketMessage(supportTicketId: $supportTicketId, message: $message) {
        id
      }
    }
  `
  const closeSupportTicket = gql`
    mutation ($supportTicketId: Int!) {
      closeSupportTicket(supportTicketId: $supportTicketId)
    }
  `
  // a week ahead of whenever the test runs: a resubmission still to come
  const LATER = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  LATER.setMilliseconds(0)
  // `undefined`: the form's box untouched -- the argument is not sent at all
  const write = (
    supportTicketId: number,
    resubmissionAt: string | null | undefined,
    type: SupportTicketMessageType = 'DIALOG',
    close = false,
  ): Promise<any> =>
    mutate({
      mutation: adminCreateSupportTicketMessage,
      variables: {
        supportTicketId,
        message: 'Ich melde mich.',
        type,
        close,
        ...(resubmissionAt === undefined ? {} : { resubmissionAt }),
      },
    })
  const rowOf = async (id: number) =>
    (await drizzleDb().select().from(supportTicketsTable).where(eq(supportTicketsTable.id, id)))[0]
  const hidden = (hideResubmission: boolean, words: string): Promise<any> =>
    query({ query: adminListHidden, variables: { hideResubmission, query: words } })
  const listed = async (hideResubmission: boolean, words: string): Promise<number[]> => {
    const res = await hidden(hideResubmission, words)
    expect(res.errors).toBeUndefined()
    const { count, tickets } = res.data.adminListSupportTickets
    expect(count).toBe(tickets.length)
    return tickets.map((ticket: { id: number }) => ticket.id)
  }
  const counted = async () => {
    const res: any = await query({ query: adminCountOpenSupportTickets })
    expect(res.errors).toBeUndefined()
    return res.data.adminCountOpenSupportTickets
  }

  beforeAll(() => loginAs('peter@lustig.de'))

  it('sets a resubmission with an answer, and hides and counts the request apart while it waits', async () => {
    const id = await file(bibi.id, 'Rosenschnitt im Frühjahr', 300, gardenId)
    const before = await counted()
    expect(await listed(true, 'Rosenschnitt')).toEqual([id])

    const res = await write(id, LATER.toISOString())
    expect(res.errors).toBeUndefined()
    expect(await rowOf(id)).toMatchObject({ status: 'IN_PROGRESS', resubmissionAt: LATER })
    expect(await listed(true, 'Rosenschnitt')).toEqual([])
    expect(await listed(false, 'Rosenschnitt')).toEqual([id])
    expect(await counted()).toEqual({
      ...before,
      forModeration: before.forModeration - 1,
      onResubmission: before.onResubmission + 1,
    })
    // and the row tells it
    const shown = await hidden(false, 'Rosenschnitt')
    expect(new Date(shown.data.adminListSupportTickets.tickets[0].resubmissionAt)).toEqual(LATER)
  })

  it('sets, keeps and takes away a resubmission with a note, as the box stands', async () => {
    const id = await file(bibi.id, 'Kompostkiste', 301, gardenId)
    expect((await write(id, LATER.toISOString(), 'MODERATOR')).errors).toBeUndefined()
    expect(await rowOf(id)).toMatchObject({ status: 'OPEN', resubmissionAt: LATER })
    expect((await write(id, null, 'MODERATOR')).errors).toBeUndefined()
    expect(await rowOf(id)).toMatchObject({ status: 'OPEN', resubmissionAt: null })
  })

  it('keeps the resubmission where the box was not touched: that of a colleague stays, and none comes back that the member took away', async () => {
    const id = await file(bibi.id, 'Hochbeet', 310, gardenId)
    expect((await write(id, LATER.toISOString(), 'MODERATOR')).errors).toBeUndefined()
    // another note, its box untouched
    expect((await write(id, undefined, 'MODERATOR')).errors).toBeUndefined()
    expect(await rowOf(id)).toMatchObject({ status: 'OPEN', resubmissionAt: LATER })
    // the member writes "dringend": the resubmission is gone, and a note or an answer whose box was
    // not touched does not put it back
    await loginAs('bibi@bloxberg.de')
    expect(
      (
        await mutate({
          mutation: createSupportTicketMessage,
          variables: { supportTicketId: id, message: 'Dringend, bitte!' },
        })
      ).errors,
    ).toBeUndefined()
    await loginAs('peter@lustig.de')
    expect((await write(id, undefined, 'MODERATOR')).errors).toBeUndefined()
    expect(await rowOf(id)).toMatchObject({ status: 'OPEN', resubmissionAt: null })
    expect((await write(id, undefined)).errors).toBeUndefined()
    expect(await rowOf(id)).toMatchObject({ status: 'IN_PROGRESS', resubmissionAt: null })
  })

  it('refuses an answer that closes and waits, and a moment that is none, with nothing written', async () => {
    const id = await file(bibi.id, 'Bewässerung', 302, gardenId)
    await expect(write(id, LATER.toISOString(), 'DIALOG', true)).resolves.toEqual(
      refusedWith('SUPPORT_TICKET_INVALID'),
    )
    await expect(write(id, '2026-02-30T08:00:00.000Z')).resolves.toEqual(
      refusedWith('SUPPORT_TICKET_INVALID'),
    )
    await expect(write(id, 'nächste Woche')).resolves.toEqual(refusedWith('SUPPORT_TICKET_INVALID'))
    expect(await rowOf(id)).toMatchObject({ status: 'OPEN', resubmissionAt: null })
    expect(
      await drizzleDb()
        .select()
        .from(supportTicketMessagesTable)
        .where(eq(supportTicketMessagesTable.supportTicketId, id)),
    ).toEqual([])
  })

  it('writes a note with a resubmission into an open request only; one without into a closed one too', async () => {
    const id = await file(bibi.id, 'Saatgut', 303, gardenId, {
      status: 'CLOSED',
      closedAt: at(304),
      closedBy: bibi.id,
    })
    await expect(write(id, LATER.toISOString(), 'MODERATOR')).resolves.toEqual(
      refusedWith('SUPPORT_TICKET_NOT_FOUND'),
    )
    expect(await rowOf(id)).toMatchObject({ status: 'CLOSED', resubmissionAt: null })
    expect((await write(id, null, 'MODERATOR')).errors).toBeUndefined()
    // an answer with one opens it again, as a question back that waits
    expect((await write(id, LATER.toISOString())).errors).toBeUndefined()
    expect(await rowOf(id)).toMatchObject({ status: 'IN_PROGRESS', resubmissionAt: LATER })
  })

  it('takes the resubmission away with the tick, with deleting and with an answer that closes', async () => {
    const ticked = await file(bibi.id, 'Haken', 305, gardenId, { resubmissionAt: LATER })
    const removed = await file(bibi.id, 'Weg damit', 306, gardenId, { resubmissionAt: LATER })
    const answered = await file(bibi.id, 'Erledigt', 307, gardenId, { resubmissionAt: LATER })
    expect(
      (await mutate({ mutation: adminCloseSupportTicket, variables: { supportTicketId: ticked } }))
        .errors,
    ).toBeUndefined()
    expect(
      (
        await mutate({
          mutation: adminDeleteSupportTicket,
          variables: { supportTicketId: removed },
        })
      ).errors,
    ).toBeUndefined()
    expect((await write(answered, null, 'DIALOG', true)).errors).toBeUndefined()
    expect(await rowOf(ticked)).toMatchObject({ status: 'CLOSED', resubmissionAt: null })
    expect(await rowOf(removed)).toMatchObject({ status: 'DELETED', resubmissionAt: null })
    expect(await rowOf(answered)).toMatchObject({ status: 'CLOSED', resubmissionAt: null })
  })

  it('takes it away where the member writes, and where the member closes', async () => {
    const written = await file(bibi.id, 'Ich schreibe noch', 308, gardenId, {
      status: 'IN_PROGRESS',
      resubmissionAt: LATER,
    })
    const closed = await file(bibi.id, 'Ich schliesse', 309, gardenId, {
      status: 'IN_PROGRESS',
      resubmissionAt: LATER,
    })
    await loginAs('bibi@bloxberg.de')
    expect(
      (
        await mutate({
          mutation: createSupportTicketMessage,
          variables: { supportTicketId: written, message: 'Noch eine Frage' },
        })
      ).errors,
    ).toBeUndefined()
    expect(
      (await mutate({ mutation: closeSupportTicket, variables: { supportTicketId: closed } }))
        .errors,
    ).toBeUndefined()
    await loginAs('peter@lustig.de')
    expect(await rowOf(written)).toMatchObject({ status: 'OPEN', resubmissionAt: null })
    expect(await rowOf(closed)).toMatchObject({ status: 'CLOSED', resubmissionAt: null })
  })
})

// K4: handing a request on to another group, or to none, with the line it leaves in the thread
describe('SupportTicketModerationResolver, handing on (K4)', () => {
  const adminReassignSupportTicket = gql`
    mutation ($supportTicketId: Int!, $creationGroupTag: String!) {
      adminReassignSupportTicket(
        supportTicketId: $supportTicketId
        creationGroupTag: $creationGroupTag
      )
    }
  `
  const adminCreateSupportTicketMessage = gql`
    mutation (
      $supportTicketId: Int!
      $message: String!
      $type: SupportTicketMessageType!
      $close: Boolean!
    ) {
      adminCreateSupportTicketMessage(
        supportTicketId: $supportTicketId
        message: $message
        type: $type
        close: $close
      ) {
        id
      }
    }
  `
  // the member's own reading of the thread (K1)
  const listSupportTicketMessages = gql`
    query ($supportTicketId: Int!) {
      listSupportTicketMessages(supportTicketId: $supportTicketId) {
        message
        type
        userAlias
      }
    }
  `
  const handOn = (supportTicketId: number, creationGroupTag: string): Promise<any> =>
    mutate({
      mutation: adminReassignSupportTicket,
      variables: { supportTicketId, creationGroupTag },
    })
  const rowOf = async (id: number) =>
    (await drizzleDb().select().from(supportTicketsTable).where(eq(supportTicketsTable.id, id)))[0]
  const linesOf = (id: number) =>
    drizzleDb()
      .select()
      .from(supportTicketMessagesTable)
      .where(eq(supportTicketMessagesTable.supportTicketId, id))
  const mail = sendAddedSupportTicketMessageEmail as jest.Mock
  const LATER = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  LATER.setMilliseconds(0)

  beforeEach(() => {
    mail.mockClear()
  })

  it('hands nothing on without a login, or without the right', async () => {
    const id = await file(bibi.id, 'Weiterreichen?', 400, gardenId)
    resetToken()
    await expect(handOn(id, '')).resolves.toEqual(unauthorized)
    await loginAs('bibi@bloxberg.de')
    await expect(handOn(id, '')).resolves.toEqual(unauthorized)
    expect((await rowOf(id)).creationGroupId).toBe(gardenId)
    expect(await linesOf(id)).toEqual([])
  })

  it('hands a request on to no group: the group, the line in the thread, the state, no resubmission, no mail', async () => {
    await loginAs('peter@lustig.de')
    const id = await file(bibi.id, 'Wer kümmert sich?', 401, gardenId, {
      status: 'IN_PROGRESS',
      resubmissionAt: LATER,
    })
    const res = await handOn(id, '')
    expect(res.errors).toBeUndefined()
    expect(res.data.adminReassignSupportTicket).toBe(true)
    expect(await rowOf(id)).toMatchObject({
      creationGroupId: null,
      status: 'IN_PROGRESS',
      resubmissionAt: null,
    })
    expect(await linesOf(id)).toEqual([
      expect.objectContaining({
        type: 'REASSIGNED',
        message: 'Garten\n',
        userId: peter.id,
        isModerator: true,
      }),
    ])
    // and back into a group, named by its name
    expect((await handOn(id, 'choir')).errors).toBeUndefined()
    expect((await rowOf(id)).creationGroupId).toBe(choirId)
    expect((await linesOf(id)).map((line) => line.message)).toEqual(['Garten\n', '\nChor'])
    expect(mail).not.toHaveBeenCalled()
  })

  it('lets a moderator hand on out of the own groups, and reach the request no more after', async () => {
    const id = await file(bibi.id, 'Eher etwas für den Chor', 402, gardenId)
    await loginAs('bob@baumeister.de')
    expect((await handOn(id, 'choir')).errors).toBeUndefined()
    expect((await rowOf(id)).creationGroupId).toBe(choirId)
    // out of reach: its thread answers as a missing one -- a list of all would be pages by now
    await expect(threadOf(id)).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
    await expect(handOn(id, 'garden')).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
    // a moderator of the requests of no group hands one into a group
    const ungrouped = await file(bibi.id, 'Ohne Gruppe', 403, null)
    await loginAs('raeuber@hotzenplotz.de')
    expect((await handOn(ungrouped, 'garden')).errors).toBeUndefined()
    expect((await rowOf(ungrouped)).creationGroupId).toBe(gardenId)
  })

  it('hands on no closed, deleted, own or unreachable request, and none that does not exist', async () => {
    const closed = await file(bibi.id, 'zu', 404, gardenId, {
      status: 'CLOSED',
      closedAt: at(405),
      closedBy: bibi.id,
    })
    const deleted = await file(bibi.id, 'weg', 406, gardenId, {
      status: 'DELETED',
      deletedAt: at(407),
      deletedBy: peter.id,
    })
    const bobs = await file(bob.id, 'meine eigene', 408, gardenId)
    const inChoir = await file(bibi.id, 'im Chor', 409, choirId)
    await loginAs('bob@baumeister.de')
    for (const id of [closed, deleted, bobs, inChoir, inChoir + 1000]) {
      await expect(handOn(id, '')).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
    }
    // whatever the tag: a group that does not exist, or the one it stands in
    for (const id of [closed, deleted]) {
      for (const tag of ['nobody-moderates-this', 'garden']) {
        await expect(handOn(id, tag)).resolves.toEqual(refusedWith('SUPPORT_TICKET_NOT_FOUND'))
      }
    }
    for (const [id, group] of [
      [closed, gardenId],
      [deleted, gardenId],
      [bobs, gardenId],
      [inChoir, choirId],
    ]) {
      expect((await rowOf(id)).creationGroupId).toBe(group)
      expect(await linesOf(id)).toEqual([])
    }
  })

  it('refuses a group that does not exist, and the group the request is in', async () => {
    await loginAs('peter@lustig.de')
    const id = await file(bibi.id, 'Wohin?', 410, gardenId)
    await expect(handOn(id, 'nobody-moderates-this')).resolves.toEqual(
      refusedWith('SUPPORT_TICKET_UNKNOWN_GROUP'),
    )
    await expect(handOn(id, 'garden')).resolves.toEqual(refusedWith('SUPPORT_TICKET_INVALID'))
    expect((await rowOf(id)).creationGroupId).toBe(gardenId)
    expect(await linesOf(id)).toEqual([])
  })

  it('hands a request on at most so many times', async () => {
    await loginAs('peter@lustig.de')
    const id = await file(bibi.id, 'Hin und her', 411, gardenId)
    await drizzleDb()
      .insert(supportTicketMessagesTable)
      .values(
        Array.from({ length: SUPPORT_TICKET_MESSAGES_MAX }, (_, n) => ({
          supportTicketId: id,
          userId: peter.id,
          message: `Garten ${n}\n`,
          type: 'REASSIGNED' as const,
          isModerator: true,
          createdAt: at(412),
        })),
      )
    await expect(handOn(id, '')).resolves.toEqual(refusedWith('SUPPORT_TICKET_MESSAGES_REACHED'))
    expect((await rowOf(id)).creationGroupId).toBe(gardenId)
  })

  it('takes no message of the kind a handing on leaves: only the server writes that line', async () => {
    await loginAs('peter@lustig.de')
    const id = await file(bibi.id, 'Ein falscher Weg', 413, gardenId)
    await expect(
      mutate({
        mutation: adminCreateSupportTicketMessage,
        variables: {
          supportTicketId: id,
          message: 'Garten\nChor',
          type: 'REASSIGNED',
          close: false,
        },
      }),
    ).resolves.toEqual(refusedWith('SUPPORT_TICKET_INVALID'))
    expect(await linesOf(id)).toEqual([])
  })

  it('hands on at most once per HTTP request', async () => {
    await loginAs('peter@lustig.de')
    const id = await file(bibi.id, 'Zweimal?', 414, gardenId)
    const res: any = await mutate({
      mutation: gql(`mutation {
        first: adminReassignSupportTicket(supportTicketId: ${id}, creationGroupTag: "")
        second: adminReassignSupportTicket(supportTicketId: ${id}, creationGroupTag: "choir")
      }`),
    })
    expect(res.errors).toEqual([
      expect.objectContaining({ message: 'Too many support writes at once' }),
    ])
    expect(await linesOf(id)).toHaveLength(1)
  })

  it('lets the member read the line, and still no note, through the own operations', async () => {
    await loginAs('peter@lustig.de')
    const id = await file(bibi.id, 'Meine Frage', 415, gardenId)
    await writes(id, peter, 'Intern: an den Chor', 416, 'MODERATOR')
    expect((await handOn(id, 'choir')).errors).toBeUndefined()
    await loginAs('bibi@bloxberg.de')
    const res: any = await query({
      query: listSupportTicketMessages,
      variables: { supportTicketId: id },
    })
    expect(res.errors).toBeUndefined()
    expect(res.data.listSupportTicketMessages).toEqual([
      { message: 'Garten\nChor', type: 'REASSIGNED', userAlias: peter.alias },
    ])
  })
})
