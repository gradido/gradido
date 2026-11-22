// AI-GENERATED — not an architecture reference
import { RoleNames } from '@enum/RoleNames'
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import {
  AppDatabase,
  CreationGroup as DbCreationGroup,
  DbUser,
  dbUpdateUserRoleHandledGroups,
  UserRole,
} from 'database'
import { GraphQLError } from 'graphql'
import { gql } from 'graphql-tag'
import { getLogger as originalGetLogger } from 'log4js'
import { userFactoryDrizzle } from '@/seeds/factory/user'
import { createContribution, login } from '@/seeds/graphql/mutations'
import { adminListContributions } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

// "Meine Gruppen" (MG1, in two columns since MG2b): whoever sees every group ticks the creation
// groups whose creations, and those whose support requests, they handle themself, and the filter
// '*handled' of the creation page shows exactly the first. ⛔ Through the schema only: the right
// and the rule live at the GraphQL layer and in the resolver.

const handledCreationGroups = gql`
  query {
    handledCreationGroups {
      groupIds
      untagged
      off
    }
  }
`

const handledSupportGroups = gql`
  query {
    handledSupportGroups {
      groupIds
      untagged
      off
    }
  }
`

const setHandledGroups = gql`
  mutation ($creation: HandledGroupsInput!, $support: HandledGroupsInput!) {
    setHandledGroups(creation: $creation, support: $support) {
      creation {
        groupIds
        untagged
        off
      }
      support {
        groupIds
        untagged
        off
      }
    }
  }
`

type Choice = { groupIds: number[]; untagged: boolean; off?: boolean }
const NOTHING: Choice = { groupIds: [], untagged: false, off: false }

// the variables of setHandledGroups for a choice of the creations and one of the support
const both = (creation: Choice, support: Choice = NOTHING) => ({
  creation: { off: false, ...creation },
  support: { off: false, ...support },
})

const setModeratorCreationGroupScope = gql`
  mutation ($userId: Int!, $scope: [String!]!) {
    setModeratorCreationGroupScope(userId: $userId, scope: $scope)
  }
`

// the count alone, as the badges and the start page ask for it (countOnly in the resolver)
const contributionCount = gql`
  query ($filter: SearchContributionsFilterArgs) {
    adminListContributions(filter: $filter) {
      contributionCount
    }
  }
`

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase

const IN_A = 'handled-groups test, a contribution in group A'
const IN_B = 'handled-groups test, a contribution in group B'
const IN_NONE = 'handled-groups test, a contribution in no group'

let groupA: number
let groupB: number
let peter: DbUser
let bibi: DbUser
let bob: DbUser

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  const { errors } = await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
  // ⛔ A failed login leaves the token empty, and an empty token is refused with the very words
  // the refusals below assert.
  expect(errors).toBeUndefined()
}

const memosFor = async (creationGroup: string): Promise<string[]> => {
  const { data, errors } = await query({
    query: adminListContributions,
    variables: { paginated: { pageSize: 100 }, filter: { creationGroup } },
  })
  if (errors?.length) {
    throw new Error(`adminListContributions(creationGroup: ${creationGroup}): ${errors[0].message}`)
  }
  return data.adminListContributions.contributionList
    .map((contribution: { memo: string }) => contribution.memo)
    .sort()
}

const storedChoiceOf = async (userId: number): Promise<string | null | undefined> =>
  (await UserRole.findOne({ where: { userId } }))?.handledCreationGroups

const storedSupportOf = async (userId: number): Promise<string | null | undefined> =>
  (await UserRole.findOne({ where: { userId } }))?.handledSupportGroups

// both columns as the row holds them, written by hand
const store = async (userId: number, creation: Choice | null, support: Choice | null = null) =>
  expect(
    await dbUpdateUserRoleHandledGroups(userId, {
      creation: creation && JSON.stringify(creation),
      support: support && JSON.stringify(support),
    }),
  ).toEqual({ success: true })

const unauthorized = expect.objectContaining({ errors: [new GraphQLError('401 Unauthorized')] })

beforeAll(async () => {
  const testEnv = await testEnvironment(originalGetLogger('apollo'))
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()

  for (const tag of ['handled-a', 'handled-b']) {
    const entry = DbCreationGroup.create()
    entry.tag = tag
    entry.name = null
    await entry.save()
  }
  groupA = (await DbCreationGroup.findOneOrFail({ where: { tag: 'handled-a' } })).id
  groupB = (await DbCreationGroup.findOneOrFail({ where: { tag: 'handled-b' } })).id
  peter = await userFactoryDrizzle(peterLustig) // administrator
  bibi = await userFactoryDrizzle(bibiBloxberg) // a moderator with the scope B below
  bob = await userFactoryDrizzle(bobBaumeister) // a member without a role

  await loginAs('bob@baumeister.de')
  for (const [memo, creationGroups] of [
    [IN_A, ['handled-a']],
    [IN_B, ['handled-b']],
    [IN_NONE, []],
  ] as Array<[string, string[]]>) {
    const { errors } = await mutate({
      mutation: createContribution,
      variables: { amount: '100', memo, contributionDate: new Date().toString(), creationGroups },
    })
    expect(errors).toBeUndefined()
  }

  const role = UserRole.create()
  role.createdAt = new Date()
  role.userId = bibi.id
  role.role = RoleNames.MODERATOR
  role.visibleCreationGroups = JSON.stringify(['handled-b'])
  await role.save()

  // The fixture proves itself: a group the community lacks would have been dropped silently.
  await loginAs('peter@lustig.de')
  expect(await memosFor('handled-a')).toEqual([IN_A])
  expect(await memosFor('handled-b')).toEqual([IN_B])
})

afterAll(async () => {
  resetToken()
  await cleanDB()
  await db.destroy()
})

describe('the filter *handled', () => {
  // ⭐ The case all others stand on: nothing ticked means everything, never nothing.
  it('shows an administrator who chose nothing every contribution', async () => {
    await loginAs('peter@lustig.de')
    expect(await storedChoiceOf(peter.id)).toBeNull()
    expect(await memosFor('*handled')).toEqual([IN_A, IN_B, IN_NONE].sort())
  })

  it('shows the groups ticked and "no group", and counts them alone the same', async () => {
    await loginAs('peter@lustig.de')
    const { errors } = await mutate({
      mutation: setHandledGroups,
      variables: both({ groupIds: [groupA], untagged: true }),
    })
    expect(errors).toBeUndefined()

    expect(await memosFor('*handled')).toEqual([IN_A, IN_NONE].sort())
    const counted = await query({
      query: contributionCount,
      variables: { filter: { creationGroup: '*handled' } },
    })
    expect(counted.errors).toBeUndefined()
    expect(counted.data.adminListContributions.contributionCount).toBe(2)
  })

  // the support's column steers the support alone (MG2b)
  it('shows everything where only the column "Support" is ticked', async () => {
    await store(peter.id, null, { groupIds: [groupB], untagged: false })
    await loginAs('peter@lustig.de')
    expect(await memosFor('*handled')).toEqual([IN_A, IN_B, IN_NONE].sort())
    await store(peter.id, { groupIds: [groupA], untagged: true })
  })

  it('leaves the other choices of the filter as they were', async () => {
    await loginAs('peter@lustig.de')
    expect(await memosFor('')).toEqual([IN_A, IN_B, IN_NONE].sort())
    expect(await memosFor('*grouped')).toEqual([IN_A, IN_B].sort())
    expect(await memosFor('*untagged')).toEqual([IN_NONE])
  })

  // An assigned scope is the moderator's list: a choice in the row counts not.
  it('shows a moderator with an assigned scope that scope, whatever stands in the row', async () => {
    await store(
      bibi.id,
      { groupIds: [groupA], untagged: false },
      { groupIds: [groupA], untagged: false },
    )

    await loginAs('bibi@bloxberg.de')
    expect(await memosFor('*handled')).toEqual([IN_B])
  })
})

describe('handledCreationGroups and handledSupportGroups', () => {
  it('answer the choice in force, each of its own column', async () => {
    // its own choice, so that the test stands alone as well as after the others
    await store(
      peter.id,
      { groupIds: [groupA], untagged: true },
      { groupIds: [groupB], untagged: false },
    )
    await loginAs('peter@lustig.de')
    const creation = await query({ query: handledCreationGroups })
    expect(creation.errors).toBeUndefined()
    expect(creation.data.handledCreationGroups).toEqual({
      groupIds: [groupA],
      untagged: true,
      off: false,
    })
    const support = await query({ query: handledSupportGroups })
    expect(support.errors).toBeUndefined()
    expect(support.data.handledSupportGroups).toEqual({
      groupIds: [groupB],
      untagged: false,
      off: false,
    })
  })

  it('answer a moderator with an assigned scope the choice of nothing, in both', async () => {
    await loginAs('bibi@bloxberg.de')
    for (const [document, field] of [
      [handledCreationGroups, 'handledCreationGroups'],
      [handledSupportGroups, 'handledSupportGroups'],
    ] as const) {
      const { data, errors } = await query({ query: document })
      expect(errors).toBeUndefined()
      expect(data[field]).toEqual(NOTHING)
    }
  })

  it('refuse a member without a role', async () => {
    await loginAs('bob@baumeister.de')
    expect(await query({ query: handledCreationGroups })).toEqual(unauthorized)
    expect(await query({ query: handledSupportGroups })).toEqual(unauthorized)
  })
})

describe('setHandledGroups', () => {
  it('stores each group once, in ascending order, each column apart, and answers them so', async () => {
    await loginAs('peter@lustig.de')
    const { data, errors } = await mutate({
      mutation: setHandledGroups,
      variables: both(
        { groupIds: [groupB, groupA, groupB], untagged: true },
        { groupIds: [groupB, groupB], untagged: false },
      ),
    })
    expect(errors).toBeUndefined()
    const ascending = [groupA, groupB].sort((a, b) => a - b)
    expect(data.setHandledGroups).toEqual({
      creation: { groupIds: ascending, untagged: true, off: false },
      support: { groupIds: [groupB], untagged: false, off: false },
    })
    expect(JSON.parse((await storedChoiceOf(peter.id)) ?? 'null')).toEqual({
      groupIds: ascending,
      untagged: true,
    })
    expect(JSON.parse((await storedSupportOf(peter.id)) ?? 'null')).toEqual({
      groupIds: [groupB],
      untagged: false,
    })
  })

  it('stores a column of nothing as null, the other as chosen', async () => {
    await loginAs('peter@lustig.de')
    const { data, errors } = await mutate({
      mutation: setHandledGroups,
      variables: both(NOTHING, { groupIds: [], untagged: true }),
    })
    expect(errors).toBeUndefined()
    expect(data.setHandledGroups).toEqual({
      creation: NOTHING,
      support: { groupIds: [], untagged: true, off: false },
    })
    expect(await storedChoiceOf(peter.id)).toBeNull()
    expect(JSON.parse((await storedSupportOf(peter.id)) ?? 'null')).toEqual({
      groupIds: [],
      untagged: true,
    })

    await mutate({ mutation: setHandledGroups, variables: both(NOTHING, NOTHING) })
    expect(await storedChoiceOf(peter.id)).toBeNull()
    expect(await storedSupportOf(peter.id)).toBeNull()
  })

  // MG5: a column that is off, with the ticks standing behind it -- and the filter '*handled' of the
  // creation page finds nothing
  it('stores a column that is off with its ticks, and the filter *handled finds nothing', async () => {
    await loginAs('peter@lustig.de')
    const { data, errors } = await mutate({
      mutation: setHandledGroups,
      variables: both(
        { groupIds: [groupA], untagged: true, off: true },
        { groupIds: [groupB], untagged: false },
      ),
    })
    expect(errors).toBeUndefined()
    expect(data.setHandledGroups.creation).toEqual({
      groupIds: [groupA],
      untagged: true,
      off: true,
    })
    expect(JSON.parse((await storedChoiceOf(peter.id)) ?? 'null')).toEqual({
      groupIds: [groupA],
      untagged: true,
      off: true,
    })
    expect(JSON.parse((await storedSupportOf(peter.id)) ?? 'null')).toEqual({
      groupIds: [groupB],
      untagged: false,
    })
    expect(await memosFor('*handled')).toEqual([])
    // on again, the ticks count as they did
    await mutate({
      mutation: setHandledGroups,
      variables: both(
        { groupIds: [groupA], untagged: true },
        { groupIds: [groupB], untagged: false },
      ),
    })
    expect(await memosFor('*handled')).toEqual([IN_A, IN_NONE].sort())
  })

  it.each([
    ['the creations', 'creation'],
    ['the support', 'support'],
  ])(
    'refuses a group the community does not have in %s, and keeps both columns',
    async (_name, column) => {
      await loginAs('peter@lustig.de')
      await mutate({
        mutation: setHandledGroups,
        variables: both(
          { groupIds: [groupA], untagged: false },
          { groupIds: [groupB], untagged: true },
        ),
      })
      const before = [await storedChoiceOf(peter.id), await storedSupportOf(peter.id)]
      const unknown = Math.max(groupA, groupB) + 1000
      const wrong = { groupIds: [groupA, unknown], untagged: false }

      const { errors } = await mutate({
        mutation: setHandledGroups,
        variables: column === 'creation' ? both(wrong, NOTHING) : both(NOTHING, wrong),
      })
      expect(errors?.[0]?.message).toBe('Unknown creation group(s)')
      expect([await storedChoiceOf(peter.id), await storedSupportOf(peter.id)]).toEqual(before)
    },
  )

  it('refuses a moderator with an assigned scope, and keeps what was there', async () => {
    const before = [await storedChoiceOf(bibi.id), await storedSupportOf(bibi.id)]
    await loginAs('bibi@bloxberg.de')
    const { errors } = await mutate({
      mutation: setHandledGroups,
      variables: both(
        { groupIds: [groupB], untagged: true },
        { groupIds: [groupB], untagged: true },
      ),
    })
    expect(errors?.[0]?.message).toBe('An assigned scope leaves no creation groups to choose')
    expect([await storedChoiceOf(bibi.id), await storedSupportOf(bibi.id)]).toEqual(before)
  })

  // MG5: the switch is an administrator's. In the row of a moderator it is what another role left
  // there: it counts not, the ticks behind it do
  describe('of a moderator who sees every group', () => {
    const scopeOfBibi = (scope: string[] | null) =>
      UserRole.update(
        { userId: bibi.id },
        { visibleCreationGroups: scope && JSON.stringify(scope) },
      )

    beforeAll(async () => {
      await scopeOfBibi(null)
    })

    afterAll(async () => {
      await scopeOfBibi(['handled-b'])
    })

    it.each([
      ['the creations', 'creation'],
      ['the support', 'support'],
    ])('refuses the switch for %s, and keeps both columns', async (_name, column) => {
      await store(
        bibi.id,
        { groupIds: [groupA], untagged: false },
        { groupIds: [groupB], untagged: false },
      )
      const before = [await storedChoiceOf(bibi.id), await storedSupportOf(bibi.id)]
      await loginAs('bibi@bloxberg.de')
      const off = { groupIds: [groupA], untagged: false, off: true }

      const { errors } = await mutate({
        mutation: setHandledGroups,
        variables: column === 'creation' ? both(off, NOTHING) : both(NOTHING, off),
      })
      expect(errors?.[0]?.message).toBe('Only an administrator may switch an area off')
      expect([await storedChoiceOf(bibi.id), await storedSupportOf(bibi.id)]).toEqual(before)
    })

    it('takes the ticks, and answers a switch left in the row as on', async () => {
      await store(
        bibi.id,
        { groupIds: [groupA], untagged: false, off: true },
        { groupIds: [], untagged: false, off: true },
      )
      await loginAs('bibi@bloxberg.de')
      const creation = await query({ query: handledCreationGroups })
      expect(creation.data.handledCreationGroups).toEqual({
        groupIds: [groupA],
        untagged: false,
        off: false,
      })
      const support = await query({ query: handledSupportGroups })
      expect(support.data.handledSupportGroups).toEqual(NOTHING)
      expect(await memosFor('*handled')).toEqual([IN_A])

      const { errors } = await mutate({
        mutation: setHandledGroups,
        variables: both({ groupIds: [groupB], untagged: false }),
      })
      expect(errors).toBeUndefined()
      expect(await memosFor('*handled')).toEqual([IN_B])
    })
  })

  it('refuses a member without a role, and writes no row', async () => {
    await loginAs('bob@baumeister.de')
    expect(
      await mutate({
        mutation: setHandledGroups,
        variables: both({ groupIds: [], untagged: true }, { groupIds: [], untagged: true }),
      }),
    ).toEqual(unauthorized)
    expect(await storedChoiceOf(bob.id)).toBeUndefined()
  })
})

// ⛔ TypeORM's save() writes back each column that differs from the row as it stands by then
// (saveModeratorScope, the renaming of a group): without `update: false` on the entity, a role row
// loaded before the choice was saved would take the choice back.
describe('the choice through a save of the role row', () => {
  it('stands after the scope is set through the entity', async () => {
    // loaded while the row holds another choice than the one saved next
    const stale = await UserRole.findOneOrFail({ where: { userId: bibi.id } })
    const choice = JSON.stringify({ groupIds: [groupB], untagged: true })
    const support = JSON.stringify({ groupIds: [groupB], untagged: false })
    expect(stale.handledCreationGroups).not.toBe(choice)
    expect(stale.handledSupportGroups).not.toBe(support)
    expect(await dbUpdateUserRoleHandledGroups(bibi.id, { creation: choice, support })).toEqual({
      success: true,
    })

    stale.visibleCreationGroups = JSON.stringify(['handled-a'])
    await stale.save()
    expect(await storedChoiceOf(bibi.id)).toBe(choice)
    expect(await storedSupportOf(bibi.id)).toBe(support)

    await loginAs('peter@lustig.de')
    const { errors } = await mutate({
      mutation: setModeratorCreationGroupScope,
      variables: { userId: bibi.id, scope: ['handled-b'] },
    })
    expect(errors).toBeUndefined()
    expect(await storedChoiceOf(bibi.id)).toBe(choice)
    expect(await storedSupportOf(bibi.id)).toBe(support)
  })
})
