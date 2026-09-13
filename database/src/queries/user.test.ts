import { GradidoUnit, Order, PasswordEncryptionType } from 'shared'
import { clearDatabase } from '../../migration/clear'
import {
  ALIAS_ORIGIN_CHOSEN,
  Community as DbCommunity,
  Transaction as DbTransaction,
  User as DbUser,
  UserAlias as DbUserAlias,
  UserContact as DbUserContact,
  UserRole as DbUserRole,
} from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { userAvatarsTable } from '../schemas/drizzle.schema'
import { createCommunity } from '../seeds/community'
import { creationFactory, nMonthsBefore } from '../seeds/factory/creation'
import { foreignReceive, transferGradidos } from '../seeds/factory/transaction'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { peterLustig } from '../seeds/users/peter-lustig'
import { getLastTransaction } from './transactions'
import {
  aliasExists,
  dbClearGmsRegistration,
  dbFindGmsAllowedLocalUserIds,
  dbFindUserIdByUuids,
  dbFindUserLoginByEmail,
  dbMarkUsersGmsRegistered,
  dbSelectLatestUserBalances,
  dbUserUpdateField,
  dbUserUpdatePassword,
  findUserNamesByIds,
} from './user'
import { dbInsertUserAlias } from './userAliases'
import { dbUpsertUserAvatar } from './userAvatars'

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
      await DbCommunity.clear()

      const homeCom = await createCommunity(false)
      const bibi = bibiBloxberg
      bibi.alias = 'b-b'
      await userFactory(bibi, homeCom)
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

  describe('dbFindUserLoginByEmail', () => {
    const smallPicture = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x07, 0x08])
    let bibi: DbUser
    let bob: DbUser
    let home: string

    beforeAll(async () => {
      await DbUserRole.clear()
      await drizzleDb().delete(userAvatarsTable)
      await DbUser.clear()
      await DbUserContact.clear()
      await DbCommunity.clear()
      const community = await createCommunity(false)
      home = community.communityUuid as string
      bibi = await userFactory({ ...bibiBloxberg, role: 'ADMIN' })
      bob = await userFactory(bobBaumeister)
      await dbUpsertUserAvatar({
        userId: bibi.id,
        avatarSmall: smallPicture,
        avatarFull: smallPicture,
        mimeType: 'image/jpeg',
      })
    })

    it('answers the row, the role, the address in force and the picture in one go', async () => {
      const result = await dbFindUserLoginByEmail('bibi@bloxberg.de')

      expect(result.success).toBe(true)
      if (!result.success) {
        return
      }
      expect(result.value.id).toBe(bibi.id)
      expect(result.value.gradidoId).toBe(bibi.gradidoID)
      expect(result.value.communityUuid).toBe(home)
      expect(result.value.emailContact.email).toBe('bibi@bloxberg.de')
      expect(result.value.role?.role).toBe('ADMIN')
      expect(Buffer.from(result.value.avatar as Buffer).equals(smallPicture)).toBe(true)
    })

    // 0..1 for both joins, so the member without either has to come back all the same --
    // an inner join on one of them would have shut the ordinary member out of the wallet.
    it('answers a member who has neither role nor picture', async () => {
      const result = await dbFindUserLoginByEmail('bob@baumeister.de')

      expect(result.success).toBe(true)
      if (!result.success) {
        return
      }
      expect(result.value.id).toBe(bob.id)
      expect(result.value.role).toBeNull()
      expect(result.value.avatar).toBeNull()
    })

    it('reports an address nobody holds', async () => {
      const result = await dbFindUserLoginByEmail('nobody@bloxberg.de')

      expect(result.success).toBe(false)
    })

    // ⛔ The login has to tell "this account was deleted" apart from "no such address":
    // the two get different answers, and only the caller can decide that. A
    // `deleted_at IS NULL` here would turn a deleted member into an unknown one and the
    // message they were meant to read into "no user with this credentials".
    it('answers a deleted account, so the caller can say that it was deleted', async () => {
      await DbUser.update({ id: bob.id }, { deletedAt: new Date() })
      try {
        const result = await dbFindUserLoginByEmail('bob@baumeister.de')

        expect(result.success).toBe(true)
        if (!result.success) {
          return
        }
        expect(result.value.deletedAt).toBeInstanceOf(Date)
      } finally {
        await DbUser.update({ id: bob.id }, { deletedAt: null })
      }
    })

    // ⛔ The whole `users` row is read here, `location` with it. mysql2 parses a geometry
    // column into `{ x, y }` before drizzle sees it, and wkx refuses that with "first
    // argument must be a string or Buffer" -- so every member who had ever saved a
    // position was answered with an exception rather than a session, and nothing about
    // the failure named the picture on a map. See customGeometry.
    it('answers a member who has saved a position, and reads it back as a point', async () => {
      await DbUser.update(
        { id: bibi.id },
        { location: { type: 'Point', coordinates: [8.6821, 50.1109] } },
      )
      try {
        const result = await dbFindUserLoginByEmail('bibi@bloxberg.de')

        expect(result.success).toBe(true)
        if (!result.success) {
          return
        }
        expect(result.value.location).toEqual({ type: 'Point', coordinates: [8.6821, 50.1109] })
      } finally {
        await DbUser.update({ id: bibi.id }, { location: null })
      }
    })

    // ⛔ The one state the row count still guards: two `users` rows naming the same address
    // row. Refused rather than resolved -- picking one would sign somebody in as whichever
    // member the database reached first. (A second role can no longer cause it:
    // user_roles.user_id is UNIQUE since migration 0135, see userRoles.test.ts.)
    it('refuses an address that two accounts point at rather than picking one', async () => {
      const bobBefore = await DbUser.findOneByOrFail({ id: bob.id })
      await DbUser.update({ id: bob.id }, { emailId: bibi.emailId })
      try {
        await expect(dbFindUserLoginByEmail('bibi@bloxberg.de')).rejects.toThrow(
          'DB_DUPLICATE_ENTRY',
        )
      } finally {
        await DbUser.update({ id: bob.id }, { emailId: bobBefore.emailId })
      }
    })

    // The address IN FORCE, which is what `users.email_id` names -- not any row that
    // carries the member's name. Signing in with an address they have moved away from
    // must not work, or a member who changed their address after a leak has changed
    // nothing.
    it('does not answer for an address the member no longer holds', async () => {
      const former = DbUserContact.create()
      former.userId = bibi.id
      former.type = bibi.emailContact.type
      former.email = 'bibi-was@bloxberg.de'
      former.emailChecked = true
      await DbUserContact.save(former)
      try {
        expect((await dbFindUserLoginByEmail('bibi-was@bloxberg.de')).success).toBe(false)
      } finally {
        await DbUserContact.delete({ id: former.id })
      }
    })
  })

  describe('dbUserUpdatePassword and dbUserUpdateField', () => {
    let bibi: DbUser

    beforeAll(async () => {
      await DbUser.clear()
      await DbUserContact.clear()
      bibi = await userFactory(bibiBloxberg)
    })

    // Both columns, in one write. A row holding a hash derived under one scheme while the
    // column names another cannot be signed in to at all, so the two must never be able
    // to disagree.
    it('stores the password together with the scheme it was derived under', async () => {
      await dbUserUpdatePassword(bibi.id, PasswordEncryptionType.GRADIDO_ID, 4711n)

      const stored = await DbUser.findOneByOrFail({ id: bibi.id })
      expect(stored.password.toString()).toBe('4711')
      expect(stored.passwordEncryptionType).toBe(PasswordEncryptionType.GRADIDO_ID)
    })

    it('writes the one named column and leaves the rest of the row alone', async () => {
      const before = await DbUser.findOneByOrFail({ id: bibi.id })

      await dbUserUpdateField(bibi.id, 'publisherId', 9876)

      const stored = await DbUser.findOneByOrFail({ id: bibi.id })
      expect(stored.publisherId).toBe(9876)
      expect(stored.firstName).toBe(before.firstName)
      expect(stored.alias).toBe(before.alias)
      expect(stored.password.toString()).toBe(before.password.toString())
    })

    // ⛔ The write half of customGeometry. A geometry column refuses a plain WKT string
    // ("Cannot get geometry object from data you send to the GEOMETRY field"): TypeORM
    // wrapped the parameter in ST_GeomFromText() itself and Drizzle does not, so the
    // custom type has to. `location` is reachable through this function -- it is a column
    // of `users` like any other -- which is what makes it worth holding down here.
    it('stores a position through the geometry column and reads it back', async () => {
      await dbUserUpdateField(bibi.id, 'location', {
        type: 'Point',
        coordinates: [8.6821, 50.1109],
      })

      const result = await dbFindUserLoginByEmail('bibi@bloxberg.de')
      expect(result.success).toBe(true)
      if (!result.success) {
        return
      }
      expect(result.value.location).toEqual({ type: 'Point', coordinates: [8.6821, 50.1109] })
      // ...and the TypeORM side reads the same row the same way, which is the point of
      // porting the transformer rather than inventing a second encoding.
      expect((await DbUser.findOneByOrFail({ id: bibi.id })).location).toEqual({
        type: 'Point',
        coordinates: [8.6821, 50.1109],
      })
    })

    // What Location2Point writes for "no position": a point with no coordinates. wkx turns
    // it into `POINT EMPTY`, which MariaDB accepts and stores as NULL -- the same "unset"
    // the column holds for every member who never set a pin. It must not raise.
    it('accepts a point without coordinates as "no position"', async () => {
      await dbUserUpdateField(bibi.id, 'location', { type: 'Point', coordinates: [] })

      const result = await dbFindUserLoginByEmail('bibi@bloxberg.de')
      expect(result.success).toBe(true)
      if (!result.success) {
        return
      }
      expect(result.value.location).toBeNull()
    })

    it('touches nobody else', async () => {
      const peter = await userFactory(peterLustig)

      await dbUserUpdateField(bibi.id, 'publisherId', 1111)

      expect((await DbUser.findOneByOrFail({ id: peter.id })).publisherId).toBe(
        peterLustig.publisherId ?? 0,
      )
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
      // Each member's latest balance - what the statistics resolver adds up.
      expect(rows.map((row) => row.balance.gddCent || 0n).sort()).toEqual(
        [bibiLatest.balance.gddCent, peterLatest.balance.gddCent].sort(),
      )
    })
  })

  // Two bookings at the very same moment - production had a member like that. Matching on
  // `balance_date = MAX(balance_date)` answered both rows, so the statistics counted the
  // member twice as active and added both balances.
  describe('dbSelectLatestUserBalances with two bookings at the same moment', () => {
    const FOREIGN_COMMUNITY = '99999999-9999-9999-9999-999999999999'
    const moment = new Date(Date.UTC(2026, 7, 7, 12, 0, 0))
    const fromAfar = (gradidoID: string) => ({
      communityUuid: FOREIGN_COMMUNITY,
      gradidoID,
      name: 'Sarah',
    })
    let bibi: DbUser

    beforeAll(async () => {
      await clearDatabase()
      await createCommunity(false)
      bibi = await userFactory(bibiBloxberg)
      await foreignReceive(
        bibi,
        fromAfar('dddddddd-dddd-dddd-dddd-dddddddddddd'),
        new Date(Date.UTC(2026, 7, 1, 12, 0, 0)),
      )
      await foreignReceive(
        bibi,
        fromAfar('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
        moment,
        new GradidoUnit(20000n),
      )
      await foreignReceive(
        bibi,
        fromAfar('ffffffff-ffff-ffff-ffff-ffffffffffff'),
        moment,
        new GradidoUnit(30000n),
      )
    })

    it('answers the member once, with the balance of the later booking', async () => {
      const rows = await dbSelectLatestUserBalances()
      const latest = await getLastTransaction(bibi.id)

      expect(rows).toHaveLength(1)
      expect(rows[0].balanceDate).toEqual(moment)
      expect(rows[0].balance?.gddCent).toBe(latest?.balance.gddCent)
    })
  })
})
