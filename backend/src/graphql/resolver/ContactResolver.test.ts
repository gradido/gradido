// AI-GENERATED — not an architecture reference
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import { AppDatabase, foreignReceive, transferGradidos, User } from 'database'
import { GraphQLError } from 'graphql'
import { GradidoUnit } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { userFactory } from '@/seeds/factory/user'
import { addFavorite, login, removeFavorite } from '@/seeds/graphql/mutations'
import { contactList, favoriteList } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

jest.mock('@/password/EncryptorUtils')

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

const day = (n: number): Date => new Date(Date.UTC(2026, 7, n, 12, 0, 0))

const FOREIGN_COMMUNITY = '99999999-9999-9999-9999-999999999999'
const ANNA = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'

/**
 * A member of another community whose stored name is a pre-alias-era "First Last" -- the
 * shape the X-Com path wrote before 9caba44a6.
 */
const anna = { communityUuid: FOREIGN_COMMUNITY, gradidoID: ANNA, name: 'Anna Müller' }

/**
 * user_favorites is a drizzle table, so cleanDB() does not reach it — that one walks
 * the TypeORM entities. Raw SQL over the existing connection, as the matching test does.
 */
const clearFavorites = async (): Promise<void> => {
  await db.getDataSource().query('DELETE FROM user_favorites')
}

const loginAs = async (email: string): Promise<void> => {
  await mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })
}

const ref = (user: User) => ({ communityUuid: user.communityUuid, gradidoID: user.gradidoID })

beforeAll(async () => {
  testEnv = await testEnvironment(logErrorLogger)
  mutate = testEnv.mutate
  query = testEnv.query
  db = testEnv.db
  await cleanDB()
  await clearFavorites()

  bibi = await userFactory(testEnv, bibiBloxberg)
  bob = await userFactory(testEnv, bobBaumeister)
  peter = await userFactory(testEnv, peterLustig)

  // Bookings straight into the ledger: the contact list is a view on them, and this test
  // is about the view, not about sending. Two with bob, one with peter, peter's newer.
  //
  // ⚠️ In date order, and it has to be: a seeded booking takes its balance from the
  // member's last one and computes the decay between the two dates, which does not run
  // backwards. The oldest goes first.
  await foreignReceive(bibi, anna, day(0))
  await transferGradidos(bibi, bob, new GradidoUnit(100000n), 'one', day(1))
  await transferGradidos(bob, bibi, new GradidoUnit(20000n), 'two', day(2))
  await transferGradidos(bibi, peter, new GradidoUnit(30000n), 'three', day(3))
})

afterAll(async () => {
  await clearFavorites()
  await cleanDB()
  await db.destroy()
})

describe('ContactResolver', () => {
  describe('without a login', () => {
    beforeAll(() => resetToken())

    it('answers 401 to every call', async () => {
      const unauthorized = expect.objectContaining({
        errors: [new GraphQLError('401 Unauthorized')],
      })
      expect(await query({ query: contactList })).toEqual(unauthorized)
      expect(await query({ query: favoriteList })).toEqual(unauthorized)
      expect(await mutate({ mutation: addFavorite, variables: { ref: ref(bob) } })).toEqual(
        unauthorized,
      )
      expect(await mutate({ mutation: removeFavorite, variables: { ref: ref(bob) } })).toEqual(
        unauthorized,
      )
    })
  })

  describe('as bibi', () => {
    beforeAll(async () => {
      await loginAs('bibi@bloxberg.de')
    })

    it('lists each counterparty once, newest first, without a real name', async () => {
      const res: any = await query({ query: contactList })
      expect(res.errors).toBeUndefined()
      const list = res.data.contactList
      expect(list.count).toBe(3)
      expect(list.contacts.map((c: any) => c.user.gradidoID)).toEqual([
        peter.gradidoID,
        bob.gradidoID,
        ANNA,
      ])
      const bobRow = list.contacts[1]
      expect(bobRow).toMatchObject({ bookings: 2, favorite: false })
      expect(bobRow.user.alias).toBe('MeisterBob')
      expect(bobRow.user.communityUuid).toBe(bob.communityUuid)
      // NU-019: the real name never reaches another member, not through this list either.
      expect(bobRow.user.firstName).toBeNull()
      expect(bobRow.user.lastName).toBeNull()
      expect(new Date(bobRow.firstAt).getTime()).toBe(day(1).getTime())
      expect(new Date(bobRow.lastAt).getTime()).toBe(day(2).getTime())
    })

    it('searches the alias and counts only the matches', async () => {
      const res: any = await query({ query: contactList, variables: { search: 'meister' } })
      expect(res.data.contactList.count).toBe(1)
      expect(res.data.contactList.contacts[0].user.gradidoID).toBe(bob.gradidoID)
    })

    /**
     * ⛔ The uuid decides, not the presence of a `users` row and not the community name.
     * The wallet asks this to know whether it may build the member's Gradido address --
     * `host/u/alias`, where the host is THEIR community's -- so a wrong yes puts a wrong
     * address in front of somebody, which is worse than no address at all.
     */
    it('says who belongs to this community and who does not', async () => {
      const res: any = await query({ query: contactList })
      const byId = Object.fromEntries(
        res.data.contactList.contacts.map((c: any) => [c.user.gradidoID, c]),
      )

      expect(byId[bob.gradidoID].homeCommunity).toBe(true)
      expect(byId[bob.gradidoID].user.communityName).not.toBeNull()
      // Anna's booking carries another community's uuid and no users row of her own.
      expect(byId[ANNA].homeCommunity).toBe(false)
    })

    /**
     * ⛔ A `users` row is not proof of belonging here: the federation stores foreign
     * members as rows too. Before this the list called such a contact a member of THIS
     * community and named them after it -- the wallet would then have printed our host in
     * their address.
     */
    /**
     * ⛔ The row's own `foreign` column decides, and it decides BEFORE the home uuid is
     * stood in for. A set `linked_user_id` is not proof of belonging here: the federation
     * stores foreign members as `users` rows too, and the contact query joins on that id
     * without asking.
     *
     * ⚠️ Only ONE shape is exercised, and that is a measurement rather than an omission. A
     * first version of this test also drove a foreign row with a NULL `community_uuid`,
     * reasoning that migration 0129 fills `foreign = 0` rows only -- but no writer produces
     * that state: both `core/graphql/logic/storeForeignUser` and
     * `federation/graphql/api/1_0/util/storeForeignUser` assign the uuid, and the first is
     * guarded on `communityUuid !== null` before it even builds the row. The fixture was
     * inventing a state the real path does not allow, and the list's pre-existing rule for
     * a contact without a uuid -- leave it out rather than null the whole answer -- then
     * made the row vanish and the test read `undefined`.
     */
    it('does not call a foreign member local just because they have a users row', async () => {
      await db
        .getDataSource()
        .query('UPDATE users SET `foreign` = 1, community_uuid = ? WHERE id = ?', [
          FOREIGN_COMMUNITY,
          bob.id,
        ])
      try {
        const res: any = await query({ query: contactList })
        const bobRow = res.data.contactList.contacts.find(
          (c: any) => c.user.gradidoID === bob.gradidoID,
        )

        expect(bobRow.homeCommunity).toBe(false)
        // ⛔ And never named after THIS community. Whether their own name can be found is
        // the federation's business; claiming ours for them is what puts a wrong address
        // in front of a member.
        //
        // Compared against a genuine local contact in the SAME answer, so the assertion
        // proves itself: if bob were named after this community the two would match, and
        // the check does not depend on what the seed happens to call the community.
        const localRow = res.data.contactList.contacts.find(
          (c: any) => c.user.gradidoID === peter.gradidoID,
        )
        expect(localRow.homeCommunity).toBe(true)
        expect(localRow.user.communityName).not.toBeNull()
        expect(bobRow.user.communityName).not.toBe(localRow.user.communityName)
      } finally {
        // ⚠️ Restored even when the expectations above fail: the tests after this one read
        // the same row, and a leaked flag would fail them for a reason nothing states.
        await db
          .getDataSource()
          .query('UPDATE users SET `foreign` = 0, community_uuid = ? WHERE id = ?', [
            bibi.communityUuid,
            bob.id,
          ])
      }
    })

    it('names a foreign member by nothing when her stored name is a real name (NU-019)', async () => {
      const res: any = await query({ query: contactList })
      const anna = res.data.contactList.contacts.find((c: any) => c.user.gradidoID === ANNA)
      expect(anna.user).toMatchObject({
        communityUuid: FOREIGN_COMMUNITY,
        alias: null,
        firstName: null,
        lastName: null,
      })
      // And the search is no oracle on what the row does not show.
      const probe: any = await query({ query: contactList, variables: { search: 'müll' } })
      expect(probe.data.contactList.count).toBe(0)
    })

    it('pages', async () => {
      const res: any = await query({
        query: contactList,
        variables: { currentPage: 2, pageSize: 1 },
      })
      expect(res.data.contactList.count).toBe(3)
      expect(res.data.contactList.contacts).toHaveLength(1)
      expect(res.data.contactList.contacts[0].user.gradidoID).toBe(bob.gradidoID)
    })

    // The house pagination arguments validate themselves (@IsPositive on Paginated). The
    // message is pinned, not just the presence of an error: a lost login or a database
    // fault would satisfy "some error" and leave the guard untested.
    it('refuses a page that is not a page', async () => {
      const res: any = await query({ query: contactList, variables: { currentPage: 0 } })
      expect(res.errors?.[0]?.message).toContain('Argument Validation Error')
    })

    it('stands in with the home community for a member whose row carries no uuid', async () => {
      // A member registered before the home community had a uuid: the row says null. The
      // list must still answer -- the field is non-null in the schema -- and name the pair
      // the favourite will be stored under.
      await db
        .getDataSource()
        .query('UPDATE users SET community_uuid = NULL WHERE id = ?', [peter.id])
      const res: any = await query({ query: contactList })
      expect(res.errors).toBeUndefined()
      const peterRow = res.data.contactList.contacts.find(
        (c: any) => c.user.gradidoID === peter.gradidoID,
      )
      expect(peterRow.user.communityUuid).toBe(bibi.communityUuid)
    })

    it('starts with no favourites', async () => {
      const res: any = await query({ query: favoriteList })
      expect(res.data.favoriteList).toEqual([])
    })

    it('gives the heart, and the list shows it', async () => {
      const res: any = await mutate({ mutation: addFavorite, variables: { ref: ref(bob) } })
      expect(res.errors).toBeUndefined()
      expect(res.data.addFavorite).toBe(true)

      const favorites: any = await query({ query: favoriteList })
      expect(favorites.data.favoriteList).toEqual([
        { communityUuid: bob.communityUuid, gradidoID: bob.gradidoID },
      ])
      const list: any = await query({ query: contactList })
      const byId = Object.fromEntries(
        list.data.contactList.contacts.map((c: any) => [c.user.gradidoID, c.favorite]),
      )
      expect(byId[bob.gradidoID]).toBe(true)
      expect(byId[peter.gradidoID]).toBe(false)
    })

    it('treats a second heart for the same person as the same heart', async () => {
      const res: any = await mutate({ mutation: addFavorite, variables: { ref: ref(bob) } })
      expect(res.errors).toBeUndefined()
      expect(res.data.addFavorite).toBe(true)
      const favorites: any = await query({ query: favoriteList })
      expect(favorites.data.favoriteList).toHaveLength(1)
    })

    it('fills in the home community for a member sent without one', async () => {
      const res: any = await mutate({
        mutation: addFavorite,
        variables: { ref: { communityUuid: null, gradidoID: peter.gradidoID } },
      })
      expect(res.errors).toBeUndefined()
      const favorites: any = await query({ query: favoriteList })
      expect(favorites.data.favoriteList).toContainEqual({
        communityUuid: peter.communityUuid,
        gradidoID: peter.gradidoID,
      })
      // And the point of the substitution: the heart shows on his contact row. The two
      // ends have to agree on the key, or it is stored where nothing looks for it.
      const list: any = await query({ query: contactList })
      const peterRow = list.data.contactList.contacts.find(
        (c: any) => c.user.gradidoID === peter.gradidoID,
      )
      expect(peterRow.favorite).toBe(true)
    })

    it('refuses an empty gradido id', async () => {
      const res: any = await mutate({
        mutation: addFavorite,
        variables: { ref: { communityUuid: null, gradidoID: '' } },
      })
      expect(res.errors?.[0]?.message).toContain('Argument Validation Error')
      const favorites: any = await query({ query: favoriteList })
      expect(favorites.data.favoriteList.some((f: any) => f.gradidoID === '')).toBe(false)
    })

    it('refuses the heart on oneself', async () => {
      const res: any = await mutate({ mutation: addFavorite, variables: { ref: ref(bibi) } })
      expect(res).toEqual(
        expect.objectContaining({
          errors: [new GraphQLError('A member cannot be their own favorite')],
        }),
      )
    })

    it('takes the heart away once, and says so the second time', async () => {
      const first: any = await mutate({ mutation: removeFavorite, variables: { ref: ref(bob) } })
      expect(first.data.removeFavorite).toBe(true)
      const second: any = await mutate({ mutation: removeFavorite, variables: { ref: ref(bob) } })
      expect(second.errors).toBeUndefined()
      expect(second.data.removeFavorite).toBe(false)
      const list: any = await query({ query: contactList })
      const bobRow = list.data.contactList.contacts.find(
        (c: any) => c.user.gradidoID === bob.gradidoID,
      )
      expect(bobRow.favorite).toBe(false)
    })
  })

  describe('as bob', () => {
    beforeAll(async () => {
      await loginAs('bob@baumeister.de')
    })

    it("sees his own contacts and none of bibi's hearts", async () => {
      const list: any = await query({ query: contactList })
      expect(list.data.contactList.count).toBe(1)
      expect(list.data.contactList.contacts[0].user.gradidoID).toBe(bibi.gradidoID)
      expect(list.data.contactList.contacts[0].bookings).toBe(2)
      const favorites: any = await query({ query: favoriteList })
      expect(favorites.data.favoriteList).toEqual([])
    })
  })
})
