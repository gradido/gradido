import { cleanDB, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'
import { Response } from 'graphql-request/dist/types'
import { DataSource, Not } from 'typeorm'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

import { validateCommunities } from './validateCommunities'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.validateCommunities`)
const federationClientLogger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.federation.client.1_0.FederationClient`,
)

let con: DataSource
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: DataSource
}

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  // await cleanDB()
  await con.destroy()
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
      expect(logger.debug).toBeCalledWith(`found 0 dbCommunities`)
    })

    describe('with one Community of api 1_0 but missing pubKey response', () => {
      beforeEach(async () => {
        jest.clearAllMocks()

        jest.spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(async () => {
          return { data: {} } as Response<unknown>
        })
        const variables1 = {
          publicKey: Buffer.from('11111111111111111111111111111111', 'hex'),
          apiVersion: '1_0',
          endPoint: 'http//localhost:5001/api/',
          lastAnnouncedAt: new Date(),
        }
        await DbFederatedCommunity.createQueryBuilder()
          .insert()
          .into(DbFederatedCommunity)
          .values(variables1)
          .orUpdate({
            conflict_target: ['id', 'publicKey', 'apiVersion'],
            overwrite: ['end_point', 'last_announced_at'],
          })
          .execute()
        // jest.clearAllMocks()
        await validateCommunities()
      })

      it('logs one community found', () => {
        expect(logger.debug).toBeCalledWith(`found 1 dbCommunities`)
      })
      it('logs requestGetPublicKey missing response data ', () => {
        expect(federationClientLogger.warn).toBeCalledWith(
          'getPublicKey without response data from endpoint',
          'http//localhost:5001/api/1_0/',
        )
      })
    })

    describe('with one Community of api 1_0 and not matching pubKey', () => {
      beforeEach(async () => {
        jest.clearAllMocks()

        jest.spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(async () => {
          return {
            data: {
              getPublicKey: {
                publicKey: '2222222222222222222222222222222222222222222222222222222222222222',
              },
            },
          } as Response<unknown>
        })
        const variables1 = {
          publicKey: Buffer.from('11111111111111111111111111111111', 'hex'),
          apiVersion: '1_0',
          endPoint: 'http//localhost:5001/api/',
          lastAnnouncedAt: new Date(),
        }
        await DbFederatedCommunity.createQueryBuilder()
          .insert()
          .into(DbFederatedCommunity)
          .values(variables1)
          .orUpdate({
            conflict_target: ['id', 'publicKey', 'apiVersion'],
            overwrite: ['end_point', 'last_announced_at'],
          })
          .execute()
        /*

        jest.spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(async () => {

          return {
            data: {
              getPublicCommunityInfo: {
                name: 'Test-Community',
                description: 'Description of Test-Community',
                createdAt: 'someDate',
                publicKey: 'somePubKey',
              },
            },
          } as Response<unknown>
        })
        const variables2 = {
          publicKey: Buffer.from('11111111111111111111111111111111'),
          apiVersion: '1_0',
          endPoint: 'http//localhost:5001/api/',
          lastAnnouncedAt: new Date(),
        }
        await DbCommunity.createQueryBuilder()
          .insert()
          .into(DbFederatedCommunity)
          .values(variables1)
          .orUpdate({
            conflict_target: ['id', 'publicKey', 'apiVersion'],
            overwrite: ['end_point', 'last_announced_at'],
          })
          .execute()
        */
        // jest.clearAllMocks()
        await validateCommunities()
      })

      it('logs one community found', () => {
        expect(logger.debug).toBeCalledWith(`found 1 dbCommunities`)
      })
      it('logs requestGetPublicKey for community api 1_0 ', () => {
        expect(federationClientLogger.debug).toBeCalledWith(
          'getPublicKey from endpoint',
          'http//localhost:5001/api/1_0/',
        )
      })
      it('logs not matching publicKeys', () => {
        expect(logger.debug).toBeCalledWith(
          'received not matching publicKey:',
          '2222222222222222222222222222222222222222222222222222222222222222',
          expect.stringMatching('1111111111111111111111111111111100000000000000000000000000000000'),
        )
      })
    })
    describe('with one Community of api 1_0 and matching pubKey', () => {
      beforeEach(async () => {
        jest.clearAllMocks()

        jest.spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(async () => {
          return {
            data: {
              getPublicKey: {
                publicKey: '11111111111111111111111111111111',
              },
            },
          } as Response<unknown>
        })
        const variables1 = {
          publicKey: Buffer.from('11111111111111111111111111111111', 'hex'),
          apiVersion: '1_0',
          endPoint: 'http//localhost:5001/api/',
          lastAnnouncedAt: new Date(),
        }
        await DbFederatedCommunity.createQueryBuilder()
          .insert()
          .into(DbFederatedCommunity)
          .values(variables1)
          .orUpdate({
            conflict_target: ['id', 'publicKey', 'apiVersion'],
            overwrite: ['end_point', 'last_announced_at'],
          })
          .execute()
        await DbFederatedCommunity.update({ id: Not(0) }, { verifiedAt: null })
        // jest.clearAllMocks()
        await validateCommunities()
      })

      it('logs one community found', () => {
        expect(logger.debug).toBeCalledWith(`found 1 dbCommunities`)
      })
      it('logs requestGetPublicKey for community api 1_0 ', () => {
        expect(federationClientLogger.debug).toBeCalledWith(
          'getPublicKey from endpoint',
          'http//localhost:5001/api/1_0/',
        )
      })
      it('logs community pubKey verified', () => {
        expect(federationClientLogger.debug).toHaveBeenNthCalledWith(
          2,
          'getPublicKey successful from endpoint',
          'http//localhost:5001/api/1_0/',
          '11111111111111111111111111111111',
        )
        /*
        await expect(DbCommunity.find()).resolves.toContainEqual(
          expect.objectContaining({
            foreign: false,
            url: 'http://localhost/api',
            publicKey: Buffer.from('11111111111111111111111111111111'),
            privateKey: expect.any(Buffer),
            communityUuid: expect.any(String),
            authenticatedAt: expect.any(Date),
            name: expect.any(String),
            description: expect.any(String),
            creationDate: expect.any(Date),
          }),
        )
        */
      })
    })
    describe('with two Communities of api 1_0 and 1_1', () => {
      beforeEach(async () => {
        jest.clearAllMocks()

        jest.spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(async () => {
          return {
            data: {
              getPublicKey: {
                publicKey: '11111111111111111111111111111111',
              },
            },
          } as Response<unknown>
        })
        const variables2 = {
          publicKey: Buffer.from('11111111111111111111111111111111'),
          apiVersion: '1_1',
          endPoint: 'http//localhost:5001/api/',
          lastAnnouncedAt: new Date(),
        }
        await DbFederatedCommunity.createQueryBuilder()
          .insert()
          .into(DbFederatedCommunity)
          .values(variables2)
          .orUpdate({
            conflict_target: ['id', 'publicKey', 'apiVersion'],
            overwrite: ['end_point', 'last_announced_at'],
          })
          .execute()

        await DbFederatedCommunity.update({ id: Not(0) }, { verifiedAt: null })
        // jest.clearAllMocks()
        await validateCommunities()
      })
      it('logs two communities found', () => {
        expect(logger.debug).toBeCalledWith(`found 2 dbCommunities`)
      })
      it('logs requestGetPublicKey for community api 1_0 ', () => {
        expect(federationClientLogger.debug).toBeCalledWith(
          'getPublicKey from endpoint',
          'http//localhost:5001/api/1_0/',
        )
      })
      it('logs requestGetPublicKey for community api 1_1 ', () => {
        expect(federationClientLogger.debug).toBeCalledWith(
          'getPublicKey from endpoint',
          'http//localhost:5001/api/1_1/',
        )
      })
    })
    describe('with three Communities of api 1_0, 1_1 and 2_0', () => {
      let dbCom: DbFederatedCommunity
      beforeEach(async () => {
        jest.clearAllMocks()

        jest.spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(async () => {
          return {
            data: {
              getPublicKey: {
                publicKey: '11111111111111111111111111111111',
              },
            },
          } as Response<unknown>
        })
        const variables3 = {
          publicKey: Buffer.from('11111111111111111111111111111111', 'hex'),
          apiVersion: '2_0',
          endPoint: 'http//localhost:5001/api/',
          lastAnnouncedAt: new Date(),
        }
        await DbFederatedCommunity.createQueryBuilder()
          .insert()
          .into(DbFederatedCommunity)
          .values(variables3)
          .orUpdate({
            conflict_target: ['id', 'publicKey', 'apiVersion'],
            overwrite: ['end_point', 'last_announced_at'],
          })
          .execute()
        dbCom = await DbFederatedCommunity.findOneOrFail({
          where: { publicKey: variables3.publicKey, apiVersion: variables3.apiVersion },
        })
        await DbFederatedCommunity.update({ id: Not(0) }, { verifiedAt: null })
        // jest.clearAllMocks()
        await validateCommunities()
      })
      it('logs three community found', () => {
        expect(logger.debug).toBeCalledWith(`found 3 dbCommunities`)
      })
      it('logs requestGetPublicKey for community api 1_0 ', () => {
        expect(federationClientLogger.debug).toBeCalledWith(
          'getPublicKey from endpoint',
          'http//localhost:5001/api/1_0/',
        )
      })
      it('logs requestGetPublicKey for community api 1_1 ', () => {
        expect(federationClientLogger.debug).toBeCalledWith(
          'getPublicKey from endpoint',
          'http//localhost:5001/api/1_1/',
        )
      })
      it('logs unsupported api for community with api 2_0 ', () => {
        expect(logger.debug).toBeCalledWith(
          'dbFedComB with unsupported apiVersion',
          dbCom.endPoint,
          '2_0',
        )
      })
    })
  })
})
