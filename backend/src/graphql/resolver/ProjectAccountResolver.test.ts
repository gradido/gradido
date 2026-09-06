// AI-GENERATED — not an architecture reference
import { RoleNames } from '@enum/RoleNames'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { sendCreationRightRequestSupportEmail } from 'core'
import { AppDatabase, Event as DbEvent, User as DbUser } from 'database'
import { GraphQLError } from 'graphql'
import { getLogger as originalGetLogger } from 'log4js'
import { RESTRICTED_FOR_PROJECT_ACCOUNT } from '@/auth/RESTRICTED_FOR_PROJECT_ACCOUNT'
import { RIGHTS } from '@/auth/RIGHTS'
import { USER_RIGHTS } from '@/auth/USER_RIGHTS'
import { EventType } from '@/event/Events'
import { creationFactory } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import {
  adminCreateContribution,
  createContribution,
  createTransactionLink,
  declareProjectAccount,
  login,
  redeemTransactionLink,
  requestCreationRight,
  setCreationAllowed,
  startFirstCreationTest,
  updateContribution,
} from '@/seeds/graphql/mutations'
import {
  firstCreationStatus,
  listContributions,
  openCreations,
  searchUsers,
  verifyLogin,
} from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

// The project account (ES-021) end to end, through the schema: the deny-list is a
// decorator-level thing (isAuthorized), so only a request through the schema can see
// whether it holds - a direct resolver call would pass every guard here.

jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendCreationRightRequestSupportEmail: jest.fn(),
    sendEmailTranslated: jest.fn(),
  }
})
jest.mock('@/password/EncryptorUtils')

const supportMail = sendCreationRightRequestSupportEmail as jest.Mock

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

let bibi: DbUser
let raeuber: DbUser

const UNAUTHORIZED = [new GraphQLError('401 Unauthorized')]

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  const { errors } = await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
  // A failed login leaves the token empty, and an empty token answers every guarded call
  // with `401 Unauthorized` - the very words most tests below assert.
  expect(errors).toBeUndefined()
}

const eventsOf = (type: EventType, user: DbUser) =>
  DbEvent.find({ where: { type, affectedUserId: user.id }, order: { id: 'ASC' } })

const creationAllowedOf = async (user: DbUser): Promise<boolean> =>
  (await DbUser.findOneByOrFail({ id: user.id })).creationAllowed

const ageEvent = async (id: number, hoursAgo: number) => {
  const then = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
  await db.getDataSource().query('UPDATE events SET created_at = ? WHERE id = ?', [then, id])
}

const contributionArgs = () => ({
  amount: '100',
  memo: 'Kuchen fuer das Gemeindefest gebacken',
  contributionDate: new Date().toISOString(),
})

beforeAll(async () => {
  testEnv = await testEnvironment(originalGetLogger('apollo'))
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  await userFactory(testEnv, peterLustig)
  bibi = await userFactory(testEnv, bibiBloxberg)
  await userFactory(testEnv, { ...bobBaumeister, role: RoleNames.MODERATOR })
  raeuber = await userFactory(testEnv, raeuberHotzenplotz)
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
})

beforeEach(() => {
  // What sendEmailTranslated answers when the transport took the mail.
  supportMail.mockReset().mockResolvedValue({ messageId: 'accepted' })
})

describe('the deny-list itself', () => {
  it('names exactly the four creation rights, and every one of them is a member right', () => {
    expect(RESTRICTED_FOR_PROJECT_ACCOUNT).toEqual([
      RIGHTS.CREATE_CONTRIBUTION,
      RIGHTS.UPDATE_CONTRIBUTION,
      RIGHTS.FIRST_CREATION,
      RIGHTS.OPEN_CREATIONS,
    ])
    for (const right of RESTRICTED_FOR_PROJECT_ACCOUNT) {
      expect(USER_RIGHTS).toContain(right)
    }
    // The way back must stay open to the locked-out account.
    expect(RESTRICTED_FOR_PROJECT_ACCOUNT).not.toContain(RIGHTS.REQUEST_CREATION_RIGHT)
    expect(RESTRICTED_FOR_PROJECT_ACCOUNT).not.toContain(RIGHTS.REDEEM_TRANSACTION_LINK)
  })
})

describe('every existing account is a person who may create', () => {
  it('starts with creation allowed, and verifyLogin says so', async () => {
    expect(await creationAllowedOf(bibi)).toBe(true)
    await loginAs('bibi@bloxberg.de')
    const { data } = await query({ query: verifyLogin })
    expect(data.verifyLogin.creationAllowed).toBe(true)
  })

  it('refuses to ask for a right the account already holds', async () => {
    await loginAs('bibi@bloxberg.de')
    const { errors } = await mutate({ mutation: requestCreationRight })
    expect(errors).toEqual([new GraphQLError('CREATION_RIGHT_REQUEST_REFUSED: ALREADY_ALLOWED')])
    expect(supportMail).not.toHaveBeenCalled()
  })
})

describe('declaring a project account', () => {
  it('is refused while the account has open contributions', async () => {
    await creationFactory(testEnv, {
      email: 'raeuber@hotzenplotz.de',
      amount: 50,
      memo: 'Im Wald aufgeraeumt und Holz gesammelt',
      contributionDate: new Date().toISOString(),
      confirmed: false,
    })
    await loginAs('raeuber@hotzenplotz.de')
    const { errors } = await mutate({ mutation: declareProjectAccount })
    expect(errors).toEqual([new GraphQLError('PROJECT_ACCOUNT_REFUSED: OPEN_CONTRIBUTIONS')])
    expect(await creationAllowedOf(raeuber)).toBe(true)
    expect(await eventsOf(EventType.PROJECT_ACCOUNT_DECLARE, raeuber)).toHaveLength(0)
  })

  it('switches creation off at once, with an event', async () => {
    await loginAs('bibi@bloxberg.de')
    const { data, errors } = await mutate({ mutation: declareProjectAccount })
    expect(errors).toBeUndefined()
    expect(data.declareProjectAccount).toBe(true)
    expect(await creationAllowedOf(bibi)).toBe(false)
    expect(await eventsOf(EventType.PROJECT_ACCOUNT_DECLARE, bibi)).toHaveLength(1)
  })

  it('declaring it twice moves nothing and records nothing twice', async () => {
    await loginAs('bibi@bloxberg.de')
    const { data } = await mutate({ mutation: declareProjectAccount })
    expect(data.declareProjectAccount).toBe(true)
    expect(await eventsOf(EventType.PROJECT_ACCOUNT_DECLARE, bibi)).toHaveLength(1)
  })
})

describe('what a project account may not do', () => {
  beforeEach(async () => {
    await loginAs('bibi@bloxberg.de')
  })

  it('may not file a contribution', async () => {
    const { errors } = await mutate({
      mutation: createContribution,
      variables: contributionArgs(),
    })
    expect(errors).toEqual(UNAUTHORIZED)
  })

  it('may not edit one either', async () => {
    const { errors } = await mutate({
      mutation: updateContribution,
      variables: { contributionId: 1, ...contributionArgs() },
    })
    expect(errors).toEqual(UNAUTHORIZED)
  })

  it('has no first-creation window - the status query itself is refused', async () => {
    const { errors } = await query({ query: firstCreationStatus })
    expect(errors).toEqual(UNAUTHORIZED)
  })

  it('is not shown a quota it can never spend', async () => {
    const { errors } = await query({ query: openCreations })
    expect(errors).toEqual(UNAUTHORIZED)
  })

  it('may not redeem a contribution link - the one redeem branch that files a creation', async () => {
    const { errors } = await mutate({
      mutation: redeemTransactionLink,
      variables: { code: 'CL-does-not-matter' },
    })
    // Refused for the KIND of account, before the code is even looked up.
    expect(errors).toEqual([new GraphQLError('CREATION_NOT_ALLOWED')])
  })

  it('and a moderator may not file one on its behalf', async () => {
    await loginAs('peter@lustig.de')
    const { errors } = await mutate({
      mutation: adminCreateContribution,
      variables: {
        email: 'bibi@bloxberg.de',
        amount: '100',
        memo: 'Von der Moderation eingetragen',
        creationDate: new Date().toISOString(),
      },
    })
    expect(errors).toEqual([new GraphQLError('CREATION_NOT_ALLOWED')])
  })
})

describe('what a project account keeps', () => {
  beforeEach(async () => {
    await loginAs('bibi@bloxberg.de')
  })

  it('still signs in and reads its own state', async () => {
    const { data, errors } = await query({ query: verifyLogin })
    expect(errors).toBeUndefined()
    expect(data.verifyLogin.creationAllowed).toBe(false)
  })

  it('still lists its contributions', async () => {
    const { errors } = await query({
      query: listContributions,
      variables: { pagination: { currentPage: 1, pageSize: 5, order: 'DESC' } },
    })
    expect(errors).toBeUndefined()
  })

  it('still redeems a plain transfer link - refused for the code, not for the account', async () => {
    const { errors } = await mutate({
      mutation: redeemTransactionLink,
      variables: { code: 'no-such-transfer-link' },
    })
    expect(errors).toBeDefined()
    expect(errors).not.toEqual(UNAUTHORIZED)
    expect(errors).not.toEqual([new GraphQLError('CREATION_NOT_ALLOWED')])
  })

  it('still reaches the sending side - refused for the balance, not for the account', async () => {
    const { errors } = await mutate({
      mutation: createTransactionLink,
      variables: { amount: '10', memo: 'Danke fuer den Kuchen' },
    })
    expect(errors).toEqual([new GraphQLError('User has not enough GDD')])
  })
})

describe('asking for the creation right back', () => {
  let firstRequestEventId: number

  it('records nothing and blocks nobody when the transport does not take the mail', async () => {
    // null is what sendEmailTranslated answers with mail switched off, undefined what it
    // answers when the send was rejected.
    supportMail.mockResolvedValueOnce(null)
    await loginAs('bibi@bloxberg.de')
    const { errors } = await mutate({ mutation: requestCreationRight })
    expect(errors).toEqual([new GraphQLError('CREATION_RIGHT_REQUEST_REFUSED: MAIL_FAILED')])
    expect(await eventsOf(EventType.CREATION_RIGHT_REQUEST, bibi)).toHaveLength(0)
  })

  it('sends the support one mail, with the two moments, and records the request', async () => {
    await loginAs('bibi@bloxberg.de')
    const { data, errors } = await mutate({ mutation: requestCreationRight })
    expect(errors).toBeUndefined()
    expect(data.requestCreationRight).toBe(true)
    const requests = await eventsOf(EventType.CREATION_RIGHT_REQUEST, bibi)
    expect(requests).toHaveLength(1)
    firstRequestEventId = requests[0].id
    const [declared] = await eventsOf(EventType.PROJECT_ACCOUNT_DECLARE, bibi)
    expect(supportMail).toHaveBeenCalledTimes(1)
    expect(supportMail).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'en',
        alias: bibi.alias,
        gradidoId: bibi.gradidoID,
        memberEmail: 'bibi@bloxberg.de',
        declaredAt: declared.createdAt,
        requestedAt: expect.any(Date),
      }),
    )
    // Asking changes nothing: the switch is the administrator's.
    expect(await creationAllowedOf(bibi)).toBe(false)
  })

  it('refuses a second request within a day, and sends no second mail', async () => {
    await loginAs('bibi@bloxberg.de')
    const { errors } = await mutate({ mutation: requestCreationRight })
    expect(errors).toEqual([new GraphQLError('CREATION_RIGHT_REQUEST_REFUSED: RATE_LIMITED')])
    expect(supportMail).not.toHaveBeenCalled()
    expect(await eventsOf(EventType.CREATION_RIGHT_REQUEST, bibi)).toHaveLength(1)
  })

  it('accepts one again once a day has passed', async () => {
    await ageEvent(firstRequestEventId, 25)
    await loginAs('bibi@bloxberg.de')
    const { data, errors } = await mutate({ mutation: requestCreationRight })
    expect(errors).toBeUndefined()
    expect(data.requestCreationRight).toBe(true)
    expect(supportMail).toHaveBeenCalledTimes(1)
    expect(await eventsOf(EventType.CREATION_RIGHT_REQUEST, bibi)).toHaveLength(2)
  })
})

describe("the administrator's switch", () => {
  it('is refused to a moderator', async () => {
    await loginAs('bob@baumeister.de')
    const { errors } = await mutate({
      mutation: setCreationAllowed,
      variables: { userId: bibi.id, allowed: true },
    })
    expect(errors).toEqual(UNAUTHORIZED)
    expect(await creationAllowedOf(bibi)).toBe(false)
  })

  it('is refused to the member themselves', async () => {
    await loginAs('bibi@bloxberg.de')
    const { errors } = await mutate({
      mutation: setCreationAllowed,
      variables: { userId: bibi.id, allowed: true },
    })
    expect(errors).toEqual(UNAUTHORIZED)
  })

  it('reports an id nobody has', async () => {
    await loginAs('peter@lustig.de')
    const { errors } = await mutate({
      mutation: setCreationAllowed,
      variables: { userId: 424242, allowed: true },
    })
    expect(errors).toEqual([new GraphQLError('Could not find user with given ID')])
  })

  it('gives the right back, with an event, and the account creates again', async () => {
    await loginAs('peter@lustig.de')
    const { data, errors } = await mutate({
      mutation: setCreationAllowed,
      variables: { userId: bibi.id, allowed: true },
    })
    expect(errors).toBeUndefined()
    expect(data.setCreationAllowed).toBe(true)
    expect(await creationAllowedOf(bibi)).toBe(true)
    expect(await eventsOf(EventType.ADMIN_USER_CREATION_ALLOWED_SET, bibi)).toHaveLength(1)

    await loginAs('bibi@bloxberg.de')
    const filed = await mutate({ mutation: createContribution, variables: contributionArgs() })
    expect(filed.errors).toBeUndefined()
    const status = await query({ query: firstCreationStatus })
    expect(status.errors).toBeUndefined()
  })

  it('takes the right away as well, and the admin list shows where the switch stands', async () => {
    await loginAs('peter@lustig.de')
    const off = await mutate({
      mutation: setCreationAllowed,
      variables: { userId: raeuber.id, allowed: false },
    })
    expect(off.errors).toBeUndefined()
    expect(off.data.setCreationAllowed).toBe(false)
    expect(await creationAllowedOf(raeuber)).toBe(false)
    expect(await eventsOf(EventType.ADMIN_USER_CREATION_ALLOWED_SET, raeuber)).toHaveLength(1)

    const { data } = await query({
      query: searchUsers,
      variables: { query: '', currentPage: 1, pageSize: 25 },
    })
    const byEmail = new Map(
      data.searchUsers.userList.map((row: { email: string; creationAllowed: boolean }) => [
        row.email,
        row.creationAllowed,
      ]),
    )
    expect(byEmail.get('raeuber@hotzenplotz.de')).toBe(false)
    expect(byEmail.get('bibi@bloxberg.de')).toBe(true)
  })
})

describe('the function test and a project account (ES-014 meets ES-021)', () => {
  // FUNCTION_TESTS is not on the deny-list, so an administrator who declared their OWN
  // account a project account still reaches the button - and a forced row alone would open
  // no window. Refused before the row is written, like the signer and the quota.
  it('refuses to reopen the window for an administrator who runs a project account', async () => {
    await loginAs('peter@lustig.de')
    const declared = await mutate({ mutation: declareProjectAccount })
    expect(declared.errors).toBeUndefined()
    const { errors } = await mutate({
      mutation: startFirstCreationTest,
      variables: { withBooking: false },
    })
    expect(errors).toEqual([new GraphQLError('FIRST_CREATION_TEST_REFUSED: PROJECT_ACCOUNT')])
  })
})
