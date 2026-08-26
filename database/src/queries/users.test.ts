import { clearLogs, getLogger, printLogs } from '../../../config-schema/test/testSetup.bun'
import { Community as DbCommunity, User as DbUser, UserContact as DbUserContact } from '..'
import { AppDatabase } from '../AppDatabase'
import { createCommunity } from '../seeds/community'
import { SeedUser, userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { peterLustig } from '../seeds/users/peter-lustig'
import { LOG4JS_QUERIES_CATEGORY_NAME } from '.'
import { aliasExists, findUserByIdentifier } from './user'

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
    let userBibi: SeedUser

    // The seed factory returns drizzle types while findUserByIdentifier still returns a
    // typeorm entity. Field names and column types differ between the two (gradidoId vs
    // gradidoID, password as bigint vs string), so compare the identifying fields rather
    // than the whole object. Can go back to a full match once both sides use drizzle.
    const expectedBibi = () => ({
      id: userBibi.id,
      gradidoID: userBibi.gradidoId,
      alias: userBibi.alias!,
      firstName: userBibi.firstName,
      lastName: userBibi.lastName,
    })

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
        const user = await findUserByIdentifier(userBibi.gradidoId, communityUuid)
        expect(user).toMatchObject(expectedBibi())
      })

      it('userIdentifier is alias', async () => {
        const user = await findUserByIdentifier(userBibi.alias!, communityUuid)
        expect(user).toMatchObject(expectedBibi())
      })

      it('userIdentifier is email', async () => {
        const user = await findUserByIdentifier(userBibi.emailContact.email, communityUuid)
        expect(user).toMatchObject(expectedBibi())
      })
      it('userIdentifier is unknown', async () => {
        const user = await findUserByIdentifier('unknown', communityUuid)
        expect(user).toBeNull()
      })
    })

    describe('communityIdentifier is community name', () => {
      it('userIdentifier is gradido id', async () => {
        const user = await findUserByIdentifier(userBibi.gradidoId, communityName)
        expect(user).toMatchObject(expectedBibi())
      })

      it('userIdentifier is alias', async () => {
        const user = await findUserByIdentifier(userBibi.alias!, communityName)
        expect(user).toMatchObject(expectedBibi())
      })

      it('userIdentifier is email', async () => {
        const user = await findUserByIdentifier(userBibi.emailContact.email, communityName)
        expect(user).toMatchObject(expectedBibi())
      })
    })
    describe('communityIdentifier is unknown', () => {
      it('userIdentifier is gradido id', async () => {
        const user = await findUserByIdentifier(userBibi.gradidoId, 'unknown')
        expect(user).toBeNull()
      })
      it('userIdentifier is unknown', async () => {
        const user = await findUserByIdentifier('unknown', communityUuid)
        expect(user).toBeNull()
      })
    })
    describe('communityIdentifier is empty', () => {
      it('userIdentifier is gradido id', async () => {
        const user = await findUserByIdentifier(userBibi.gradidoId)
        expect(user).toMatchObject(expectedBibi())
      })

      it('userIdentifier is alias', async () => {
        const user = await findUserByIdentifier(userBibi.alias!)
        expect(user).toMatchObject(expectedBibi())
      })

      it('userIdentifier is email', async () => {
        const user = await findUserByIdentifier(userBibi.emailContact.email)
        expect(user).toMatchObject(expectedBibi())
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
})
