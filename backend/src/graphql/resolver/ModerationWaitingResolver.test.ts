// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RoleNames } from '@enum/RoleNames'
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import {
  AppDatabase,
  ContributionStatus,
  ContributionType,
  contributionCreationGroupsTable,
  contributionsTable,
  creationGroupsTable,
  DbUser,
  dbCountOpenSupportTicketsInScope,
  dbUpdateUserRoleHandledGroups,
  dbUpdateUserRoleSupportDuty,
  drizzleDb,
  SupportTicketStatus,
  supportTicketsTable,
  UserRole,
  userContactsTable,
  usersTable,
} from 'database'
import { eq } from 'drizzle-orm'
import { DocumentNode, Kind, parse } from 'graphql'
import { gql } from 'graphql-tag'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { userFactoryDrizzle } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

// The two numbers behind "Admin" in the wallet's menu ("Meine Gruppen", MG3), through the schema:
// that they are the start page's lines "n warten auf die Moderation", whose they are, and that
// they never take the chat's answer down with them. Which counts run for which role, and that a
// member costs no count, is the unit test's (ModerationWaitingResolver.unit.test.ts).

// The support's count passes through to the database and can be made to fail once.
jest.mock('database', () => {
  const original = jest.requireActual('database')
  return {
    __esModule: true,
    ...original,
    dbCountOpenSupportTicketsInScope: jest.fn(original.dbCountOpenSupportTicketsInScope),
  }
})

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let peter: DbUser
let bibi: DbUser
let raeuber: DbUser
let bob: DbUser
let groupA: number
let groupB: number

const moderationWaiting = gql`
  query {
    moderationWaiting {
      creations
      supportTickets
    }
  }
`
// the document of the chat's beat as the wallet sends it, the numbers as its fourth field
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
    countContributionsInProgress
    moderationWaiting {
      creations
      supportTickets
    }
  }
`
// the admin's start page as the admin asks for it: the operation out of its own file
const adminOperation = (file: string, name: string): DocumentNode => {
  const text = readFileSync(
    join(__dirname, '..', '..', '..', '..', 'admin', 'src', 'graphql', file),
  )
  const definitions = parse(text.toString('utf8')).definitions.filter(
    (definition) =>
      definition.kind === Kind.OPERATION_DEFINITION && definition.name?.value === name,
  )
  if (definitions.length !== 1) {
    throw new Error(`no operation ${name} in admin/src/graphql/${file}`)
  }
  return { kind: Kind.DOCUMENT, definitions }
}
const adminOpenCreationCounts = adminOperation(
  'adminListContributions.graphql',
  'adminOpenCreationCounts',
)
const adminCountOpenSupportTickets = adminOperation(
  'supportTickets.graphql',
  'adminCountOpenSupportTickets',
)

// a resubmission still to come, on a fixed day
const LATER = new Date('2099-01-01T00:00:00.000Z')

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  const { errors } = await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
  // ⛔ A failed login leaves the token empty, and an empty token is refused.
  expect(errors).toBeUndefined()
}

// bob's, as a member files them
const contribution = async (
  status: ContributionStatus,
  creationGroupId: number | null,
  resubmissionAt: Date | null = null,
): Promise<void> => {
  const [row] = await drizzleDb()
    .insert(contributionsTable)
    .values({
      userId: bob.id,
      memo: 'Ich habe im Garten geholfen',
      type: ContributionType.USER,
      status,
      contributionDate: new Date('2026-11-02T10:00:00.000Z'),
      resubmissionAt,
    })
  if (creationGroupId) {
    await drizzleDb()
      .insert(contributionCreationGroupsTable)
      .values({ contributionId: row.insertId, creationGroupId })
  }
}

const request = async (
  status: SupportTicketStatus,
  creationGroupId: number | null,
  resubmissionAt: Date | null = null,
): Promise<void> => {
  await drizzleDb().insert(supportTicketsTable).values({
    userId: bob.id,
    text: 'Wie lade ich ein Bild hoch?',
    creationGroupId,
    status,
    resubmissionAt,
  })
}

// The support's tick (K6) is written by the query that alone writes it: the entity never does.
const moderate = async (user: DbUser, visibleCreationGroups: string[], supportDuty: boolean) => {
  const row = UserRole.create()
  row.createdAt = new Date()
  row.userId = user.id
  row.role = RoleNames.MODERATOR
  row.visibleCreationGroups = JSON.stringify(visibleCreationGroups)
  await row.save()
  if (supportDuty) {
    expect(await dbUpdateUserRoleSupportDuty(user.id, true)).toEqual({ success: true })
  }
}

// "Meine Gruppen" as it stands in the row, written by hand: the same groups in both columns, unless
// the support's are given apart (MG2b)
type Choice = { groupIds: number[]; untagged: boolean; off?: boolean } | null
const choose = async (user: DbUser, creation: Choice, support: Choice = creation) =>
  expect(
    await dbUpdateUserRoleHandledGroups(user.id, {
      creation: creation ? JSON.stringify(creation) : null,
      support: support ? JSON.stringify(support) : null,
    }),
  ).toEqual({ success: true })

const waiting = async () => {
  const res: any = await query({ query: moderationWaiting })
  expect(res.errors).toBeUndefined()
  return res.data.moderationWaiting
}

// the two lines "n warten auf die Moderation" of the start page, as its two documents answer
const startPage = async () => {
  const creations: any = await query({ query: adminOpenCreationCounts })
  expect(creations.errors).toBeUndefined()
  const support: any = await query({ query: adminCountOpenSupportTickets })
  expect(support.errors).toBeUndefined()
  return {
    creations: creations.data.waitingForModeration.contributionCount,
    supportTickets: support.data.adminCountOpenSupportTickets.forModeration,
  }
}

beforeAll(async () => {
  const testEnv = await testEnvironment(getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`))
  mutate = testEnv.mutate
  query = testEnv.query
  await cleanDB()
  peter = await userFactoryDrizzle(peterLustig) // the administrator of the seeds
  bibi = await userFactoryDrizzle(bibiBloxberg)
  raeuber = await userFactoryDrizzle(raeuberHotzenplotz)
  bob = await userFactoryDrizzle(bobBaumeister) // a member without a role
  const [a] = await drizzleDb()
    .insert(creationGroupsTable)
    .values({ tag: 'waiting-a', name: 'Garten' })
  const [b] = await drizzleDb()
    .insert(creationGroupsTable)
    .values({ tag: 'waiting-b', name: 'Chor' })
  groupA = a.insertId
  groupB = b.insertId
  // a moderator of group B who handles the support, with a choice of A in the row that does
  // not count for her: her scope is her list (MG1)
  await moderate(bibi, ['waiting-b'], true)
  await choose(bibi, { groupIds: [groupA], untagged: false })
  // a moderator of every group who does not handle the support
  await moderate(raeuber, [], false)

  // waiting for the moderation: one in A, one in B, one in no group; beside them in A one with a
  // question back and one on a resubmission still to come, which wait for nobody now
  await contribution(ContributionStatus.PENDING, groupA)
  await contribution(ContributionStatus.PENDING, groupB)
  await contribution(ContributionStatus.PENDING, null)
  await contribution(ContributionStatus.IN_PROGRESS, groupA)
  await contribution(ContributionStatus.PENDING, groupA, LATER)
  await request('OPEN', groupA)
  await request('OPEN', groupB)
  await request('OPEN', null)
  await request('IN_PROGRESS', groupA)
  await request('OPEN', groupA, LATER)
})

afterAll(async () => {
  await cleanDB()
  await AppDatabase.getInstance().destroy()
})

describe('moderationWaiting', () => {
  it('is refused without a login', async () => {
    resetToken()
    const res: any = await query({ query: moderationWaiting })
    expect(res.errors?.[0].message).toBe('401 Unauthorized')
  })

  it("answers whoever moderates nothing null in the chat's beat, and never refuses a signed-in member", async () => {
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
    const ida = await userFactoryDrizzle({
      email: 'ida@projekt.de',
      firstName: 'Ida',
      lastName: 'Projekt',
      alias: 'IdaP',
      emailChecked: true,
      language: 'de',
    })
    await drizzleDb()
      .update(usersTable)
      .set({ creationAllowed: false })
      .where(eq(usersTable.id, ida.id))

    for (const email of ['bob@baumeister.de', 'garrick@ollivander.com', 'ida@projekt.de']) {
      await loginAs(email)
      const res: any = await query({ query: chatBeat })
      expect([email, res.errors]).toEqual([email, undefined])
      expect([email, res.data.moderationWaiting]).toEqual([email, null])
    }
  })

  it('counts for an administrator who chose nothing what waits for the moderation, nothing with a question back or a resubmission to come', async () => {
    await loginAs('peter@lustig.de')
    expect(await waiting()).toEqual({ creations: 3, supportTickets: 3 })
  })

  it('are the numbers of the start page, without a choice and with the choice "A and no group"', async () => {
    await loginAs('peter@lustig.de')
    expect(await waiting()).toEqual(await startPage())
    await choose(peter, { groupIds: [groupA], untagged: true })
    try {
      expect(await waiting()).toEqual({ creations: 2, supportTickets: 2 })
      expect(await waiting()).toEqual(await startPage())
    } finally {
      await choose(peter, null)
    }
  })

  // MG2b: the contributions follow the column "Schöpfung", the requests the column "Support"
  it('counts the contributions of the column "Schöpfung" and the requests of the column "Support", as the start page', async () => {
    await loginAs('peter@lustig.de')
    await choose(
      peter,
      { groupIds: [groupA], untagged: true },
      { groupIds: [groupB], untagged: false },
    )
    try {
      expect(await waiting()).toEqual({ creations: 2, supportTickets: 1 })
      expect(await waiting()).toEqual(await startPage())
    } finally {
      await choose(peter, null)
    }
  })

  // MG5: a column switched off counts nothing of its kind, the other as chosen -- as the start page
  it('counts nothing of a column that is off, the other as chosen, as the start page', async () => {
    await loginAs('peter@lustig.de')
    await choose(
      peter,
      { groupIds: [groupA], untagged: true },
      { groupIds: [groupA], untagged: true, off: true },
    )
    try {
      expect(await waiting()).toEqual({ creations: 2, supportTickets: 0 })
      expect(await waiting()).toEqual(await startPage())
    } finally {
      await choose(peter, null)
    }
    await choose(
      peter,
      { groupIds: [groupA], untagged: true, off: true },
      { groupIds: [groupA], untagged: true },
    )
    try {
      expect(await waiting()).toEqual({ creations: 0, supportTickets: 2 })
      expect(await waiting()).toEqual(await startPage())
    } finally {
      await choose(peter, null)
    }
  })

  it('counts a moderator with an assigned scope that scope, whatever choice stands in the row', async () => {
    await loginAs('bibi@bloxberg.de')
    expect(await waiting()).toEqual({ creations: 1, supportTickets: 1 })
    expect(await waiting()).toEqual(await startPage())
  })

  it('leaves the support null for a moderator without the tick, and counts the creations', async () => {
    await loginAs('raeuber@hotzenplotz.de')
    expect(await waiting()).toEqual({ creations: 3, supportTickets: null })
  })

  it("rides in the chat's beat, and a count that fails takes nothing from the chat", async () => {
    await loginAs('peter@lustig.de')
    const answered: any = await query({ query: chatBeat })
    expect(answered.errors).toBeUndefined()
    expect(answered.data.moderationWaiting).toEqual({ creations: 3, supportTickets: 3 })

    ;(dbCountOpenSupportTicketsInScope as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error('the database is gone'), { code: 'ECONNRESET' }),
    )
    const failed: any = await query({ query: chatBeat })
    expect(failed.errors).toBeUndefined()
    expect(failed.data.moderationWaiting).toBeNull()
    expect(failed.data.newChatMessagesSince).toEqual(
      expect.objectContaining({ unreadConversations: 0 }),
    )
    expect(failed.data.supportTicketsMenu).toEqual(
      expect.objectContaining({ inProgress: 0, unfinished: 0 }),
    )
    expect(failed.data.countContributionsInProgress).toBe(0)
  })
})
