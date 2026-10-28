// AI-GENERATED — not an architecture reference
import { RoleNames } from '@enum/RoleNames'
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { AppDatabase, User, UserRole } from 'database'
import { gql } from 'graphql-tag'
import { getLogger as originalGetLogger } from 'log4js'
import { AnthropicClient } from '@/apis/anthropic/AnthropicClient'
import { userFactory } from '@/seeds/factory/user'
import { login, setUserRemark } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

// Crea reads the moderation's remark on the member (Bernd, 28.10.2026): the backend fetches it by
// the member's id, writes the member's names out of it and hands it to the client with the
// contributions. ⛔ Through the schema, as the admin interface asks: the id comes in the input,
// the remark never does. The API itself is a fake that records what it was given.

let mutate: ApolloServerTestClient['mutate']
let db: AppDatabase

// bibi is a KI-moderator and asks Crea; raeuber is the member the remark is about; bob a member
// without one.
let raeuber: User
let bob: User

const fake = {
  evaluateContribution: jest.fn(),
  rewriteResponse: jest.fn(),
  evaluateBatch: jest.fn(),
  rewriteBatch: jest.fn(),
}

const EVALUATION = {
  beitragRef: '1',
  overallVerdict: 'confirm',
  discrepancy: 'none',
  appliedRule: 'confirm_retiree_unconditional',
  confidence: 'high',
  reasoning: 'r',
  responseText: 'x',
  defaultSalutation: 'Hallo',
  activities: [],
  openPoints: [],
  flags: [],
}

const evaluateContribution = gql`
  mutation ($input: CreaContributionInput!) {
    creaEvaluateContribution(input: $input) {
      overallVerdict
    }
  }
`
const rewriteResponse = gql`
  mutation ($input: CreaContributionInput!) {
    creaRewriteResponse(input: $input) {
      responseText
    }
  }
`
const evaluateBatch = gql`
  mutation ($input: CreaBatchInput!) {
    creaEvaluateBatch(input: $input) {
      overallVerdict
    }
  }
`
const rewriteBatch = gql`
  mutation ($input: CreaBatchInput!) {
    creaRewriteBatch(input: $input) {
      responseText
    }
  }
`

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  const { errors } = await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
  // ⛔ A login that failed leaves the token empty, and every call below would be refused.
  expect(errors).toBeUndefined()
}

const setRole = async (userId: number, role: RoleNames): Promise<void> => {
  const existing = await UserRole.findOne({ where: { userId } })
  const entry = existing ?? UserRole.create()
  entry.createdAt = entry.createdAt ?? new Date()
  entry.userId = userId
  entry.role = role
  await entry.save()
}

beforeAll(async () => {
  const testEnv = await testEnvironment(originalGetLogger('apollo'))
  mutate = testEnv.mutate
  db = testEnv.db
  await cleanDB()
  await db.getDataSource().query('DELETE FROM user_remarks')
  const bibi = await userFactory(testEnv, bibiBloxberg)
  await setRole(bibi.id, RoleNames.MODERATOR_AI)
  raeuber = await userFactory(testEnv, raeuberHotzenplotz)
  bob = await userFactory(testEnv, bobBaumeister)
  await loginAs('bibi@bloxberg.de')
  const { errors } = await mutate({
    mutation: setUserRemark,
    variables: {
      userId: raeuber.id,
      remark: 'Hotzenplotz ist Rentner seit Januar 2025. Sohn von Ramona.',
    },
  })
  expect(errors).toBeUndefined()
  jest.spyOn(AnthropicClient, 'getInstance').mockReturnValue(fake as unknown as AnthropicClient)
})

afterAll(async () => {
  jest.restoreAllMocks()
  await db.getDataSource().query('DELETE FROM user_remarks')
  await cleanDB()
  await db.destroy()
})

beforeEach(() => {
  fake.evaluateContribution.mockResolvedValue(EVALUATION)
  fake.evaluateBatch.mockResolvedValue(EVALUATION)
  fake.rewriteResponse.mockResolvedValue({ responseText: 'x', memoSupplement: null })
  fake.rewriteBatch.mockResolvedValue({ responseText: 'x', memoSupplement: null })
})

afterEach(() => {
  jest.clearAllMocks()
})

const MASKED = '[MITGLIED] ist Rentner seit Januar 2025. Sohn von Ramona.'

const CALLS = [
  [
    'creaEvaluateContribution',
    evaluateContribution,
    fake.evaluateContribution,
    { text: 'Vorlesen' },
  ],
  [
    'creaRewriteResponse',
    rewriteResponse,
    fake.rewriteResponse,
    { text: 'Vorlesen', moderatorDecision: 'confirm' },
  ],
  [
    'creaEvaluateBatch',
    evaluateBatch,
    fake.evaluateBatch,
    { contributions: [{ text: 'Vorlesen' }] },
  ],
  [
    'creaRewriteBatch',
    rewriteBatch,
    fake.rewriteBatch,
    { contributions: [{ text: 'Vorlesen' }], moderatorDecision: 'confirm' },
  ],
] as const

describe.each(CALLS)('%s', (_name, document, method, input) => {
  it("hands Crea the remark on the member, the member's names written out of it", async () => {
    const res = await mutate({
      mutation: document,
      variables: { input: { ...input, userId: raeuber.id } },
    })
    expect(res.errors).toBeUndefined()
    expect(method).toHaveBeenCalledWith(expect.objectContaining({ userId: raeuber.id }), MASKED)
  })

  it('hands Crea no remark where the moderation keeps none', async () => {
    const res = await mutate({
      mutation: document,
      variables: { input: { ...input, userId: bob.id } },
    })
    expect(res.errors).toBeUndefined()
    expect(method).toHaveBeenCalledWith(expect.anything(), null)
  })

  it('hands Crea no remark where the admin interface names no member', async () => {
    const res = await mutate({ mutation: document, variables: { input } })
    expect(res.errors).toBeUndefined()
    expect(method).toHaveBeenCalledWith(expect.anything(), null)
  })
})
