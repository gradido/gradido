import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, CreationGroup as DbCreationGroup, User } from 'database'
import { getLogger as originalGetLogger } from 'log4js'
import { Order } from '@/graphql/enum/Order'
import { userFactory } from '@/seeds/factory/user'
import { createContribution, login } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { loadAllContributions } from './util/contributions'

// Group functions: the wallet's own contribution search. A member may search by
// text and by group — never by a person. The community list shows deeds without their
// author (each contribution is identified by its number instead), so there is nothing to
// look people up by: not their name, and not, as ever, their e-mail address. The admin
// search does match both; it must not leak into the wallet.

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
let db: AppDatabase
let member: User

const PLAIN = 'wallet filter test about the garden'
const TAGGED = 'wallet filter test about the choir'
const PAGINATED = { currentPage: 1, pageSize: 50, order: Order.DESC }

const memosFor = async (filter: {
  query?: string | null
  creationGroup?: string | null
}): Promise<string[]> => {
  const [contributions] = await loadAllContributions(PAGINATED, filter)
  return contributions.map((contribution) => contribution.memo)
}

beforeAll(async () => {
  const testEnv = await testEnvironment(originalGetLogger('apollo'))
  mutate = testEnv.mutate
  db = testEnv.db
  await cleanDB()

  // The group has to exist: a contribution is in a group because it is LINKED to one, and
  // there is nothing to link to otherwise. The old version got away without it because the
  // filter matched the memo as a substring, without ever asking the canonical list.
  const group = DbCreationGroup.create()
  group.tag = 'walletfiltergroup'
  group.name = 'Wallet filter group'
  await group.save()

  member = await userFactory(testEnv, bibiBloxberg)
  resetToken()
  await mutate({ mutation: login, variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' } })
  for (const [memo, creationGroups] of [
    [PLAIN, []],
    [TAGGED, ['walletfiltergroup']],
  ] as Array<[string, string[]]>) {
    await mutate({
      mutation: createContribution,
      variables: { amount: '100', memo, contributionDate: new Date().toString(), creationGroups },
    })
  }
  resetToken()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('wallet contribution search', () => {
  it('finds a contribution by a word from its text', async () => {
    const memos = await memosFor({ query: 'garden' })
    expect(memos).toContain(PLAIN)
    expect(memos).not.toContain(TAGGED)
  })

  it('does NOT find anything by the name of the person who submitted', async () => {
    // Both fixtures belong to `member`. Searching for any spelling of their name must come
    // up empty — otherwise a member could pull up everything another one ever submitted,
    // including the contributions a moderator denied.
    for (const query of [
      member.firstName,
      member.lastName,
      `${member.firstName} ${member.lastName}`,
    ]) {
      expect(await memosFor({ query })).toHaveLength(0)
    }
  })

  it('does NOT find anything by e-mail address', async () => {
    const memos = await memosFor({ query: 'bibi@bloxberg.de' })
    expect(memos).toHaveLength(0)
  })

  it('does not even load the person behind a contribution', async () => {
    // The search cannot match a person because the person is not there at all. This is the
    // guarantee the wallet rests on: it holds for anyone querying the API directly, not
    // just for what our own list happens to display.
    const [contributions] = await loadAllContributions(PAGINATED, {})
    expect(contributions.length).toBeGreaterThan(0)
    for (const contribution of contributions) {
      expect(contribution.user).toBeUndefined()
    }
  })

  it('filters by group', async () => {
    const memos = await memosFor({ creationGroup: 'walletfiltergroup' })
    expect(memos).toContain(TAGGED)
    expect(memos).not.toContain(PLAIN)
  })

  it('returns everything when nothing is filtered', async () => {
    const memos = await memosFor({})
    expect(memos).toEqual(expect.arrayContaining([PLAIN, TAGGED]))
  })
})
