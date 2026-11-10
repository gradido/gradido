// AI-GENERATED — not an architecture reference
import {
  ApolloServerTestClient,
  cleanDB,
  resetToken,
  TEST_AVATAR_FULL_BASE64,
  TEST_AVATAR_SMALL_BASE64,
  testEnvironment,
} from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import { AppDatabase, dbUpsertUserKeptPicture, User } from 'database'
import { GraphQLError } from 'graphql'
import { gql } from 'graphql-tag'
import { KEPT_PICTURES_MAX_PER_MEMBER } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { KEPT_PICTURES_MAX_PER_REQUEST } from '@/data/KeptPictures.logic'
import { userFactory } from '@/seeds/factory/user'
import { login, removeKeptPicture, setKeptPicture } from '@/seeds/graphql/mutations'
import { keptPictureFull, keptPictures } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

let bibi: User
let bob: User
let peter: User

// The server encodes what it is sent again, and these two come out as they went in
// (test/helpers.ts), so what is read back can be compared with what was sent. The full rendition
// differs from the small one, or a resolver handing back the wrong column would pass.
const bothPictures = {
  pictureSmall: TEST_AVATAR_SMALL_BASE64,
  pictureFull: TEST_AVATAR_FULL_BASE64,
}

/** user_kept_pictures is a drizzle table, so cleanDB() does not reach it. */
const clearPictures = async (): Promise<void> => {
  await db.getDataSource().query('DELETE FROM user_kept_pictures')
}

const countPictures = async (): Promise<number> => {
  const rows: { n: number | string }[] = await db
    .getDataSource()
    .query('SELECT COUNT(*) AS n FROM user_kept_pictures')
  return Number(rows[0].n)
}

const loginAs = async (email: string): Promise<void> => {
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

const refOf = (user: User) => ({ communityUuid: user.communityUuid, gradidoID: user.gradidoID })

const keep = (user: User): Promise<any> =>
  mutate({ mutation: setKeptPicture, variables: { ref: refOf(user), ...bothPictures } })

const list = async (): Promise<any[]> => {
  const res: any = await query({ query: keptPictures })
  expect(res.errors).toBeUndefined()
  return res.data.keptPictures
}

const full = async (user: User): Promise<string | null> => {
  const res: any = await query({ query: keptPictureFull, variables: { ref: refOf(user) } })
  expect(res.errors).toBeUndefined()
  return res.data.keptPictureFull
}

beforeAll(async () => {
  testEnv = await testEnvironment(logErrorLogger)
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  await clearPictures()

  // bibi keeps the pictures; bob and peter are whom they show.
  bibi = await userFactory(testEnv, bibiBloxberg)
  bob = await userFactory(testEnv, bobBaumeister)
  peter = await userFactory(testEnv, peterLustig)
})

afterAll(async () => {
  await clearPictures()
  await cleanDB()
  await db.destroy()
})

describe('KeptPictureResolver', () => {
  describe('without a login', () => {
    beforeAll(() => resetToken())

    it('answers 401 to every call', async () => {
      const unauthorized = expect.objectContaining({
        errors: [new GraphQLError('401 Unauthorized')],
      })
      expect(await query({ query: keptPictures })).toEqual(unauthorized)
      expect(await query({ query: keptPictureFull, variables: { ref: refOf(bob) } })).toEqual(
        unauthorized,
      )
      expect(await keep(bob)).toEqual(unauthorized)
      expect(await mutate({ mutation: removeKeptPicture, variables: { ref: refOf(bob) } })).toEqual(
        unauthorized,
      )
    })
  })

  describe('signed in', () => {
    beforeAll(async () => {
      await loginAs('bibi@bloxberg.de')
    })

    afterAll(async () => {
      await clearPictures()
      resetToken()
    })

    it('keeps a picture of a person, and gives both renditions back to the member who set it', async () => {
      expect(await list()).toEqual([])
      expect(await full(bob)).toBeNull()

      const res: any = await keep(bob)
      expect(res.errors).toBeUndefined()
      expect(res.data.setKeptPicture).toBe(true)

      expect(await list()).toEqual([
        {
          communityUuid: bob.communityUuid,
          gradidoID: bob.gradidoID,
          picture: TEST_AVATAR_SMALL_BASE64,
        },
      ])
      expect(await full(bob)).toBe(TEST_AVATAR_FULL_BASE64)
    })

    it('finds the same picture where the wallet sends the person without a community, or in capitals', async () => {
      const res: any = await query({
        query: keptPictureFull,
        variables: { ref: { communityUuid: null, gradidoID: bob.gradidoID.toUpperCase() } },
      })
      expect(res.data.keptPictureFull).toBe(TEST_AVATAR_FULL_BASE64)
    })

    it('replaces the picture when it is set again, in one row', async () => {
      await keep(bob)
      expect(await countPictures()).toBe(1)
    })

    it('takes the picture away, and taking it away again is no error', async () => {
      await keep(peter)
      const removed: any = await mutate({
        mutation: removeKeptPicture,
        variables: { ref: refOf(peter) },
      })
      expect(removed.errors).toBeUndefined()
      expect(removed.data.removeKeptPicture).toBe(true)
      expect(await full(peter)).toBeNull()
      const again: any = await mutate({
        mutation: removeKeptPicture,
        variables: { ref: refOf(peter) },
      })
      expect(again.errors).toBeUndefined()
      expect((await list()).map((kept) => kept.gradidoID)).toEqual([bob.gradidoID])
    })

    it('refuses a picture that is no JPEG, and stores nothing', async () => {
      const before = await countPictures()
      const res: any = await mutate({
        mutation: setKeptPicture,
        variables: {
          ref: refOf(peter),
          pictureSmall: 'bm90IGEganBlZw==',
          pictureFull: 'bm90IGEganBlZw==',
        },
      })
      expect(res.errors?.[0]?.message).toBe('Avatar image (small) is not a JPEG')
      expect(await countPictures()).toBe(before)
    })

    // ⛔ A document may repeat a field under any number of aliases (RequestBudget): the list is
    // up to a hundred pictures, and it counts as the whole of a request's budget.
    it('serves the list once in a request, and no more full pictures than the budget allows', async () => {
      const lists: any = await query({
        query: gql`query { a: keptPictures { gradidoID } b: keptPictures { gradidoID } }`,
      })
      expect(lists.errors?.[0]?.message).toBe('Too many kept pictures asked for at once')

      const aliases = Array.from(
        { length: KEPT_PICTURES_MAX_PER_REQUEST + 1 },
        (_, i) => `f${i}: keptPictureFull(ref: $ref)`,
      ).join('\n')
      const fulls: any = await query({
        query: gql`query ($ref: MemberAvatarRefInput!) { ${aliases} }`,
        variables: { ref: refOf(bob) },
      })
      expect(fulls.errors?.[0]?.message).toBe('Too many kept pictures asked for at once')
    })

    it("takes in one picture in a request, counted with the member's own", async () => {
      const res: any = await mutate({
        mutation: gql`
          mutation ($ref: MemberAvatarRefInput!, $pictureSmall: String!, $pictureFull: String!) {
            a: setKeptPicture(ref: $ref, pictureSmall: $pictureSmall, pictureFull: $pictureFull)
            b: setKeptPicture(ref: $ref, pictureSmall: $pictureSmall, pictureFull: $pictureFull)
          }
        `,
        variables: { ref: refOf(peter), ...bothPictures },
      })
      expect(res.errors?.[0]?.message).toBe('Too many avatar images sent at once')
    })

    it('keeps no more people than the limit, and replaces a picture already kept at the limit', async () => {
      await clearPictures()
      // The rows of other people, written straight in: what is counted is the rows, and a hundred
      // pictures through the mutation would each be decoded and encoded again for nothing.
      for (let i = 0; i < KEPT_PICTURES_MAX_PER_MEMBER - 1; i++) {
        await dbUpsertUserKeptPicture({
          userId: bibi.id,
          subjectCommunityUuid: bob.communityUuid.toLowerCase(),
          subjectGradidoId: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
          pictureSmall: Buffer.from('small'),
          pictureFull: Buffer.from('full'),
          mimeType: 'image/jpeg',
        })
      }
      // The hundredth person is still taken.
      expect((await keep(bob)).errors).toBeUndefined()
      expect(await countPictures()).toBe(KEPT_PICTURES_MAX_PER_MEMBER)
      // A hundred and first is not.
      const refused: any = await keep(peter)
      expect(refused.errors?.[0]?.message).toBe('KEPT_PICTURES_FULL')
      expect(await full(peter)).toBeNull()
      // Setting bob's again replaces it: nothing is added.
      expect((await keep(bob)).errors).toBeUndefined()
      expect(await countPictures()).toBe(KEPT_PICTURES_MAX_PER_MEMBER)
    })
  })

  describe('another member', () => {
    beforeAll(async () => {
      await clearPictures()
      await loginAs('bibi@bloxberg.de')
      await keep(peter)
      resetToken()
      await loginAs('bob@baumeister.de')
    })

    afterAll(() => resetToken())

    // ⛔ The rule the whole table rests on: a member reads their own pictures only, and no call
    // names whose pictures to read.
    it("gets no picture of the first member's, on any way", async () => {
      expect(await list()).toEqual([])
      expect(await full(peter)).toBeNull()

      const aliased: any = await query({
        query: gql`
          query ($ref: MemberAvatarRefInput!) {
            a: keptPictureFull(ref: $ref)
            b: keptPictureFull(ref: $ref)
          }
        `,
        variables: { ref: refOf(peter) },
      })
      expect(aliased.errors).toBeUndefined()
      expect(aliased.data).toEqual({ a: null, b: null })
    })

    it('keeps a picture of the same person of their own, beside the first one', async () => {
      await keep(peter)
      expect((await list()).map((kept) => kept.gradidoID)).toEqual([peter.gradidoID])
      expect(await countPictures()).toBe(2)
    })

    it("takes away their own picture only, never the first member's", async () => {
      await mutate({ mutation: removeKeptPicture, variables: { ref: refOf(peter) } })
      expect(await list()).toEqual([])
      expect(await countPictures()).toBe(1)
    })
  })
})
