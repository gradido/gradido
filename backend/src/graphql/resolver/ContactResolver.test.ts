// AI-GENERATED — not an architecture reference
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import { CONFIG as CORE_CONFIG } from 'core'
import {
  AppDatabase,
  dbEnsureDirectChatConversation,
  dbInsertChatMessage,
  dbUpsertForeignMemberAvatarDates,
  foreignReceive,
  transferGradidos,
  User,
  UserContact,
} from 'database'
import { GraphQLError } from 'graphql'
import { ContactOrigin, GradidoUnit } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { userFactory } from '@/seeds/factory/user'
import { addFavorite, login, removeFavorite, sendEmail } from '@/seeds/graphql/mutations'
import { contactList, favoriteList, transactionsQuery } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

jest.mock('@/password/EncryptorUtils')

// A member writes to bibi below, through sendEmail; no mail has to go out for that.
CORE_CONFIG.EMAIL = false

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

/** The booking list of whoever is logged in, narrowed to one member -- what the window links to. */
const narrowed = async (member: { gradidoID: string; communityUuid: string | null }) => {
  const res: any = await query({
    query: transactionsQuery,
    variables: {
      counterparty: { gradidoID: member.gradidoID, communityUuid: member.communityUuid },
    },
  })
  expect(res.errors).toBeUndefined()
  return res.data.transactionList
}

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
     * reasoning that migration 0129 filled `foreign = 0` rows only -- but no writer produced
     * that state, and since migration 0134 the column refuses it outright: both `core/graphql/logic/storeForeignUser` and
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

    /**
     * ★ A contact from another community carries the date their community last reported for
     * their picture (AS-019, stored by refreshForeignMemberAvatarDates) -- the contact known
     * only from the booking, and the one whose `users` row the federation stored. Without it
     * the wallet never asks for their face; with a stale one it would keep a withdrawn face.
     */
    describe('the picture dates of contacts from another community', () => {
      const ANNAS_PICTURE = new Date('2026-09-14T16:58:37.124Z')
      const BOBS_PICTURE = new Date('2026-09-15T08:01:02.345Z')

      const contactOf = async (gradidoID: string) => {
        const res: any = await query({ query: contactList })
        expect(res.errors).toBeUndefined()
        return res.data.contactList.contacts.find((c: any) => c.user.gradidoID === gradidoID)
      }

      afterEach(async () => {
        await db.getDataSource().query('DELETE FROM foreign_member_avatar_dates')
      })

      it('carries no date before their community reported one', async () => {
        expect((await contactOf(ANNA)).user.avatarUpdatedAt).toBeNull()
      })

      it('carries the date their community reported', async () => {
        await dbUpsertForeignMemberAvatarDates([
          {
            communityUuid: FOREIGN_COMMUNITY,
            gradidoId: ANNA,
            avatarUpdatedAt: ANNAS_PICTURE,
            checkedAt: new Date(),
          },
        ])
        expect((await contactOf(ANNA)).user.avatarUpdatedAt).toBe(ANNAS_PICTURE.toISOString())
      })

      it('carries null when their community has nothing to show', async () => {
        await dbUpsertForeignMemberAvatarDates([
          {
            communityUuid: FOREIGN_COMMUNITY,
            gradidoId: ANNA,
            avatarUpdatedAt: null,
            checkedAt: new Date(),
          },
        ])
        expect((await contactOf(ANNA)).user.avatarUpdatedAt).toBeNull()
      })

      it('carries it for a contact whose users row the federation stored', async () => {
        await db
          .getDataSource()
          .query('UPDATE users SET `foreign` = 1, community_uuid = ? WHERE id = ?', [
            FOREIGN_COMMUNITY,
            bob.id,
          ])
        try {
          await dbUpsertForeignMemberAvatarDates([
            {
              communityUuid: FOREIGN_COMMUNITY,
              gradidoId: bob.gradidoID,
              avatarUpdatedAt: BOBS_PICTURE,
              checkedAt: new Date(),
            },
          ])
          const bobRow = await contactOf(bob.gradidoID)
          // The fixture proves itself: bob is on the path of a stored foreign row.
          expect(bobRow.homeCommunity).toBe(false)
          expect(bobRow.user.avatarUpdatedAt).toBe(BOBS_PICTURE.toISOString())
        } finally {
          await db
            .getDataSource()
            .query('UPDATE users SET `foreign` = 0, community_uuid = ? WHERE id = ?', [
              bibi.communityUuid,
              bob.id,
            ])
        }
      })

      /**
       * ⛔ A member of THIS community takes their date from their own picture, never from this
       * table. The refresh writes no row under our own uuid -- so one planted here must not
       * reach peter, or a list that handed its own members to the lookup would pass unnoticed.
       */
      it('gives a contact of this community no date from there, whatever is stored', async () => {
        await dbUpsertForeignMemberAvatarDates([
          {
            communityUuid: peter.communityUuid,
            gradidoId: peter.gradidoID,
            avatarUpdatedAt: BOBS_PICTURE,
            checkedAt: new Date(),
          },
        ])
        const peterRow = await contactOf(peter.gradidoID)
        expect(peterRow.homeCommunity).toBe(true)
        expect(peterRow.user.avatarUpdatedAt).toBeNull()
      })
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

  /**
   * The link in the contact window: "51 bookings, last on 24.08." opens the booking list
   * narrowed to that member. The number and the list are counted by ONE rule
   * (queries/transactions.ts), and this is where the two ends meet the real schema.
   */
  describe('the narrowed booking list behind the window', () => {
    describe('as bibi', () => {
      beforeAll(async () => {
        await loginAs('bibi@bloxberg.de')
      })

      it('counts what the window counts, for every contact, local and foreign', async () => {
        const list: any = await query({ query: contactList })
        expect(list.data.contactList.contacts).toHaveLength(3)
        for (const contact of list.data.contactList.contacts) {
          const bookings = await narrowed(contact.user)
          expect(bookings.balance.count).toBe(contact.bookings)
          expect(bookings.transactions).toHaveLength(contact.bookings)
          expect(
            bookings.transactions.every(
              (t: any) => t.linkedUser?.gradidoID === contact.user.gradidoID,
            ),
          ).toBe(true)
          // Newest first, so the row on top is the one the window calls "last".
          expect(new Date(bookings.transactions[0].balanceDate).getTime()).toBe(
            new Date(contact.lastAt).getTime(),
          )
        }
      })

      /**
       * ⛔ The single-contact lookup, which is what the contact window asks when it is
       * opened from a BOOKING row rather than from the list (KF-010): that row names the
       * member but carries none of the three figures, and they are a grouping over all
       * bookings with them.
       *
       * Measured against BOTH neighbours -- the same contact inside the full list, and the
       * booking list the window's link opens -- because the whole point of resolving it
       * through `bookingCounterparty` is that all three come from one rule.
       */
      it('answers about one member, with the figures the list and the bookings agree on', async () => {
        const list: any = await query({ query: contactList })
        for (const inList of list.data.contactList.contacts) {
          const one: any = await query({
            query: contactList,
            variables: {
              ref: { gradidoID: inList.user.gradidoID, communityUuid: inList.user.communityUuid },
            },
          })
          expect(one.data.contactList.contacts).toHaveLength(1)
          expect(one.data.contactList.contacts[0]).toEqual(inList)
          // And the count it states is the length of the list its link opens.
          const bookings = await narrowed(inList.user)
          expect(bookings.balance.count).toBe(one.data.contactList.contacts[0].bookings)
        }
      })

      it('answers about nobody for a pair nobody booked with', async () => {
        const one: any = await query({
          query: contactList,
          variables: { ref: { gradidoID: uuidv4(), communityUuid: FOREIGN_COMMUNITY } },
        })
        expect(one.data.contactList.contacts).toEqual([])
        expect(one.data.contactList.count).toBe(0)
      })

      it('fills in the home community for a member asked about without one', async () => {
        const one: any = await query({
          query: contactList,
          variables: { ref: { gradidoID: peter.gradidoID, communityUuid: null } },
        })
        expect(one.data.contactList.contacts).toHaveLength(1)
        expect(one.data.contactList.contacts[0].user.gradidoID).toBe(peter.gradidoID)
      })

      it('carries neither the decay row nor the link summary', async () => {
        const whole: any = await query({ query: transactionsQuery })
        expect(whole.data.transactionList.transactions[0].typeId).toBe('DECAY')
        const bookings = await narrowed(bob)
        expect(bookings.transactions.map((t: any) => t.typeId)).toEqual(['RECEIVE', 'SEND'])
      })

      it('answers an empty list, not the whole one, for a member nobody booked with', async () => {
        const bookings = await narrowed({ gradidoID: uuidv4(), communityUuid: FOREIGN_COMMUNITY })
        expect(bookings.transactions).toEqual([])
        expect(bookings.balance.count).toBe(0)
      })

      it('fills in the home community for a member sent without one', async () => {
        const bookings = await narrowed({ gradidoID: peter.gradidoID, communityUuid: null })
        expect(bookings.balance.count).toBe(1)
        expect(bookings.transactions[0].linkedUser.gradidoID).toBe(peter.gradidoID)
      })
    })

    // ⛔ The one property the filter must never lose: it narrows, it cannot widen. bibi
    // booked with peter and with anna, bob with neither -- one contact by users row, one
    // by the pair on the booking, so both branches of the where are tried.
    describe('as bob', () => {
      beforeAll(async () => {
        await loginAs('bob@baumeister.de')
      })

      it("shows him nothing of bibi's bookings", async () => {
        for (const other of [peter, anna]) {
          const bookings = await narrowed(other)
          expect(bookings.transactions).toEqual([])
          expect(bookings.balance.count).toBe(0)
        }
      })

      // ⛔ And the same property for the single-contact lookup, which is the other half of
      // the pair: asking about somebody by their uuid pair must not answer about a person
      // one has never booked with. The answer is built from the CALLER's own bookings.
      it("tells him nothing about bibi's contacts either", async () => {
        for (const other of [peter, anna]) {
          const one: any = await query({
            query: contactList,
            variables: {
              ref: { gradidoID: other.gradidoID, communityUuid: other.communityUuid },
            },
          })
          expect(one.data.contactList.contacts).toEqual([])
          expect(one.data.contactList.count).toBe(0)
        }
      })
    })
  })

  /**
   * The second source: the referral trace (KF-012).
   *
   * ⚠️ LAST in the file, and it undoes everything it does -- the columns it writes onto
   * members the blocks above count and order, and the member it creates of its own. Both,
   * so that the next person can add a describe below this one.
   *
   * ⛔ Every registration date here is EARLIER than the bookings of the same member: an
   * account has to exist before it can book, so a fixture that registers somebody after
   * their bookings pins a state production cannot reach -- and hides the one the merge
   * really does, `firstAt` reaching BACK to the registration.
   */
  describe('the referral trace as a second source', () => {
    let carla: User

    /** Before day(0), so bob's registration is older than every booking of his. */
    const bobArrived = new Date(Date.UTC(2026, 6, 20, 12, 0, 0))

    /** One contact out of bibi's list, by the member it names. */
    const contactFor = async (member: User) => {
      const res: any = await query({ query: contactList, variables: { pageSize: 25 } })
      expect(res.errors).toBeUndefined()
      return {
        list: res.data.contactList,
        row: res.data.contactList.contacts.find((c: any) => c.user.gradidoID === member.gradidoID),
      }
    }

    beforeAll(async () => {
      // Nobody has exchanged anything with her -- the whole reason she is a contact is
      // that she came here over bibi.
      carla = await userFactory(testEnv, {
        email: 'carla@arrival.de',
        firstName: 'Carla',
        lastName: 'Ankunft',
        alias: 'carlaSunshine',
        emailChecked: true,
        createdAt: day(10),
      })
      await User.update(carla.id, { referrerId: bibi.id })
      // bob came over bibi AND has two bookings with her: one contact, both truths. He
      // registered before he could book, so the joined span reaches BACK to that day.
      await User.update(bob.id, { referrerId: bibi.id, createdAt: bobArrived })
      // The other direction: peter showed bibi Gradido, and they have booked once.
      await User.update(bibi.id, { referrerId: peter.id })
      await loginAs('bibi@bloxberg.de')
    })

    afterAll(async () => {
      await User.update([carla.id, bob.id, bibi.id], { referrerId: null })
      await User.update(bob.id, { createdAt: bob.createdAt })
      // The member this block created, and the address row that came with her.
      await User.delete(carla.id)
      await UserContact.delete({ userId: carla.id })
      await clearFavorites()
      await resetToken()
    })

    it('brings somebody with no bookings at all into the list, with their origin', async () => {
      const { list, row } = await contactFor(carla)
      // The three from the bookings plus carla; bob and peter were contacts already.
      expect(list.count).toBe(4)
      expect(row).toMatchObject({
        bookings: 0,
        origin: ContactOrigin.ARRIVAL,
        favorite: false,
        homeCommunity: true,
      })
      expect(row.user.alias).toBe('carlaSunshine')
      // NU-019 holds on this path too: the real name reaches nobody.
      expect(row.user.firstName).toBeNull()
      expect(row.user.lastName).toBeNull()
      // One moment, not a span: an arrival happened once.
      expect(new Date(row.firstAt).getTime()).toBe(day(10).getTime())
      expect(new Date(row.lastAt).getTime()).toBe(day(10).getTime())
    })

    it('gives a contact with bookings AND an origin both of them, as ONE row', async () => {
      const { list, row } = await contactFor(bob)
      expect(list.contacts.filter((c: any) => c.user.gradidoID === bob.gradidoID)).toHaveLength(1)
      expect(row).toMatchObject({ bookings: 2, origin: ContactOrigin.ARRIVAL })
      // Oldest of both sources, newest of both: the registration reaches back before the
      // first booking, the last booking stays the last.
      expect(new Date(row.firstAt).getTime()).toBe(bobArrived.getTime())
      expect(new Date(row.lastAt).getTime()).toBe(day(2).getTime())
    })

    it('names the other direction from the asking member, and dates it with her own arrival', async () => {
      const { row } = await contactFor(peter)
      expect(row).toMatchObject({ bookings: 1, origin: ContactOrigin.REFERRER })
      // bibi registered in 2021, long before she booked with peter.
      expect(new Date(row.firstAt).getTime()).toBe(bibi.createdAt.getTime())
      expect(new Date(row.lastAt).getTime()).toBe(day(3).getTime())
    })

    it('leaves a contact that is only a booking without an origin', async () => {
      const res: any = await query({ query: contactList, variables: { pageSize: 25 } })
      const annaRow = res.data.contactList.contacts.find((c: any) => c.user.gradidoID === ANNA)
      expect(annaRow).toMatchObject({ bookings: 1, origin: null })
    })

    it('answers about her alone when the window asks by the pair', async () => {
      const res: any = await query({
        query: contactList,
        variables: { ref: { gradidoID: carla.gradidoID, communityUuid: carla.communityUuid } },
      })
      expect(res.errors).toBeUndefined()
      expect(res.data.contactList.count).toBe(1)
      expect(res.data.contactList.contacts[0]).toMatchObject({
        bookings: 0,
        origin: ContactOrigin.ARRIVAL,
      })
      // ⛔ And the booking list behind it is empty, which is the two rules agreeing. What
      // must not follow is a LINK to it -- the window draws none where the count is 0.
      const bookings = await narrowed(carla)
      expect(bookings.transactions).toEqual([])
      expect(bookings.balance.count).toBe(0)
    })

    // ⛔ The heart used to be reachable only where a booking was. It is on this row too,
    // and it has to show -- a heart that vanishes from the list is a heart nobody gave.
    it('shows the heart on a contact who has no bookings', async () => {
      const given = await mutate({ mutation: addFavorite, variables: { ref: ref(carla) } })
      expect(given).toMatchObject({ data: { addFavorite: true } })
      const { row } = await contactFor(carla)
      expect(row).toMatchObject({ favorite: true, bookings: 0, origin: ContactOrigin.ARRIVAL })
    })
  })

  /**
   * The fourth source: the people bibi has a conversation with (E-023, KF-012).
   *
   * ⚠️ LAST, and it undoes what it does, like the block above.
   *
   * dora is a member of this community who only ever wrote to bibi -- no booking, no trace --
   * and she writes through sendEmail, as a member does. Frida is a member of another community
   * bibi wrote to: this server has no users row for her and knows her pair alone. Her
   * conversation is seeded as bibi's own copy of that message, through the queries -- writing
   * across the border needs the other community's server, which TransactionResolver.test.ts
   * stands in for and this file does not. A message FROM Frida could not be filed here without
   * a users row for her (the receiving server finds the sender by it), so this is the shape a
   * partner without a row has.
   */
  describe('conversations as a source', () => {
    const FRIDA = 'f1f1f1f1-0000-4000-8000-000000000001'
    let dora: User

    const contacts = async (variables: Record<string, unknown> = { pageSize: 25 }) => {
      const res: any = await query({ query: contactList, variables })
      expect(res.errors).toBeUndefined()
      return res.data.contactList
    }

    beforeAll(async () => {
      dora = await userFactory(testEnv, {
        email: 'dora@writes.de',
        firstName: 'Dora',
        lastName: 'Schreibt',
        alias: 'doraWrites',
        emailChecked: true,
      })
      await loginAs('dora@writes.de')
      const sent = await mutate({
        mutation: sendEmail,
        variables: {
          recipientCommunityIdentifier: bibi.communityUuid,
          recipientIdentifier: bibi.gradidoID,
          subject: 'A ladder',
          memo: 'Do you still have the ladder?',
        },
      })
      expect(sent.errors).toBeUndefined()

      const bibiPair = { communityUuid: bibi.communityUuid, gradidoId: bibi.gradidoID }
      const withFrida = await dbEnsureDirectChatConversation(bibiPair, {
        communityUuid: FOREIGN_COMMUNITY,
        gradidoId: FRIDA,
      })
      const filed = await dbInsertChatMessage({
        messageUuid: uuidv4(),
        conversationId: withFrida.id,
        senderCommunityUuid: bibi.communityUuid,
        senderGradidoId: bibi.gradidoID,
        subject: null,
        body: 'Greetings from over here',
        notify: 'email',
        deliveryState: 'delivered',
      })
      expect(filed.success).toBe(true)
      await loginAs('bibi@bloxberg.de')
    })

    afterAll(async () => {
      for (const table of ['chat_messages', 'chat_conversation_members', 'chat_conversations']) {
        await db.getDataSource().query(`DELETE FROM \`${table}\``)
      }
      await User.delete(dora.id)
      await UserContact.delete({ userId: dora.id })
      await resetToken()
    })

    it('brings somebody who only wrote, with no bookings and the chat fields', async () => {
      const list = await contacts()
      const row = list.contacts.find((c: any) => c.user.gradidoID === dora.gradidoID)
      expect(row).toMatchObject({
        bookings: 0,
        origin: null,
        homeCommunity: true,
        unreadChatMessages: 1,
      })
      expect(row.user.alias).toBe('doraWrites')
      // NU-019 holds on this path too: the real name reaches nobody.
      expect(row.user.firstName).toBeNull()
      expect(row.user.lastName).toBeNull()
      // Her message is the one event: when it arrived is when the contact began and last moved.
      expect(row.lastChatMessageAt).not.toBeNull()
      expect(row.firstAt).toBe(row.lastChatMessageAt)
      expect(row.lastAt).toBe(row.lastChatMessageAt)
    })

    it('names a partner from another community without a users row by what is known', async () => {
      const row = (await contacts()).contacts.find((c: any) => c.user.gradidoID === FRIDA)
      expect(row).toMatchObject({
        bookings: 0,
        origin: null,
        homeCommunity: false,
        // bibi's own message: nothing unread.
        unreadChatMessages: 0,
      })
      // No alias is known for her anywhere on this server: the wallet shows the gradido ID
      // (memberAlias), and this list hands it out, as it does for a booking without a name.
      expect(row.user).toMatchObject({
        communityUuid: FOREIGN_COMMUNITY,
        gradidoID: FRIDA,
        alias: null,
        firstName: null,
        lastName: null,
      })
      expect(row.lastChatMessageAt).not.toBeNull()
    })

    it('counts both as people, and puts the fresh conversations above the older bookings', async () => {
      const list = await contacts()
      expect(list.count).toBe(5)
      const order = list.contacts.map((c: any) => c.user.gradidoID)
      // Both messages were written a moment ago, the bookings in August.
      expect(order.slice(0, 2).sort()).toEqual([dora.gradidoID, FRIDA].sort())
      expect(order.slice(2)).toEqual([peter.gradidoID, bob.gradidoID, ANNA])
    })

    it('leaves nothing unread and no last message on a contact without a conversation', async () => {
      const row = (await contacts()).contacts.find((c: any) => c.user.gradidoID === bob.gradidoID)
      expect(row).toMatchObject({ unreadChatMessages: 0, lastChatMessageAt: null })
    })

    it('finds the partner with a users row by the alias', async () => {
      const list = await contacts({ search: 'writes', pageSize: 25 })
      expect(list.count).toBe(1)
      expect(list.contacts[0].user.gradidoID).toBe(dora.gradidoID)
    })

    // The contact window asks exactly this (contactByMemberQuery): one person by the pair.
    it('answers about each of them alone, with the chat fields, when the window asks by the pair', async () => {
      const doraAlone = await contacts({ pageSize: 1, ref: ref(dora) })
      expect(doraAlone.count).toBe(1)
      expect(doraAlone.contacts[0]).toMatchObject({ bookings: 0, unreadChatMessages: 1 })
      expect(doraAlone.contacts[0].lastChatMessageAt).not.toBeNull()

      const fridaAlone = await contacts({
        pageSize: 1,
        ref: { communityUuid: FOREIGN_COMMUNITY, gradidoID: FRIDA },
      })
      expect(fridaAlone.count).toBe(1)
      expect(fridaAlone.contacts[0]).toMatchObject({ bookings: 0, unreadChatMessages: 0 })
      expect(fridaAlone.contacts[0].lastChatMessageAt).not.toBeNull()
    })
  })
})
