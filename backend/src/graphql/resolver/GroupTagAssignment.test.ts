import { RoleNames } from '@enum/RoleNames'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import {
  AppDatabase,
  Contribution as DbContribution,
  GroupTag as DbGroupTag,
  User,
  UserRole,
} from 'database'
import { getLogger as originalGetLogger } from 'log4js'
import { userFactory } from '@/seeds/factory/user'
import {
  adminCreateContribution,
  assignContributionGroupTags,
  createContribution,
  login,
} from '@/seeds/graphql/mutations'
import { adminListContributions } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

// Group functions: the group field is the ONLY thing that puts a contribution into a
// group. A "#word" in the memo is ordinary text -- it must not pull a contribution into a
// group's search results, nor into that group's moderator scope, which is a real access
// boundary. The hashtags that predate the field are adopted into real links per group from
// the admin; nothing reads the memo for a group.

jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendContributionConfirmedEmail: jest.fn(),
    sendContributionDeniedEmail: jest.fn(),
    sendContributionDeletedEmail: jest.fn(),
    sendEmailTranslated: jest.fn(),
  }
})
jest.mock('@/password/EncryptorUtils')

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

// Every memo mentions "#music". Only the third one actually belongs to that group.
const UNCONVERTED = 'assignment test contribution about #music'
const ASSIGNED_ELSEWHERE = 'assignment test thanks everyone, #music was great'
const ASSIGNED_MUSIC = 'assignment test the choir rehearsal'
const DELIBERATELY_NONE = 'assignment test just a note, #music played in the background'
const WRITTEN_BY_MODERATOR = 'assignment test filed by a moderator, #music was mentioned'

beforeAll(async () => {
  testEnv = await testEnvironment(originalGetLogger('apollo'))
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

// Fail loudly when a fixture does not get created — a silently missing contribution turns
// every assertion below into a puzzle about the wrong thing.
const submit = async (memo: string, groupTags: string[]): Promise<void> => {
  const { errors } = await mutate({
    mutation: createContribution,
    variables: { amount: '100', memo, contributionDate: new Date().toString(), groupTags },
  })
  if (errors) {
    throw new Error(`could not create fixture "${memo}": ${JSON.stringify(errors)}`)
  }
}

const listMemos = async (groupTag?: string): Promise<string[]> => {
  const {
    data: {
      adminListContributions: { contributionList },
    },
  } = await query({
    query: adminListContributions,
    variables: { paginated: { pageSize: 100 }, filter: groupTag ? { groupTag } : {} },
  })
  return contributionList.map((contribution: { memo: string }) => contribution.memo)
}

const groupsShownFor = async (memo: string): Promise<string[]> => {
  const {
    data: {
      adminListContributions: { contributionList },
    },
  } = await query({ query: adminListContributions, variables: { paginated: { pageSize: 100 } } })
  const found = contributionList.find(
    (contribution: { memo: string }) => contribution.memo === memo,
  )
  return (found?.groupTags ?? []).map((tag: { tag: string }) => tag.tag)
}

describe('only the group field puts a contribution into a group', () => {
  let author: User

  beforeAll(async () => {
    await userFactory(testEnv, peterLustig) // administrator
    author = await userFactory(testEnv, bibiBloxberg)

    for (const tag of ['music', 'sports']) {
      const entry = DbGroupTag.create()
      entry.tag = tag
      entry.name = null
      await entry.save()
    }

    await loginAs('bibi@bloxberg.de')
    await submit(UNCONVERTED, [])
    await submit(ASSIGNED_ELSEWHERE, ['sports'])
    await submit(ASSIGNED_MUSIC, ['music'])
    await submit(DELIBERATELY_NONE, [])
    resetToken()

    await loginAs('peter@lustig.de')

    // Filed by a moderator for the member. This form has no group field, so the memo is
    // the moderator's own wording -- a "#word" in it must not choose a group.
    const { errors } = await mutate({
      mutation: adminCreateContribution,
      variables: {
        email: 'bibi@bloxberg.de',
        amount: '100',
        memo: WRITTEN_BY_MODERATOR,
        creationDate: new Date().toString(),
      },
    })
    if (errors) {
      throw new Error(`could not create admin fixture: ${JSON.stringify(errors)}`)
    }
  })

  afterAll(() => {
    resetToken()
  })

  // The counterpart of adopting the old stock in the admin: everything else goes through
  // the field. A hashtag on its own means nothing any more.
  it('does not put a contribution into a group just because its memo names one', async () => {
    expect(await listMemos('music')).not.toContain(UNCONVERTED)
    expect(await groupsShownFor(UNCONVERTED)).toEqual([])
  })

  it('finds a contribution that really is in the group', async () => {
    expect(await listMemos('music')).toContain(ASSIGNED_MUSIC)
  })

  it('ignores a hashtag in a contribution assigned to another group', async () => {
    // The memo says "#music", the group field says sports. The field wins.
    expect(await listMemos('music')).not.toContain(ASSIGNED_ELSEWHERE)
    expect(await groupsShownFor(ASSIGNED_ELSEWHERE)).toEqual(['sports'])
  })

  it('ignores a hashtag in a contribution deliberately set to no group', async () => {
    expect(await listMemos('music')).not.toContain(DELIBERATELY_NONE)
    expect(await groupsShownFor(DELIBERATELY_NONE)).toEqual([])
  })

  it('counts everything without a group as untagged, hashtag or not', async () => {
    const role = await UserRole.findOne({ where: { userId: author.id } })
    const entry = role ?? UserRole.create()
    entry.createdAt = entry.createdAt ?? new Date()
    entry.userId = author.id
    entry.role = RoleNames.MODERATOR
    entry.visibleGroupTags = JSON.stringify(['*untagged'])
    await entry.save()

    await loginAs('bibi@bloxberg.de')
    const memos = await listMemos()
    expect(memos).toContain(DELIBERATELY_NONE)
    // Both of these carry "#music" in the text and no link, so both are untagged.
    expect(memos).toContain(UNCONVERTED)
    expect(memos).not.toContain(ASSIGNED_MUSIC)
  })

  // The admin form offers no group field at all, so the memo is the moderator's own
  // wording -- all the more reason a "#word" in it must not choose a group.
  it('does not let a hashtag choose the group of a contribution filed by a moderator', async () => {
    expect(await listMemos('music')).not.toContain(WRITTEN_BY_MODERATOR)
    expect(await groupsShownFor(WRITTEN_BY_MODERATOR)).toEqual([])
  })

  // A moderator moving a contribution onto a tag that no longer exists -- an admin page
  // still holding the list from before a rename -- used to empty its group and report
  // success, taking it out of every group queue at once. Now it refuses, and the
  // contribution keeps the group it had.
  it('refuses to move a contribution onto a group that does not exist', async () => {
    await loginAs('peter@lustig.de')
    const contribution = await DbContribution.findOneOrFail({ where: { memo: ASSIGNED_MUSIC } })
    const { errors } = await mutate({
      mutation: assignContributionGroupTags,
      variables: { contributionId: contribution.id, tags: ['muusic'] },
    })
    expect(errors?.[0]?.message).toContain('Unknown group tag(s)')
    expect(await groupsShownFor(ASSIGNED_MUSIC)).toEqual(['music'])
  })

  it('keeps a hashtag out of a foreign moderator scope', async () => {
    const role = await UserRole.findOneOrFail({ where: { userId: author.id } })
    role.visibleGroupTags = JSON.stringify(['music'])
    await role.save()

    await loginAs('bibi@bloxberg.de')
    const memos = await listMemos()
    // The whole point: a music moderator must not reach a sports contribution just
    // because its author wrote "#music" in the text.
    expect(memos).not.toContain(ASSIGNED_ELSEWHERE)
    expect(memos).toContain(ASSIGNED_MUSIC)
    // Says "#music", is linked to nothing: out of the music moderator's reach.
    expect(memos).not.toContain(UNCONVERTED)
  })
})
