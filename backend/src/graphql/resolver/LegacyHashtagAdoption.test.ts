import { ContributionStatus } from '@enum/ContributionStatus'
import { ContributionType } from '@enum/ContributionType'
import { cleanDB, testEnvironment } from '@test/helpers'
import {
  AppDatabase,
  Contribution as DbContribution,
  ContributionGroupTag as DbContributionGroupTag,
  GroupTag as DbGroupTag,
} from 'database'
import { getLogger as originalGetLogger } from 'log4js'
import { GroupTagResolver } from './GroupTagResolver'

// LEGACY-HASHTAG-ADOPTION -- a changeover aid, meant to be removed again.
//
// The rule that decides WHICH memo names a group is covered without a database in
// legacyHashtagRule.test.ts. This file covers the other half: WHICH contributions are
// offered at all, which lives in SQL and therefore needs a real database.
//
// ★ The guard deliberately does NOT require group_tags_set_at to be null, although the
// migration this replaces did. setContributionGroupTags stamps on EVERY submission --
// including when the field was left empty -- so requiring a null stamp excluded everything
// filed since the group field went live. That is exactly the case the changeover has to
// catch: someone still typing the hashtag out of habit.

let db: AppDatabase
const resolver = new GroupTagResolver()

beforeAll(async () => {
  const testEnv = await testEnvironment(originalGetLogger('apollo'))
  db = testEnv.db
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

const makeGroup = async (tag: string): Promise<DbGroupTag> => {
  const entry = DbGroupTag.create()
  entry.tag = tag
  entry.name = tag
  await entry.save()
  return entry
}

// A contribution written straight to the table, so the fixture cannot be quietly reshaped
// by a mutation's own leniency. `stamped` is the interesting axis: it is what the old guard
// looked at.
const makeContribution = async (
  memo: string,
  { stamped }: { stamped: boolean },
): Promise<DbContribution> => {
  const contribution = DbContribution.create()
  contribution.userId = 1
  contribution.amount = 100n as unknown as DbContribution['amount']
  contribution.memo = memo
  contribution.createdAt = new Date()
  contribution.contributionDate = new Date()
  contribution.contributionType = ContributionType.USER
  contribution.contributionStatus = ContributionStatus.PENDING
  contribution.groupTagsSetAt = stamped ? new Date() : null
  await contribution.save()
  return contribution
}

const linkedContributionIds = async (group: DbGroupTag): Promise<number[]> => {
  const links = await DbContributionGroupTag.find({ where: { groupTagId: group.id } })
  return links.map((link) => link.contributionId).sort((a, b) => a - b)
}

describe('legacyHashtagCounts', () => {
  it('counts the two spellings apart', async () => {
    const group = await makeGroup('countsplit')
    await makeContribution('exact one #countsplit here', { stamped: false })
    await makeContribution('exact two #countsplit here', { stamped: false })
    await makeContribution('loose one # countsplit here', { stamped: false })

    const counts = await resolver.legacyHashtagCounts(group.id)
    expect(counts).toEqual({ exact: 2, loose: 1 })
  })

  // ★ The point of dropping the stamp condition. Before it was dropped this came back as 0,
  // because everything filed since the group field went live carries a stamp.
  it('finds a contribution that said "no group" and still names it in the text', async () => {
    const group = await makeGroup('stampedstill')
    await makeContribution('deliberately no group, but #stampedstill in the text', {
      stamped: true,
    })

    const counts = await resolver.legacyHashtagCounts(group.id)
    expect(counts.exact).toBe(1)
  })

  // The guard that stays: a contribution that already belongs somewhere keeps its group.
  it('ignores a contribution that already carries a group', async () => {
    const group = await makeGroup('alreadythere')
    const other = await makeGroup('someothergroup')
    const contribution = await makeContribution('#alreadythere but already filed', {
      stamped: false,
    })
    const link = DbContributionGroupTag.create()
    link.contributionId = contribution.id
    link.groupTagId = other.id
    await link.save()

    const counts = await resolver.legacyHashtagCounts(group.id)
    expect(counts).toEqual({ exact: 0, loose: 0 })
  })
})

describe('adoptLegacyHashtags', () => {
  it('links the exact spelling and leaves the blank one alone when it is not asked for', async () => {
    const group = await makeGroup('onlyexact')
    const exact = await makeContribution('#onlyexact here', { stamped: false })
    const loose = await makeContribution('# onlyexact here', { stamped: false })

    await resolver.adoptLegacyHashtags(group.id, false)

    expect(await linkedContributionIds(group)).toEqual([exact.id])
    expect(await linkedContributionIds(group)).not.toContain(loose.id)
  })

  // Running twice is the expected path: adopt the exact spelling, look at the numbers, come
  // back for the blank one. The second run must add only what the first left behind.
  it('picks up the blank spelling on a second run without duplicating the first', async () => {
    const group = await makeGroup('secondrun')
    const exact = await makeContribution('#secondrun here', { stamped: false })
    const loose = await makeContribution('# secondrun here', { stamped: false })

    await resolver.adoptLegacyHashtags(group.id, false)
    const afterFirst = await resolver.adoptLegacyHashtags(group.id, true)

    expect(await linkedContributionIds(group)).toEqual([exact.id, loose.id].sort((a, b) => a - b))
    // The count reports what THIS run did, so the second run reports only the blank one.
    expect(afterFirst.hashtagsAdoptedCount).toBe(1)
  })

  // "I looked and there was nothing" has to read differently from "nobody has looked yet",
  // or a group with nothing to adopt keeps asking to be checked forever.
  it('stamps the group even when it found nothing', async () => {
    const group = await makeGroup('emptycheck')
    expect(group.hashtagsAdoptedAt).toBeNull()

    const updated = await resolver.adoptLegacyHashtags(group.id, true)

    expect(updated.hashtagsAdoptedAt).not.toBeNull()
    expect(updated.hashtagsAdoptedCount).toBe(0)
  })

  it('refuses a group that does not exist', async () => {
    await expect(resolver.adoptLegacyHashtags(987654, true)).rejects.toThrow('Group tag not found')
  })
})
