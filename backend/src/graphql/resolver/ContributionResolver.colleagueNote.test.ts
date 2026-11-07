// AI-GENERATED — not an architecture reference
import { ContributionMessageType } from '@enum/ContributionMessageType'
import { RoleNames } from '@enum/RoleNames'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { gql } from 'graphql-tag'
import { userFactory } from '@/seeds/factory/user'
import {
  adminCreateContributionMessage,
  createContribution,
  login,
  logout,
} from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

// The field as the admin's list asks for it, and as a member could ask for it in their own list.
const adminList = gql`
  query {
    adminListContributions {
      contributionList {
        id
        colleagueNoteOnQuestion
      }
    }
  }
`
const ownList = gql`
  query ($pagination: Paginated!) {
    listContributions(pagination: $pagination) {
      contributionList {
        id
        colleagueNoteOnQuestion
      }
    }
  }
`

let testEnv: Awaited<ReturnType<typeof testEnvironment>>

const signIn = async (email: string) => {
  resetToken()
  await testEnv.mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

const write = (contributionId: number, message: string, messageType: ContributionMessageType) =>
  testEnv.mutate({
    mutation: adminCreateContributionMessage,
    variables: { contributionId, message, messageType },
  })

// What the admin's list says of the contribution, read as the moderator who is signed in.
const noteFlag = async (contributionId: number) => {
  const { data, errors } = await testEnv.query({ query: adminList })
  expect(errors).toBeUndefined()
  return data.adminListContributions.contributionList.find(
    (row: { id: number }) => row.id === contributionId,
  )?.colleagueNoteOnQuestion
}

describe("adminListContributions: a colleague's note on the open question", () => {
  let contributionId: number

  beforeAll(async () => {
    testEnv = await testEnvironment()
    await cleanDB()
    await userFactory(testEnv, bibiBloxberg)
    await userFactory(testEnv, peterLustig)
    // A second moderator, the colleague.
    await userFactory(testEnv, { ...bobBaumeister, role: RoleNames.MODERATOR })

    await signIn('bibi@bloxberg.de')
    const created = await testEnv.mutate({
      mutation: createContribution,
      variables: {
        amount: '100',
        memo: 'Elements and rituals, all of October',
        contributionDate: new Date().toString(),
      },
    })
    contributionId = created.data.createContribution.id

    // Peter asks the member a question.
    await signIn('peter@lustig.de')
    await write(contributionId, 'What part of it is unpaid?', ContributionMessageType.DIALOG)
  })

  afterAll(async () => {
    await testEnv.mutate({ mutation: logout })
    resetToken()
    await cleanDB()
    await testEnv.db.destroy()
  })

  it('tells it once a colleague noted something on the question, and not before', async () => {
    expect(await noteFlag(contributionId)).toBe(false)

    await signIn('bob@baumeister.de')
    await write(
      contributionId,
      'She answered by mail: all unpaid.',
      ContributionMessageType.MODERATOR,
    )

    expect(await noteFlag(contributionId)).toBe(true)
  })

  it('leaves it to the one who asked to end it with a note of their own', async () => {
    await signIn('peter@lustig.de')
    await write(contributionId, 'Read it, thanks.', ContributionMessageType.MODERATOR)

    expect(await noteFlag(contributionId)).toBe(false)
  })

  it("tells the member nothing of it in their own list: notes are the moderation's", async () => {
    await signIn('bob@baumeister.de')
    await write(contributionId, 'One more note.', ContributionMessageType.MODERATOR)
    expect(await noteFlag(contributionId)).toBe(true)

    await signIn('bibi@bloxberg.de')
    const { data, errors } = await testEnv.query({
      query: ownList,
      variables: { pagination: { currentPage: 1, pageSize: 25, order: 'DESC' } },
    })
    expect(errors).toBeUndefined()
    const own = data.listContributions.contributionList.find(
      (row: { id: number }) => row.id === contributionId,
    )
    expect(own).toBeDefined()
    expect(own.colleagueNoteOnQuestion).toBeNull()
  })
})
