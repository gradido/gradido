// AI-GENERATED — not an architecture reference
import { ApolloServerTestClient, cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { getLogger } from 'config-schema/test/testSetup'
import { AppDatabase, User } from 'database'
import { GraphQLError } from 'graphql'
import { gql } from 'graphql-tag'
import { MESSAGE_MAX_CHARS } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { USER_NOTES_MAX_PER_REQUEST } from '@/data/UserNote.logic'
import { userFactory } from '@/seeds/factory/user'
import { login, setUserNote } from '@/seeds/graphql/mutations'
import { userNote } from '@/seeds/graphql/queries'
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

let bob: User
let peter: User

// A group is named by its uuid alone; no group has to exist for a note on it.
const CAFE = 'cafecafe-cafe-4afe-8afe-cafecafecafe'

/** user_notes is a drizzle table, so cleanDB() does not reach it -- that one walks the TypeORM entities. */
const clearNotes = async (): Promise<void> => {
  await db.getDataSource().query('DELETE FROM user_notes')
}

const countNotes = async (): Promise<number> => {
  const rows: { n: number | string }[] = await db
    .getDataSource()
    .query('SELECT COUNT(*) AS n FROM user_notes')
  return Number(rows[0].n)
}

const loginAs = async (email: string): Promise<void> => {
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

const aboutMember = (user: User) => ({
  member: { communityUuid: user.communityUuid, gradidoID: user.gradidoID },
})

const write = (about: unknown, note: string): Promise<any> =>
  mutate({ mutation: setUserNote, variables: { about, note } })

const read = async (about: unknown): Promise<string | null> => {
  const res: any = await query({ query: userNote, variables: { about } })
  expect(res.errors).toBeUndefined()
  return res.data.userNote
}

beforeAll(async () => {
  testEnv = await testEnvironment(logErrorLogger)
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  await clearNotes()

  // bibi writes the notes; bob and peter are whom they are about.
  await userFactory(testEnv, bibiBloxberg)
  bob = await userFactory(testEnv, bobBaumeister)
  peter = await userFactory(testEnv, peterLustig)
})

afterAll(async () => {
  await clearNotes()
  await cleanDB()
  await db.destroy()
})

describe('UserNoteResolver', () => {
  describe('without a login', () => {
    beforeAll(() => resetToken())

    it('answers 401 to both calls', async () => {
      const unauthorized = expect.objectContaining({
        errors: [new GraphQLError('401 Unauthorized')],
      })
      expect(await query({ query: userNote, variables: { about: aboutMember(bob) } })).toEqual(
        unauthorized,
      )
      expect(await write(aboutMember(bob), 'words')).toEqual(unauthorized)
    })
  })

  describe('signed in', () => {
    beforeAll(async () => {
      await loginAs('bibi@bloxberg.de')
    })

    afterAll(async () => {
      await clearNotes()
      resetToken()
    })

    it('keeps a note on a person, and gives it back to the member who wrote it', async () => {
      expect(await read(aboutMember(bob))).toBeNull()
      const res: any = await write(aboutMember(bob), 'Bob Baumeister, baut Bänke.')
      expect(res.errors).toBeUndefined()
      expect(res.data.setUserNote).toBe(true)
      expect(await read(aboutMember(bob))).toBe('Bob Baumeister, baut Bänke.')
    })

    it('finds the same note where the wallet sends the person without a community', async () => {
      // A member ref without a community is this community (resolveCommunityUuid).
      expect(await read({ member: { communityUuid: null, gradidoID: bob.gradidoID } })).toBe(
        'Bob Baumeister, baut Bänke.',
      )
    })

    it('keeps a note on a group, however a link spells its uuid', async () => {
      await write({ groupUuid: CAFE }, 'Jeden ersten Samstag im Café.')
      expect(await read({ groupUuid: CAFE.toUpperCase() })).toBe('Jeden ersten Samstag im Café.')
    })

    it('takes an emptied note away, and a note of whitespace too', async () => {
      await write(aboutMember(peter), 'Peter, the one with the hat')
      const notesBefore = await countNotes()
      await write(aboutMember(peter), '')
      expect(await read(aboutMember(peter))).toBeNull()
      expect(await countNotes()).toBe(notesBefore - 1)

      await write(aboutMember(peter), 'again')
      await write(aboutMember(peter), '  \n ')
      expect(await read(aboutMember(peter))).toBeNull()
      expect(await countNotes()).toBe(notesBefore - 1)
    })

    it('refuses a note longer than a chat message may be', async () => {
      const res: any = await write(aboutMember(bob), 'x'.repeat(MESSAGE_MAX_CHARS + 1))
      expect(res.errors?.[0]?.message).toContain('Argument Validation Error')
      expect(await read(aboutMember(bob))).toBe('Bob Baumeister, baut Bänke.')
    })

    it('refuses a note that does not say whom it is about', async () => {
      const both: any = await write({ ...aboutMember(bob), groupUuid: CAFE }, 'words')
      expect(both.errors?.[0]?.message).toBe('A note is about one member or one group')
      const neither: any = await write({}, 'words')
      expect(neither.errors?.[0]?.message).toBe('A note is about one member or one group')
    })

    it('reads no more notes in one request than its budget allows', async () => {
      const aliases = Array.from(
        { length: USER_NOTES_MAX_PER_REQUEST + 1 },
        (_, i) => `n${i}: userNote(about: $about)`,
      ).join('\n')
      const res: any = await query({
        query: gql`query ($about: UserNoteSubjectInput!) { ${aliases} }`,
        variables: { about: aboutMember(bob) },
      })
      expect(res.errors?.[0]?.message).toBe('Too many notes asked for at once')
    })
  })

  describe('another member', () => {
    beforeAll(async () => {
      await clearNotes()
      await loginAs('bibi@bloxberg.de')
      await write(aboutMember(peter), 'what bibi keeps about peter')
      resetToken()
      await loginAs('bob@baumeister.de')
    })

    afterAll(() => resetToken())

    it('reads no note but their own on the same person', async () => {
      expect(await read(aboutMember(peter))).toBeNull()
      await write(aboutMember(peter), 'what bob keeps about peter')
      expect(await read(aboutMember(peter))).toBe('what bob keeps about peter')
      expect(await countNotes()).toBe(2)
    })
  })
})
