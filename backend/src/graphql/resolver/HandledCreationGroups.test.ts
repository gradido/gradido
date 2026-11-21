// AI-GENERATED — not an architecture reference
import { RoleNames } from '@enum/RoleNames'
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import {
  AppDatabase,
  CreationGroup as DbCreationGroup,
  DbUser,
  dbUpdateUserRoleHandledCreationGroups,
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

// "Meine Gruppen" (MG1): whoever sees every group ticks the creation groups they handle
// themself, and the filter '*handled' shows exactly those. ⛔ Through the schema only: the right
// and the rule live at the GraphQL layer and in the resolver.

const handledCreationGroups = gql`
  query {
    handledCreationGroups {
      groupIds
      untagged
    }
  }
`

const setHandledCreationGroups = gql`
  mutation ($groupIds: [Int!]!, $untagged: Boolean!) {
    setHandledCreationGroups(groupIds: $groupIds, untagged: $untagged) {
      groupIds
      untagged
    }
  }
`

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
      mutation: setHandledCreationGroups,
      variables: { groupIds: [groupA], untagged: true },
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

  it('leaves the other choices of the filter as they were', async () => {
    await loginAs('peter@lustig.de')
    expect(await memosFor('')).toEqual([IN_A, IN_B, IN_NONE].sort())
    expect(await memosFor('*grouped')).toEqual([IN_A, IN_B].sort())
    expect(await memosFor('*untagged')).toEqual([IN_NONE])
  })

  // An assigned scope is the moderator's list: a choice in the row counts not.
  it('shows a moderator with an assigned scope that scope, whatever stands in the row', async () => {
    expect(
      await dbUpdateUserRoleHandledCreationGroups(
        bibi.id,
        JSON.stringify({ groupIds: [groupA], untagged: false }),
      ),
    ).toEqual({ success: true })

    await loginAs('bibi@bloxberg.de')
    expect(await memosFor('*handled')).toEqual([IN_B])
  })
})

describe('handledCreationGroups', () => {
  it('answers the choice in force', async () => {
    await loginAs('peter@lustig.de')
    const { data, errors } = await query({ query: handledCreationGroups })
    expect(errors).toBeUndefined()
    expect(data.handledCreationGroups).toEqual({ groupIds: [groupA], untagged: true })
  })

  it('answers a moderator with an assigned scope the choice of nothing', async () => {
    await loginAs('bibi@bloxberg.de')
    const { data, errors } = await query({ query: handledCreationGroups })
    expect(errors).toBeUndefined()
    expect(data.handledCreationGroups).toEqual({ groupIds: [], untagged: false })
  })

  it('refuses a member without a role', async () => {
    await loginAs('bob@baumeister.de')
    expect(await query({ query: handledCreationGroups })).toEqual(unauthorized)
  })
})

describe('setHandledCreationGroups', () => {
  it('stores each group once, in ascending order, and answers it so', async () => {
    await loginAs('peter@lustig.de')
    const { data, errors } = await mutate({
      mutation: setHandledCreationGroups,
      variables: { groupIds: [groupB, groupA, groupB], untagged: true },
    })
    expect(errors).toBeUndefined()
    const ascending = [groupA, groupB].sort((a, b) => a - b)
    expect(data.setHandledCreationGroups).toEqual({ groupIds: ascending, untagged: true })
    expect(JSON.parse((await storedChoiceOf(peter.id)) ?? 'null')).toEqual({
      groupIds: ascending,
      untagged: true,
    })
  })

  it('stores the choice of nothing as null', async () => {
    await loginAs('peter@lustig.de')
    const { data, errors } = await mutate({
      mutation: setHandledCreationGroups,
      variables: { groupIds: [], untagged: false },
    })
    expect(errors).toBeUndefined()
    expect(data.setHandledCreationGroups).toEqual({ groupIds: [], untagged: false })
    expect(await storedChoiceOf(peter.id)).toBeNull()
  })

  it('refuses a group the community does not have, and keeps what was there', async () => {
    await loginAs('peter@lustig.de')
    await mutate({
      mutation: setHandledCreationGroups,
      variables: { groupIds: [groupA], untagged: false },
    })
    const before = await storedChoiceOf(peter.id)
    const unknown = Math.max(groupA, groupB) + 1000

    const { errors } = await mutate({
      mutation: setHandledCreationGroups,
      variables: { groupIds: [groupA, unknown], untagged: false },
    })
    expect(errors?.[0]?.message).toBe('Unknown creation group(s)')
    expect(await storedChoiceOf(peter.id)).toBe(before)
  })

  it('refuses a moderator with an assigned scope, and keeps what was there', async () => {
    const before = await storedChoiceOf(bibi.id)
    await loginAs('bibi@bloxberg.de')
    const { errors } = await mutate({
      mutation: setHandledCreationGroups,
      variables: { groupIds: [groupB], untagged: true },
    })
    expect(errors?.[0]?.message).toBe('An assigned scope leaves no creation groups to choose')
    expect(await storedChoiceOf(bibi.id)).toBe(before)
  })

  it('refuses a member without a role, and writes no row', async () => {
    await loginAs('bob@baumeister.de')
    expect(
      await mutate({
        mutation: setHandledCreationGroups,
        variables: { groupIds: [], untagged: true },
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
    expect(stale.handledCreationGroups).not.toBe(choice)
    expect(await dbUpdateUserRoleHandledCreationGroups(bibi.id, choice)).toEqual({ success: true })

    stale.visibleCreationGroups = JSON.stringify(['handled-a'])
    await stale.save()
    expect(await storedChoiceOf(bibi.id)).toBe(choice)

    await loginAs('peter@lustig.de')
    const { errors } = await mutate({
      mutation: setModeratorCreationGroupScope,
      variables: { userId: bibi.id, scope: ['handled-b'] },
    })
    expect(errors).toBeUndefined()
    expect(await storedChoiceOf(bibi.id)).toBe(choice)
  })
})
