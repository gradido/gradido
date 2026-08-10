import { clearLogs, getLogger, printLogs } from '../../../config-schema/test/testSetup.bun'
import { Community as DbCommunity, User as DbUser, UserContact as DbUserContact } from '..'
import { AppDatabase } from '../AppDatabase'
import { createCommunity } from '../seeds/community'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { peterLustig } from '../seeds/users/peter-lustig'
import { LOG4JS_QUERIES_CATEGORY_NAME } from '.'
import { aliasExists, dbClearGmsRegistration, findUserByIdentifier } from './user'

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
})
