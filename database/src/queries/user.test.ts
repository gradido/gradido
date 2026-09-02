import { clearLogs, getLogger, printLogs } from '../../../config-schema/test/testSetup.bun'
import {
  ALIAS_ORIGIN_CHOSEN,
  Community as DbCommunity,
  User as DbUser,
  UserAlias as DbUserAlias,
  UserContact as DbUserContact,
} from '..'
import { AppDatabase } from '../AppDatabase'
import { createCommunity } from '../seeds/community'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { peterLustig } from '../seeds/users/peter-lustig'
import { LOG4JS_QUERIES_CATEGORY_NAME } from '.'
import {
  aliasExists,
  dbClearGmsRegistration,
  dbFindUsersByIds,
  dbLockUserRow,
  dbSaveUser,
  dbUpdateUserPassword,
  findForeignUserByUuids,
  findUserByIdentifier,
} from './user'
import { dbInsertUserAlias } from './userAliases'

const db = AppDatabase.getInstance()
const userIdentifierLoggerName = `${LOG4JS_QUERIES_CATEGORY_NAME}.user.findUserByIdentifier`

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
})
