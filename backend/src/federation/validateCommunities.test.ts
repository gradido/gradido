/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { logger } from '@test/testSetup'
import { Community as DbCommunity } from '@entity/Community'
import { testEnvironment, cleanDB } from '@test/helpers'
import { validateCommunities } from './validateCommunities'

let con: any
let testEnv: any

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  // await cleanDB()
  await con.close()
})

describe('validate Communities', () => {
  /*
  describe('start validation loop', () => {
    beforeEach(async () => {
      jest.clearAllMocks()
      startValidateCommunities(0)
    })

    it('logs loop started', () => {
      expect(logger.info).toBeCalledWith(
        `Federation: startValidateCommunities loop with an interval of 0 ms...`,
      )
    })
  })
  */
  describe('start validation logic without loop', () => {
    beforeEach(async () => {
      jest.clearAllMocks()
      await validateCommunities()
    })

    it('logs zero communities found', () => {
      expect(logger.debug).toBeCalledWith(`Federation: found 0 dbCommunities`)
    })

    describe('with one Community of api 1_0', () => {
      beforeEach(async () => {
        const variables1 = {
          publicKey: Buffer.from('11111111111111111111111111111111'),
          apiVersion: '1_0',
          endPoint: 'http//localhost:5001/api/',
          lastAnnouncedAt: new Date(),
        }
        await DbCommunity.createQueryBuilder()
          .insert()
          .into(DbCommunity)
          .values(variables1)
          .orUpdate({
            conflict_target: ['id', 'publicKey', 'apiVersion'],
            overwrite: ['end_point', 'last_announced_at'],
          })
          .execute()

        jest.clearAllMocks()
        await validateCommunities()
      })

      it('logs one community found', () => {
        expect(logger.debug).toBeCalledWith(`Federation: found 1 dbCommunities`)
      })
      it('logs requestGetPublicKey for community api 1_0 ', () => {
        expect(logger.info).toBeCalledWith(
          `requestGetPublicKey with endpoint='http//localhost:5001/api/1_0/getPublicKey'...`,
        )
      })
    })
    describe('with two Communities of api 1_0 and 1_1', () => {
      beforeEach(async () => {
        const variables2 = {
          publicKey: Buffer.from('11111111111111111111111111111111'),
          apiVersion: '1_1',
          endPoint: 'http//localhost:5001/api/',
          lastAnnouncedAt: new Date(),
        }
        await DbCommunity.createQueryBuilder()
          .insert()
          .into(DbCommunity)
          .values(variables2)
          .orUpdate({
            conflict_target: ['id', 'publicKey', 'apiVersion'],
            overwrite: ['end_point', 'last_announced_at'],
          })
          .execute()

        jest.clearAllMocks()
        await validateCommunities()
      })
      it('logs two communities found', () => {
        expect(logger.debug).toBeCalledWith(`Federation: found 2 dbCommunities`)
      })
      it('logs requestGetPublicKey for community api 1_0 ', () => {
        expect(logger.info).toBeCalledWith(
          `requestGetPublicKey with endpoint='http//localhost:5001/api/1_0/getPublicKey'...`,
        )
      })
      it('logs requestGetPublicKey for community api 1_1 ', () => {
        expect(logger.info).toBeCalledWith(
          `requestGetPublicKey with endpoint='http//localhost:5001/api/1_1/getPublicKey'...`,
        )
      })
    })
    describe('with three Communities of api 1_0, 1_1 and 2_0', () => {
      let dbCom: DbCommunity
      beforeEach(async () => {
        const variables3 = {
          publicKey: Buffer.from('11111111111111111111111111111111'),
          apiVersion: '2_0',
          endPoint: 'http//localhost:5001/api/',
          lastAnnouncedAt: new Date(),
        }
        await DbCommunity.createQueryBuilder()
          .insert()
          .into(DbCommunity)
          .values(variables3)
          .orUpdate({
            conflict_target: ['id', 'publicKey', 'apiVersion'],
            overwrite: ['end_point', 'last_announced_at'],
          })
          .execute()
        dbCom = await DbCommunity.findOneOrFail({
          where: { publicKey: variables3.publicKey, apiVersion: variables3.apiVersion },
        })
        jest.clearAllMocks()
        await validateCommunities()
      })
      it('logs three community found', () => {
        expect(logger.debug).toBeCalledWith(`Federation: found 3 dbCommunities`)
      })
      it('logs requestGetPublicKey for community api 1_0 ', () => {
        expect(logger.info).toBeCalledWith(
          `requestGetPublicKey with endpoint='http//localhost:5001/api/1_0/getPublicKey'...`,
        )
      })
      it('logs requestGetPublicKey for community api 1_1 ', () => {
        expect(logger.info).toBeCalledWith(
          `requestGetPublicKey with endpoint='http//localhost:5001/api/1_1/getPublicKey'...`,
        )
      })
      it('logs unsupported api for community with api 2_0 ', () => {
        expect(logger.warn).toBeCalledWith(
          `Federation: dbCom: ${dbCom.id} with unsupported apiVersion=2_0; supported versions=1_0,1_1`,
        )
      })
    })
  })
})
