// AI-GENERATED — not an architecture reference
import { RoleNames } from '@enum/RoleNames'
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { clearLogs, getLogger, printLogs } from 'config-schema/test/testSetup'
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
  usersTable,
} from 'database'
import { eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'
import { gql } from 'graphql-tag'
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

// The moderation's side of support requests (K2), through the schema: `@Authorized` and the
// request's budget live at the GraphQL layer, the scope in the database. bibi asks, peter is an
// administrator, bob moderates the garden (and asks himself), räuber the requests without a group.
// garrick has no address in force, stephen's account is deleted. The requests and their threads
// are written straight into the tables, the way the member's side (K1) and K3 write them.

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
