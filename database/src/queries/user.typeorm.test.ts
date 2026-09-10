// AI-GENERATED — not an architecture reference
import { Order } from 'shared'
import { clearLogs, getLogger, printLogs } from '../../../config-schema/test/testSetup.bun'
import {
  ALIAS_ORIGIN_CHOSEN,
  Community as DbCommunity,
  User as DbUser,
  UserAlias as DbUserAlias,
  UserContact as DbUserContact,
  UserRole as DbUserRole,
} from '..'
import { AppDatabase } from '../AppDatabase'
import { RoleNames } from '../enum'
import { createCommunity } from '../seeds/community'
import { createUserRole, userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { peterLustig } from '../seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '../seeds/users/raeuber-hotzenplotz'
import { LOG4JS_QUERIES_CATEGORY_NAME } from '.'
import {
  dbFindAdminUsersPage,
  dbFindForeignUsersByGradidoIds,
  dbFindUsersByIds,
  dbFindUsersWithEmailContactPage,
  dbGetUserWithRolesById,
  dbLockUserRow,
  dbSaveUser,
  dbSetCreationAllowed,
  dbUpdateUserPassword,
  findForeignUserByUuids,
  findUserByIdentifier,
} from './user.typeorm'
import { dbInsertUserAlias } from './userAliases'

const db = AppDatabase.getInstance()
const userIdentifierLoggerName = `${LOG4JS_QUERIES_CATEGORY_NAME}.user.findUserByIdentifier`

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('user.typeorm.queries', () => {
  describe('findUserByIdentifier', () => {
    let homeCom: DbCommunity
    let communityUuid: string
    let communityName: string
    let userBibi: DbUser

    beforeAll(async () => {
      await DbUser.clear()
      await DbUserContact.clear()
      await DbCommunity.clear()

      homeCom = await createCommunity(false)
      communityUuid = homeCom.communityUuid!
      communityName = homeCom.name!
      userBibi = await userFactory(bibiBloxberg)
      await userFactory(peterLustig)
      await userFactory(bobBaumeister)
    })
    beforeEach(() => {
      clearLogs()
    })
    describe('communityIdentifier is community uuid', () => {
      it('userIdentifier is gradido id', async () => {
        const user = await findUserByIdentifier(userBibi.gradidoID, communityUuid)
        expect(user).toMatchObject(userBibi)
      })

      it('userIdentifier is alias', async () => {
        const user = await findUserByIdentifier(userBibi.alias, communityUuid)
        expect(user).toMatchObject(userBibi)
      })

      it('userIdentifier is email', async () => {
        const user = await findUserByIdentifier(userBibi.emailContact.email, communityUuid)
        expect(user).toMatchObject(userBibi)
      })
      it('userIdentifier is unknown', async () => {
        const user = await findUserByIdentifier('unknown', communityUuid)
        expect(user).toBeNull()
      })
    })

    describe('communityIdentifier is community name', () => {
      it('userIdentifier is gradido id', async () => {
        const user = await findUserByIdentifier(userBibi.gradidoID, communityName)
        expect(user).toMatchObject(userBibi)
      })

      it('userIdentifier is alias', async () => {
        const user = await findUserByIdentifier(userBibi.alias, communityName)
        expect(user).toMatchObject(userBibi)
      })

      it('userIdentifier is email', async () => {
        const user = await findUserByIdentifier(userBibi.emailContact.email, communityName)
        expect(user).toMatchObject(userBibi)
      })
    })
    describe('communityIdentifier is unknown', () => {
      it('userIdentifier is gradido id', async () => {
        const user = await findUserByIdentifier(userBibi.gradidoID, 'unknown')
        expect(user).toBeNull()
      })
      it('userIdentifier is unknown', async () => {
        const user = await findUserByIdentifier('unknown', communityUuid)
        expect(user).toBeNull()
      })
    })
    describe('communityIdentifier is empty', () => {
      it('userIdentifier is gradido id', async () => {
        const user = await findUserByIdentifier(userBibi.gradidoID)
        expect(user).toMatchObject(userBibi)
      })

      it('userIdentifier is alias', async () => {
        const user = await findUserByIdentifier(userBibi.alias)
        expect(user).toMatchObject(userBibi)
      })

      it('userIdentifier is email', async () => {
        const user = await findUserByIdentifier(userBibi.emailContact.email)
        expect(user).toMatchObject(userBibi)
      })
      it('userIdentifier is unknown type', async () => {
        const user = await findUserByIdentifier('sa')
        printLogs()
        expect(getLogger(userIdentifierLoggerName).warn).toHaveBeenCalledWith(
          'Unknown identifier type',
          'sa',
        )
        expect(user).toBeNull()
      })
    })
  })

  // The point of keeping every name a member ever held: a card printed under the old
  // one still reaches them. This is the path `…/u/alias` takes.
  describe('finding somebody by a name they no longer use', () => {
    let homeCom: DbCommunity
    let communityUuid: string
    let communityName: string
    let bibi: DbUser

    beforeAll(async () => {
      await DbUserAlias.clear()
      await DbUser.clear()
      await DbUserContact.clear()
      await DbCommunity.clear()

      homeCom = await createCommunity(false)
      communityUuid = homeCom.communityUuid!
      communityName = homeCom.name!
      bibi = await userFactory({ ...bibiBloxberg, alias: 'newname' })
      await dbInsertUserAlias(bibi.id, 'oldname', communityUuid, ALIAS_ORIGIN_CHOSEN)
    })

    it('finds them by the name they hold now', async () => {
      const user = await findUserByIdentifier('newname', communityUuid)
      expect(user?.id).toBe(bibi.id)
    })

    it('finds them by a name they left behind', async () => {
      const user = await findUserByIdentifier('oldname', communityUuid)
      expect(user?.id).toBe(bibi.id)
    })

    // The community may arrive as a name rather than a uuid - the wallet resolves it
    // either way - and an earlier lookup passed it straight into a uuid column, so this
    // path silently found nothing.
    it('finds them by an earlier name when the community is given by name', async () => {
      const user = await findUserByIdentifier('oldname', communityName)
      expect(user?.id).toBe(bibi.id)
    })

    it('still finds nobody for a name that was never held', async () => {
      expect(await findUserByIdentifier('nevermine', communityUuid)).toBeNull()
    })
  })

  describe('dbFindUsersByIds', () => {
    let bibi: DbUser
    let peter: DbUser
    let bob: DbUser

    beforeAll(async () => {
      await DbUser.clear()
      await DbUserContact.clear()
      await DbCommunity.clear()
      await createCommunity(false)
      bibi = await userFactory(bibiBloxberg)
      peter = await userFactory(peterLustig)
      bob = await userFactory(bobBaumeister)
      await DbUser.update({ id: bob.id }, { deletedAt: new Date() })
    })

    it('answers the rows for the ids, and nothing for an empty list', async () => {
      const rows = await dbFindUsersByIds([bibi.id, peter.id])
      expect(rows.map((row) => row.id).sort()).toEqual([bibi.id, peter.id].sort())
      expect(await dbFindUsersByIds([])).toEqual([])
    })

    it('leaves a deleted member out unless asked to keep them', async () => {
      const living = await dbFindUsersByIds([bibi.id, bob.id])
      expect(living.map((row) => row.id)).toEqual([bibi.id])
      const all = await dbFindUsersByIds([bibi.id, bob.id], { withDeleted: true })
      expect(all.map((row) => row.id).sort()).toEqual([bibi.id, bob.id].sort())
      expect(all.find((row) => row.id === bob.id)?.deletedAt).not.toBeNull()
    })
  })

  describe('findForeignUserByUuids', () => {
    const FOREIGN_COMMUNITY = '99999999-9999-9999-9999-999999999999'
    let sarah: DbUser

    beforeAll(async () => {
      await DbUser.clear()
      await DbUserContact.clear()
      await DbCommunity.clear()
      await createCommunity(false)
      // A local member with the same gradido id as the foreign one: only the foreign row
      // may come back, whichever way the pair is asked for.
      const local = await userFactory(peterLustig)
      sarah = await userFactory(bibiBloxberg)
      await DbUser.update({ id: sarah.id }, { foreign: true, communityUuid: FOREIGN_COMMUNITY })
      await DbUser.update({ id: local.id }, { gradidoID: sarah.gradidoID })
    })

    it('finds the foreign row by the pair', async () => {
      const found = await findForeignUserByUuids(FOREIGN_COMMUNITY, sarah.gradidoID)
      expect(found?.id).toBe(sarah.id)
      expect(
        await findForeignUserByUuids('00000000-0000-0000-0000-000000000000', sarah.gradidoID),
      ).toBeNull()
    })

    it('goes by the gradido id alone when the booking carries no community uuid', async () => {
      const found = await findForeignUserByUuids(null, sarah.gradidoID)
      expect(found?.id).toBe(sarah.id)
      expect(await findForeignUserByUuids(null, 'nobody')).toBeNull()
    })

    it('answers a whole set of ids at once, foreign rows only', async () => {
      const rows = await dbFindForeignUsersByGradidoIds([sarah.gradidoID, 'nobody'])
      expect(rows.map((row) => row.id)).toEqual([sarah.id])
      expect(await dbFindForeignUsersByGradidoIds([])).toEqual([])
    })
  })

  describe('dbSaveUser', () => {
    let bibi: DbUser

    beforeAll(async () => {
      await DbUserAlias.clear()
      await DbUser.clear()
      await DbUserContact.clear()
      await DbCommunity.clear()

      await createCommunity(false)
      bibi = await userFactory(bibiBloxberg)
    })

    it('writes the changed row', async () => {
      bibi.language = 'en'
      await dbSaveUser(bibi)

      expect((await DbUser.findOneByOrFail({ id: bibi.id })).language).toBe('en')
    })

    // The e-mail change moves `email_id` inside one transaction together with the contact
    // row; a save that ignored the manager would slip out of that transaction.
    it('writes through a given manager, inside its transaction', async () => {
      const runner = db.getDataSource().createQueryRunner()
      await runner.connect()
      await runner.startTransaction()
      bibi.language = 'fr'
      await dbSaveUser(bibi, runner.manager)
      await runner.rollbackTransaction()
      await runner.release()

      expect((await DbUser.findOneByOrFail({ id: bibi.id })).language).toBe('en')
    })
  })

  describe('dbLockUserRow', () => {
    let bibi: DbUser

    beforeAll(async () => {
      await DbUserAlias.clear()
      await DbUser.clear()
      await DbUserContact.clear()
      await DbCommunity.clear()

      await createCommunity(false)
      bibi = await userFactory(bibiBloxberg)
    })

    // What a lock does to a concurrent writer cannot be shown in a single-connection test;
    // what can be shown is that it runs inside a transaction and changes nothing by itself.
    it('takes the row inside a transaction and leaves the member as they are', async () => {
      const runner = db.getDataSource().createQueryRunner()
      await runner.connect()
      await runner.startTransaction()
      await expect(dbLockUserRow(bibi.id, runner.manager)).resolves.toBeUndefined()
      await runner.commitTransaction()
      await runner.release()

      expect((await DbUser.findOneByOrFail({ id: bibi.id })).alias).toBe(bibi.alias)
    })
  })

  describe('an address the member has left behind', () => {
    let bibi: DbUser
    let leftBehind: string

    beforeAll(async () => {
      await DbUserAlias.clear()
      await DbUser.clear()
      await DbUserContact.clear()
      await DbCommunity.clear()

      await createCommunity(false)
      bibi = await userFactory(bibiBloxberg)
      leftBehind = bibi.emailContact.email

      // What a confirmed e-mail change leaves: the old row stays - it is the address the GDT
      // server knows the member by - and `users.email_id` points at the new one.
      const moved = DbUserContact.create({
        userId: bibi.id,
        email: 'bibi-moved-on@bloxberg.de',
        type: bibi.emailContact.type,
        emailChecked: true,
        emailOptInTypeId: bibi.emailContact.emailOptInTypeId,
        emailVerificationCode: '112233445566778899',
      })
      await moved.save()
      // Through the column, not through the entity: `bibi` still carries its ORIGINAL
      // `emailContact` relation, and that relation IS `email_id` - saving the entity would
      // write the old contact's id straight back over the new one. That is precisely what
      // happened on the first run, and it made both tests below fail for opposite reasons.
      await DbUser.update({ id: bibi.id }, { emailId: moved.id })
      // So the fixture has to prove itself. A silent no-op here would leave two tests that
      // look like they cover something and cover the reverse.
      expect((await DbUser.findOneByOrFail({ id: bibi.id })).emailId).toBe(moved.id)
    })

    // `UserContact.user` IS `users.email_id`, seen from the other side, so the row left
    // behind has no member on it at all. Nothing else in the query tells it apart from a
    // current address - it is still `emailChecked` - and the relation condition is a LEFT
    // JOIN, so it comes through. Before the guard the next line wrote to null.
    it('answers with nothing instead of falling over', async () => {
      expect(await findUserByIdentifier(leftBehind)).toBeNull()
    })

    it('still finds the member under the address that is now in force', async () => {
      expect((await findUserByIdentifier('bibi-moved-on@bloxberg.de'))?.id).toBe(bibi.id)
    })
  })

  describe('dbUpdateUserPassword', () => {
    let before: DbUser

    beforeAll(async () => {
      await DbUser.clear()
      await DbUserContact.clear()
      await userFactory(bibiBloxberg)
      before = (await DbUser.find())[0]
    })

    it('re-keys the two password columns and leaves the rest of the row alone', async () => {
      const newType = before.passwordEncryptionType === 1 ? 2 : 1
      await dbUpdateUserPassword(before.id, BigInt('987654321987654321'), newType)
      const after = await DbUser.findOneByOrFail({ id: before.id })
      // bigint columns come back as strings from the driver - compare as text.
      expect(String(after.password)).toBe('987654321987654321')
      expect(after.passwordEncryptionType).toBe(newType)
      // The reason this function exists instead of a save(): nothing else moves - the
      // email marker above all (see the fixture comment two describes up for what a
      // stale entity save() does to it).
      expect(after.emailId).toBe(before.emailId)
      expect(after.firstName).toBe(before.firstName)
      expect(after.gradidoID).toBe(before.gradidoID)
    })
  })

  describe('dbSetCreationAllowed', () => {
    let before: DbUser

    beforeAll(async () => {
      await DbUser.clear()
      await DbUserContact.clear()
      await userFactory(bibiBloxberg)
      before = (await DbUser.find())[0]
    })

    it('starts as a person who may create, and switches off and on again', async () => {
      // The column's default is the sentence for every existing account.
      expect(before.creationAllowed).toBe(true)

      const off = await dbSetCreationAllowed(before.id, false)
      expect(off.success).toBe(true)
      expect((await DbUser.findOneByOrFail({ id: before.id })).creationAllowed).toBe(false)

      const on = await dbSetCreationAllowed(before.id, true)
      expect(on.success).toBe(true)
      const after = await DbUser.findOneByOrFail({ id: before.id })
      expect(after.creationAllowed).toBe(true)
      // Nothing else moved.
      expect(after.emailId).toBe(before.emailId)
      expect(after.firstName).toBe(before.firstName)
    })

    it('counts writing the value the row already holds as a success', async () => {
      expect((await dbSetCreationAllowed(before.id, true)).success).toBe(true)
    })

    it('reports an id nobody has as not found', async () => {
      const result = await dbSetCreationAllowed(424242, false)
      expect(result.success).toBe(false)
    })

    it('writes through a given manager, so a rolled-back transaction takes it back', async () => {
      // The throw below is the rollback; anything else out of the block is a real failure.
      await expect(
        db.getDataSource().transaction(async (manager) => {
          expect((await dbSetCreationAllowed(before.id, false, manager)).success).toBe(true)
          throw new Error('roll it back')
        }),
      ).rejects.toThrow('roll it back')
      expect((await DbUser.findOneByOrFail({ id: before.id })).creationAllowed).toBe(true)
    })
  })

  describe('dbGetUserWithRolesById', () => {
    let peter: DbUser
    let bibi: DbUser

    beforeAll(async () => {
      await DbUser.clear()
      await DbUserContact.clear()
      // `clear()` truncates and restarts the ids, so role rows the earlier describes left
      // behind would attach themselves to whoever gets those ids next.
      await DbUserRole.clear()
      peter = await userFactory(peterLustig)
      bibi = await userFactory(bibiBloxberg)
    })

    it('brings the role row along, so a stored id can be checked without a request', async () => {
      const found = await dbGetUserWithRolesById(peter.id)
      expect(found.success).toBe(true)
      if (found.success) {
        expect(found.value.id).toBe(peter.id)
        expect(found.value.userRoles.map((role) => role.role)).toEqual(['ADMIN'])
        expect(found.value.emailContact).toBeDefined()
      }
    })

    it('answers an empty role list for a plain member', async () => {
      const found = await dbGetUserWithRolesById(bibi.id)
      expect(found.success && found.value.userRoles).toEqual([])
    })

    it('reports an id nobody has as not found rather than throwing', async () => {
      const missing = await dbGetUserWithRolesById(999999)
      expect(missing.success).toBe(false)
      if (!missing.success) {
        expect(missing.error.name).toBe('DBNotFoundError')
      }
    })
  })

  // Pages are only pages over a fixed order. Three members with the very same `createdAt`
  // are where an order by `createdAt` alone stops being one.
  describe('paging through members', () => {
    const sameMoment = new Date(Date.UTC(2026, 0, 1, 12, 0, 0))
    let ids: number[]

    beforeAll(async () => {
      await DbUser.clear()
      await DbUserContact.clear()
      await DbUserRole.clear()
      const members = [
        await userFactory(bibiBloxberg),
        await userFactory(bobBaumeister),
        await userFactory(raeuberHotzenplotz),
      ]
      for (const member of members) {
        await createUserRole(member.id, RoleNames.MODERATOR)
      }
      // A member without a role, so the admin list has somebody to leave out.
      await userFactory(peterLustig)
      await DbUserRole.delete({ role: RoleNames.ADMIN })
      await DbUser.createQueryBuilder().update().set({ createdAt: sameMoment }).execute()
      ids = members.map((member) => member.id).sort((a, b) => a - b)
    })

    it('lists the moderators newest first, and equal timestamps by id the same way', async () => {
      const [first, count] = await dbFindAdminUsersPage(1, 2, Order.DESC)
      const [second] = await dbFindAdminUsersPage(2, 2, Order.DESC)
      expect(count).toBe(3)
      expect(first.map((user) => user.id)).toEqual([ids[2], ids[1]])
      expect(second.map((user) => user.id)).toEqual([ids[0]])

      const [ascending] = await dbFindAdminUsersPage(1, 3, Order.ASC)
      expect(ascending.map((user) => user.id)).toEqual(ids)
    })

    it('walks every member with an address exactly once, by id', async () => {
      const [first, count] = await dbFindUsersWithEmailContactPage(0, 3)
      const [second] = await dbFindUsersWithEmailContactPage(1, 3)
      expect(count).toBe(4)
      const walked = [...first, ...second].map((user) => user.id)
      expect(walked).toEqual([...walked].sort((a, b) => a - b))
      expect(new Set(walked).size).toBe(4)
    })
  })
})
