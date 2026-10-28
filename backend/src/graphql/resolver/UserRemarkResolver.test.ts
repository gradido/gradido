// AI-GENERATED — not an architecture reference
import { RoleNames } from '@enum/RoleNames'
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import { AppDatabase, User, UserRole } from 'database'
import { GraphQLError } from 'graphql'
import { gql } from 'graphql-tag'
import { USER_REMARK_MAX_CHARS } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { USER_REMARKS_MAX_PER_REQUEST } from '@/data/UserRemark.logic'
import { userFactory } from '@/seeds/factory/user'
import { login, setUserRemark } from '@/seeds/graphql/mutations'
import { adminListContributions, userRemark } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'

// The moderation's remark on a member: every moderator reads and writes the same one, the member
// it is about reads nothing. ⛔ Only a request through the schema can see the guard: `@Authorized`
// lives at the GraphQL layer, and a test that calls the resolver's methods would stay green
// without it.

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase

// bibi moderates, peter administrates, bob is a member -- and raeuber the member the remarks are
// about.
let bibi: User
let bob: User
let raeuber: User

/** user_remarks is a drizzle table, so cleanDB() does not reach it -- that one walks the TypeORM entities. */
const clearRemarks = async (): Promise<void> => {
  await db.getDataSource().query('DELETE FROM user_remarks')
}

const countRemarks = async (): Promise<number> => {
  const rows: { n: number | string }[] = await db
    .getDataSource()
    .query('SELECT COUNT(*) AS n FROM user_remarks')
  return Number(rows[0].n)
}

const loginAs = async (email: string): Promise<void> => {
  resetToken()
  const { errors } = await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
  // ⛔ A login that failed leaves the token empty, and an empty token is refused with the very
  // words the refusals below assert.
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

const write = (userId: number, remark: string): Promise<any> =>
  mutate({ mutation: setUserRemark, variables: { userId, remark } })

const read = async (userId: number): Promise<any> => {
  const res: any = await query({ query: userRemark, variables: { userId } })
  expect(res.errors).toBeUndefined()
  return res.data.userRemark
}

const unauthorized = expect.objectContaining({
  errors: [new GraphQLError('401 Unauthorized')],
})

beforeAll(async () => {
  const testEnv = await testEnvironment(logErrorLogger)
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  await clearRemarks()

  bibi = await userFactory(testEnv, bibiBloxberg)
  await setRole(bibi.id, RoleNames.MODERATOR)
  await userFactory(testEnv, peterLustig) // administrator
  bob = await userFactory(testEnv, bobBaumeister)
  raeuber = await userFactory(testEnv, raeuberHotzenplotz)
})

afterAll(async () => {
  await clearRemarks()
  await cleanDB()
  await db.destroy()
})

describe('UserRemarkResolver', () => {
  describe('without a login', () => {
    beforeAll(() => resetToken())

    it('answers 401 to both calls', async () => {
      expect(await query({ query: userRemark, variables: { userId: raeuber.id } })).toEqual(
        unauthorized,
      )
      expect(await write(raeuber.id, 'words')).toEqual(unauthorized)
      expect(await countRemarks()).toBe(0)
    })
  })

  describe('a moderator', () => {
    beforeAll(async () => {
      await loginAs('bibi@bloxberg.de')
    })

    afterAll(async () => {
      await clearRemarks()
      resetToken()
    })

    it('is really logged in and really a moderator', async () => {
      // ⚠️ Logged out and member are refused with the SAME sentence, so a refusal cannot tell
      // them apart. This can: ADMIN_LIST_CONTRIBUTIONS is in MODERATOR_RIGHTS and in no lesser
      // set, so it fails if setRole ever stops taking.
      const { errors } = await query({
        query: adminListContributions,
        variables: { paginated: { pageSize: 1 } },
      })
      expect(errors).toBeUndefined()
    })

    it('keeps a remark on a member, with when and by whom, and reads it back', async () => {
      expect(await read(raeuber.id)).toBeNull()
      const before = Date.now()
      const res: any = await write(raeuber.id, 'Bürgermeisterin von Lieblingsstadt')
      expect(res.errors).toBeUndefined()
      expect(res.data.setUserRemark).toEqual({
        remark: 'Bürgermeisterin von Lieblingsstadt',
        updatedAt: expect.any(String),
        updatedByName: 'Bibi Bloxberg',
      })
      const written = new Date(res.data.setUserRemark.updatedAt).getTime()
      expect(written).toBeGreaterThanOrEqual(before - 1000)
      expect(written).toBeLessThanOrEqual(Date.now() + 1000)
      // What the next moderator reads is what the answer said.
      expect(await read(raeuber.id)).toEqual(res.data.setUserRemark)
    })

    it('takes an emptied remark away, and a remark of whitespace too', async () => {
      const emptied: any = await write(raeuber.id, '')
      expect(emptied.errors).toBeUndefined()
      expect(emptied.data.setUserRemark).toBeNull()
      expect(await read(raeuber.id)).toBeNull()
      expect(await countRemarks()).toBe(0)

      await write(raeuber.id, 'again')
      await write(raeuber.id, '  \n ')
      expect(await read(raeuber.id)).toBeNull()
      expect(await countRemarks()).toBe(0)
    })

    it('keeps a remark as long as one may be, and refuses one a letter longer', async () => {
      const longest = 'x'.repeat(USER_REMARK_MAX_CHARS)
      expect((await write(raeuber.id, longest)).errors).toBeUndefined()
      const res: any = await write(raeuber.id, `${longest}y`)
      expect(res.errors?.[0]?.message).toContain('Argument Validation Error')
      expect((await read(raeuber.id)).remark).toBe(longest)
    })

    it('reads no more remarks in one request than its budget allows', async () => {
      const aliases = (n: number) =>
        Array.from({ length: n }, (_, i) => `r${i}: userRemark(userId: $userId) { remark }`).join(
          '\n',
        )
      const within: any = await query({
        query: gql`query ($userId: Int!) { ${aliases(USER_REMARKS_MAX_PER_REQUEST)} }`,
        variables: { userId: raeuber.id },
      })
      expect(within.errors).toBeUndefined()
      const over: any = await query({
        query: gql`query ($userId: Int!) { ${aliases(USER_REMARKS_MAX_PER_REQUEST + 1)} }`,
        variables: { userId: raeuber.id },
      })
      expect(over.errors?.[0]?.message).toBe('Too many remarks asked for at once')
    })
  })

  describe('every moderator writes on the same remark', () => {
    beforeAll(async () => {
      await clearRemarks()
      await loginAs('bibi@bloxberg.de')
      await write(raeuber.id, 'Tochter von Ramona')
    })

    afterAll(async () => {
      await clearRemarks()
      resetToken()
    })

    it('an administrator reads what the moderator wrote, and writes on it', async () => {
      await loginAs('peter@lustig.de')
      expect((await read(raeuber.id)).remark).toBe('Tochter von Ramona')
      const res: any = await write(raeuber.id, 'Tochter von Ramona, Rentnerin seit Januar 25')
      expect(res.data.setUserRemark.updatedByName).toBe('Peter Lustig')
      expect(await countRemarks()).toBe(1)
    })

    it('a KI-moderator reads it and writes on it just the same', async () => {
      await setRole(bibi.id, RoleNames.MODERATOR_AI)
      try {
        await loginAs('bibi@bloxberg.de')
        expect((await read(raeuber.id)).updatedByName).toBe('Peter Lustig')
        const res: any = await write(raeuber.id, 'Rentnerin seit Januar 25')
        expect(res.errors).toBeUndefined()
        expect((await read(raeuber.id)).remark).toBe('Rentnerin seit Januar 25')
      } finally {
        // ⚠️ In a `finally`, so that the next test does not run as a KI-moderator.
        await setRole(bibi.id, RoleNames.MODERATOR)
      }
    })
  })

  describe('a member', () => {
    beforeAll(async () => {
      await clearRemarks()
      await loginAs('bibi@bloxberg.de')
      await write(bob.id, 'what the moderation keeps about bob')
      await write(raeuber.id, 'what the moderation keeps about raeuber')
      await loginAs('bob@baumeister.de')
    })

    afterAll(async () => {
      await clearRemarks()
      resetToken()
    })

    // The counterpart of the refusals: the remark is there, so a refusal is the guard's.
    it('reads no remark -- not the one about them either', async () => {
      expect(await query({ query: userRemark, variables: { userId: bob.id } })).toEqual(
        unauthorized,
      )
      expect(await query({ query: userRemark, variables: { userId: raeuber.id } })).toEqual(
        unauthorized,
      )
    })

    it('writes no remark, and leaves the remark as it was', async () => {
      expect(await write(raeuber.id, 'bob was here')).toEqual(unauthorized)
      expect(await write(bob.id, '')).toEqual(unauthorized)
      await loginAs('bibi@bloxberg.de')
      expect((await read(raeuber.id)).remark).toBe('what the moderation keeps about raeuber')
      expect((await read(bob.id)).remark).toBe('what the moderation keeps about bob')
    })
  })
})
