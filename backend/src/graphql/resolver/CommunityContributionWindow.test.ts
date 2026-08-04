import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, Contribution as DbContribution, GroupTag as DbGroupTag, User } from 'database'
import { getLogger as originalGetLogger } from 'log4js'
import { Order } from '@/graphql/enum/Order'
import { userFactory } from '@/seeds/factory/user'
import { createContribution, login } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import {
  COMMUNITY_WINDOW_MONTHS,
  groupTagsInCommunityWindow,
  groupTagsInUserContributions,
  loadAllContributions,
  loadUserContributions,
} from './util/contributions'

// Data protection: the community list forgets. It shows a recent stretch and nothing older,
// so a member's deeds cannot be read back over years and an old decision stops being on
// permanent display. Only the DISPLAY forgets — the submitter's own list stays complete,
// which is what lets them quote a contribution number when a decision is disputed.
//
// The window runs on the later of submission and decision, never on the date of the deed:
// a contribution may be filed today for an activity three months back.

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

const RECENT = 'community window: filed last month'
const OLD = 'community window: filed long ago and never decided'
const OLD_BUT_DECIDED = 'community window: filed long ago, confirmed last month'
const OLD_DENIED = 'community window: denied long ago'
const BACKDATED_DECISION = 'community window: filed today, decision dated long ago'
const IN_GROUP_RECENT = 'community window: the live group'
const IN_GROUP_OLD = 'community window: the quiet group'

const PAGINATED = { currentPage: 1, pageSize: 50, order: Order.DESC }

const monthsAgo = (months: number): Date => {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date
}

// Well outside the window, and well inside it — no test sits on the edge, so a day of
// month-end rounding cannot decide an outcome.
const OUTSIDE = COMMUNITY_WINDOW_MONTHS + 2
const INSIDE = 1

const communityMemos = async (): Promise<string[]> => {
  const [contributions] = await loadAllContributions(PAGINATED, {})
  return contributions.map((contribution) => contribution.memo)
}

beforeAll(async () => {
  const testEnv = await testEnvironment(originalGetLogger('apollo'))
  mutate = testEnv.mutate
  db = testEnv.db
  await cleanDB()

  await DbGroupTag.save([
    DbGroupTag.create({ tag: 'windowlive', name: 'Live group' }),
    DbGroupTag.create({ tag: 'windowquiet', name: 'Quiet group' }),
  ])

  member = await userFactory(testEnv, bibiBloxberg)
  resetToken()
  await mutate({ mutation: login, variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' } })
  for (const [memo, groupTags] of [
    [RECENT, []],
    [OLD, []],
    [OLD_BUT_DECIDED, []],
    [OLD_DENIED, []],
    [BACKDATED_DECISION, []],
    [IN_GROUP_RECENT, ['windowlive']],
    [IN_GROUP_OLD, ['windowquiet']],
  ] as Array<[string, string[]]>) {
    await mutate({
      mutation: createContribution,
      variables: { amount: '100', memo, contributionDate: new Date().toString(), groupTags },
    })
  }
  resetToken()

  await DbContribution.update({ memo: IN_GROUP_RECENT }, { createdAt: monthsAgo(INSIDE) })
  await DbContribution.update({ memo: IN_GROUP_OLD }, { createdAt: monthsAgo(OUTSIDE) })

  await DbContribution.update({ memo: RECENT }, { createdAt: monthsAgo(INSIDE) })
  await DbContribution.update({ memo: OLD }, { createdAt: monthsAgo(OUTSIDE) })
  await DbContribution.update(
    { memo: OLD_BUT_DECIDED },
    { createdAt: monthsAgo(OUTSIDE), confirmedAt: monthsAgo(INSIDE) },
  )
  await DbContribution.update(
    { memo: OLD_DENIED },
    { createdAt: monthsAgo(OUTSIDE), deniedAt: monthsAgo(OUTSIDE) },
  )
  // Created now, decision dated long before that. Impossible in ordinary operation, but
  // the seed data does exactly this (creationFactory backdates confirmedAt via
  // moveCreationDate), and a migration or a wrong clock would too.
  await DbContribution.update({ memo: BACKDATED_DECISION }, { confirmedAt: monthsAgo(OUTSIDE) })
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

describe('community list window', () => {
  it('shows what was filed inside the window', async () => {
    expect(await communityMemos()).toContain(RECENT)
  })

  it('drops what was filed before it and never decided', async () => {
    expect(await communityMemos()).not.toContain(OLD)
  })

  it('keeps an old contribution that was decided inside the window', async () => {
    // The decision is the recent event here, and moderation oversight is about how
    // decisions are being made now.
    expect(await communityMemos()).toContain(OLD_BUT_DECIDED)
  })

  it('drops a contribution that was denied before the window', async () => {
    expect(await communityMemos()).not.toContain(OLD_DENIED)
  })

  it('keeps a contribution filed today whose decision is dated long before it', async () => {
    // The window means the LATER of submission and decision. Reading the decision date
    // whenever there is one would hide a contribution filed today just because something
    // backdated its confirmation — which the seed data does, and a migration or a wrong
    // clock would too.
    expect(await communityMemos()).toContain(BACKDATED_DECISION)
  })

  it('counts only what it shows', async () => {
    const [contributions, count] = await loadAllContributions(PAGINATED, {})
    expect(count).toBe(contributions.length)
    // RECENT, OLD_BUT_DECIDED, BACKDATED_DECISION, IN_GROUP_RECENT
    expect(count).toBe(4)
  })
})

describe('the submitter keeps everything', () => {
  it('does not window the contributions of their own list', async () => {
    // This is what makes the number usable: whatever the community list has forgotten, the
    // person can still look up and quote it.
    const [contributions] = await loadUserContributions(member.id, PAGINATED)
    const memos = contributions.map((contribution) => contribution.memo)
    expect(memos).toEqual(
      expect.arrayContaining([RECENT, OLD, OLD_BUT_DECIDED, OLD_DENIED, BACKDATED_DECISION]),
    )
  })
})

describe('groups offered by the community filter', () => {
  it('offers a group that has something inside the window', async () => {
    expect(await groupTagsInCommunityWindow(['windowlive', 'windowquiet'])).toContain('windowlive')
  })

  it('drops a group that has gone quiet', async () => {
    expect(await groupTagsInCommunityWindow(['windowlive', 'windowquiet'])).not.toContain(
      'windowquiet',
    )
  })

  it('leaves the canonical list alone, so a quiet group stays choosable when submitting', async () => {
    // A group missing from the submission field could never be woken up again — nobody
    // could file a contribution for it.
    const canonical = await DbGroupTag.find({ order: { tag: 'ASC' } })
    expect(canonical.map((tag) => tag.tag)).toEqual(['windowlive', 'windowquiet'])
  })
})

describe('groups offered by "my contributions"', () => {
  it('is not windowed: keeps a group whose only contribution has gone quiet', async () => {
    // Unlike the community filter (which drops "windowquiet"), the submitter's own list is
    // not windowed, so a group still holding one of their older contributions stays offered.
    expect(await groupTagsInUserContributions(member.id, ['windowlive', 'windowquiet'])).toEqual(
      expect.arrayContaining(['windowlive', 'windowquiet']),
    )
  })

  it('drops a group the submitter has no contribution in', async () => {
    expect(
      await groupTagsInUserContributions(member.id, ['windowlive', 'unfiledgroup']),
    ).not.toContain('unfiledgroup')
  })
})
