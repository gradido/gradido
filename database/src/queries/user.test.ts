import { GradidoUnit, Order } from 'shared'
import { clearDatabase } from '../../migration/clear'
import {
  ALIAS_ORIGIN_CHOSEN,
  Community as DbCommunity,
  Transaction as DbTransaction,
  User as DbUser,
  UserAlias as DbUserAlias,
  UserContact as DbUserContact,
} from '..'
import { AppDatabase } from '../AppDatabase'
import { createCommunity } from '../seeds/community'
import { creationFactory, nMonthsBefore } from '../seeds/factory/creation'
import { transferGradidos } from '../seeds/factory/transaction'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { peterLustig } from '../seeds/users/peter-lustig'
import {
  aliasExists,
  dbClearGmsRegistration,
  dbFindGmsAllowedLocalUserIds,
  dbFindUserIdByUuids,
  dbMarkUsersGmsRegistered,
  dbSelectLatestUserBalances,
  findUserNamesByIds,
} from './user'
import { dbInsertUserAlias } from './userAliases'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('user.queries', () => {
  describe('aliasExists', () => {
    beforeAll(async () => {
      await DbUser.clear()
      await DbUserContact.clear()

      const bibi = bibiBloxberg
      bibi.alias = 'b-b'
      await userFactory(bibi)
    })

    it('should return true if alias exists', async () => {
      expect(await aliasExists('b-b')).toBe(true)
    })

    it('should return true if alias exists even with deviating casing', async () => {
      expect(await aliasExists('b-B')).toBe(true)
    })

    it('should return false if alias does not exist', async () => {
      expect(await aliasExists('bibi')).toBe(false)
    })
  })

  describe('aliasExists across communities and across time', () => {
    let communityUuid: string
    let bibi: DbUser

    beforeAll(async () => {
      await DbUserAlias.clear()
      await DbUser.clear()
      await DbUserContact.clear()
      await DbCommunity.clear()

      const homeCom = await createCommunity(false)
      communityUuid = homeCom.communityUuid!
      bibi = await userFactory({ ...bibiBloxberg, alias: 'bibi-now' })
    })

    // Rows with foreign = 1 are cached copies of members of other communities. Aliases
    // are unique per community since migration 0073, so one held over there must not
    // refuse a member here - and the refusal would be unexplainable, because the row
    // that caused it appears in no member list of this community.
    it('lets a member take a name that only a cached foreign member holds', async () => {
      const stranger = DbUser.create()
      stranger.foreign = true
      stranger.alias = 'faraway'
      stranger.gradidoID = '11111111-2222-4333-8444-555555555555'
      stranger.communityUuid = '99999999-2222-4333-8444-555555555555'
      stranger.firstName = 'Far'
      stranger.lastName = 'Away'
      await DbUser.save(stranger)

      expect(await aliasExists('faraway')).toBe(false)
    })

    it('refuses a name another member left behind', async () => {
      const peter = await userFactory({ ...peterLustig, alias: 'peter-now' })
      await dbInsertUserAlias(peter.id, 'peter-was', communityUuid, ALIAS_ORIGIN_CHOSEN)

      expect(await aliasExists('peter-was', bibi.id)).toBe(true)
    })

    it('lets a member take back a name of their own', async () => {
      await dbInsertUserAlias(bibi.id, 'bibi-was', communityUuid, ALIAS_ORIGIN_CHOSEN)

      expect(await aliasExists('bibi-was', bibi.id)).toBe(false)
      // ...and it stays blocked for everybody else.
      expect(await aliasExists('bibi-was')).toBe(true)
    })
  })

  describe('dbClearGmsRegistration', () => {
    let registered: DbUser

    beforeAll(async () => {
      await DbUser.clear()
      await DbUserContact.clear()

      registered = await userFactory(bibiBloxberg)
      await DbUser.update(
        { id: registered.id },
        { gmsRegistered: true, gmsRegisteredAt: new Date() },
      )
    })

    it('forgets that the GMS holds the member', async () => {
      const result = await dbClearGmsRegistration(registered.id)

      expect(result.success).toBe(true)
      const stored = await DbUser.findOneByOrFail({ id: registered.id })
      expect(stored.gmsRegistered).toBe(false)
      expect(stored.gmsRegisteredAt).toBeNull()
    })

    it('succeeds when the member already counted as not registered', async () => {
      await dbClearGmsRegistration(registered.id)

      // Writing the value that is already there still matches the row, and matching is
      // what the result reports - mysql2 connects with FOUND_ROWS.
      await expect(dbClearGmsRegistration(registered.id)).resolves.toEqual({ success: true })
    })

    it('reports a member that does not exist', async () => {
      const result = await dbClearGmsRegistration(registered.id + 1000)

      expect(result.success).toBe(false)
    })
  })

  describe('dbFindUserIdByUuids', () => {
    let bibi: DbUser
    let bob: DbUser
    let home: string

    beforeAll(async () => {
      await DbUser.clear()
      await DbUserContact.clear()
      await DbCommunity.clear()
      const community = await createCommunity(false)
      home = community.communityUuid as string
      bibi = await userFactory(bibiBloxberg)
      bob = await userFactory(bobBaumeister)
      await DbUser.update({ id: bob.id }, { deletedAt: new Date() })
    })

    it('finds the row by the pair, deleted members included, and nobody by a wrong pair', async () => {
      expect(await dbFindUserIdByUuids(home, bibi.gradidoID)).toBe(bibi.id)
      expect(await dbFindUserIdByUuids(home, bob.gradidoID)).toBe(bob.id)
      expect(
        await dbFindUserIdByUuids('99999999-9999-9999-9999-999999999999', bibi.gradidoID),
      ).toBeNull()
      expect(await dbFindUserIdByUuids(home, '00000000-0000-0000-0000-000000000000')).toBeNull()
    })

    // The state migration 0129 left behind wherever the home community had no row yet
    // when it ran: a member of this community whose row carries no uuid. The contact list
    // hands out the home uuid for them, so the home uuid has to find them here too.
    it('finds a member whose row still carries no community uuid, by the home uuid', async () => {
      await DbUser.update({ id: bibi.id }, { communityUuid: null })
      try {
        expect(await dbFindUserIdByUuids(home, bibi.gradidoID)).toBeNull()
        expect(await dbFindUserIdByUuids(home, bibi.gradidoID, { homeCommunityUuid: home })).toBe(
          bibi.id,
        )
        // Only for the home community: another community's uuid does not reach a row
        // without one, whatever the option says.
        expect(
          await dbFindUserIdByUuids('99999999-9999-9999-9999-999999999999', bibi.gradidoID, {
            homeCommunityUuid: home,
          }),
        ).toBeNull()
      } finally {
        await DbUser.update({ id: bibi.id }, { communityUuid: home })
      }
    })
  })

  // TypeORM left deleted accounts out of every one of these without being asked (the
  // entity's `@DeleteDateColumn`); Drizzle has to be told. Each describe below holds one
  // deleted member for exactly that reason.
  describe('findUserNamesByIds', () => {
    let bibi: DbUser
    let peter: DbUser

    beforeAll(async () => {
      await DbUser.clear()
      await DbUserContact.clear()
      bibi = await userFactory(bibiBloxberg)
      peter = await userFactory(peterLustig)
      await DbUser.update({ id: peter.id }, { deletedAt: new Date() })
    })

    it('answers the real name by id, and leaves a deleted account out', async () => {
      const names = await findUserNamesByIds([bibi.id, peter.id])
      expect(names).toEqual(new Map([[bibi.id, 'Bibi Bloxberg']]))
    })

    it('answers an empty map for an empty list', async () => {
      expect(await findUserNamesByIds([])).toEqual(new Map())
    })
  })

  describe('dbFindGmsAllowedLocalUserIds and dbMarkUsersGmsRegistered', () => {
    let bibi: DbUser
    let peter: DbUser
    let bob: DbUser

    beforeAll(async () => {
      await DbUser.clear()
      await DbUserContact.clear()
      bibi = await userFactory(bibiBloxberg)
      peter = await userFactory(peterLustig)
      bob = await userFactory(bobBaumeister)
    })

    it('finds the local members who allow the GMS, and nobody deleted', async () => {
      await DbUser.update({ id: peter.id }, { gmsAllowed: false })
      await DbUser.update({ id: bob.id }, { deletedAt: new Date() })
      try {
        expect(await dbFindGmsAllowedLocalUserIds()).toEqual([{ id: bibi.id }])
        await DbUser.update({ id: bibi.id }, { foreign: true })
        expect(await dbFindGmsAllowedLocalUserIds()).toEqual([])
      } finally {
        await DbUser.update({ id: bibi.id }, { foreign: false })
        await DbUser.update({ id: peter.id }, { gmsAllowed: true })
        await DbUser.update({ id: bob.id }, { deletedAt: null })
      }
    })

    it('marks exactly the given members as published', async () => {
      await dbMarkUsersGmsRegistered([bibi.id, bob.id])

      const [storedBibi, storedPeter, storedBob] = await Promise.all(
        [bibi, peter, bob].map((user) => DbUser.findOneByOrFail({ id: user.id })),
      )
      expect(storedBibi.gmsRegistered).toBe(true)
      expect(storedBibi.gmsRegisteredAt).toBeInstanceOf(Date)
      expect(storedBob.gmsRegistered).toBe(true)
      expect(storedPeter.gmsRegistered).toBe(false)
      expect(storedPeter.gmsRegisteredAt).toBeNull()
    })
  })

  describe('dbSelectLatestUserBalances', () => {
    const day = (n: number): Date => new Date(Date.UTC(2026, 7, n, 12, 0, 0))
    let bibi: DbUser
    let peter: DbUser

    beforeAll(async () => {
      await clearDatabase()
      await createCommunity(false)
      bibi = await userFactory(bibiBloxberg)
      peter = await userFactory(peterLustig)
      const bob = await userFactory(bobBaumeister)
      await creationFactory(
        {
          email: 'bibi@bloxberg.de',
          amount: 1000,
          memo: 'Herzlich Willkommen bei Gradido!',
          contributionDate: nMonthsBefore(new Date()),
          confirmed: true,
          moveCreationDate: 12,
        },
        bibi,
        peter,
      )
      await transferGradidos(bibi, peter, new GradidoUnit(100000n), 'one', day(1))
      await transferGradidos(bibi, bob, new GradidoUnit(50000n), 'two', day(2))
      await transferGradidos(peter, bibi, new GradidoUnit(20000n), 'three', day(3))
      await DbUser.update({ id: bob.id }, { deletedAt: new Date() })
    })

    it('answers one row per member with bookings - their latest - newest first', async () => {
      const rows = await dbSelectLatestUserBalances()
      // bob has bookings too, but his account is deleted.
      expect(rows.map((row) => row.balanceDate)).toEqual([day(3), day(3)])
      const bibiLatest = await DbTransaction.findOneOrFail({
        where: { userId: bibi.id },
        order: { balanceDate: Order.DESC, id: Order.DESC },
      })
      const peterLatest = await DbTransaction.findOneOrFail({
        where: { userId: peter.id },
        order: { balanceDate: Order.DESC, id: Order.DESC },
      })
      // The raw column, as a string of gdd cents - what the statistics resolver reads.
      expect(rows.map((row) => row.balance.gddCent || 0n).sort()).toEqual(
        [bibiLatest.balance.gddCent, peterLatest.balance.gddCent].sort(),
      )
    })
  })
})
