/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Connection } from '@dbTools/typeorm'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { GraphQLClient } from 'graphql-request'
import { Response } from 'graphql-request/dist/types'

import { testEnvironment, cleanDB } from '@test/helpers'
import { logger } from '@test/testSetup'

import { schema as federationSchema } from '@/federation/server/schema'

import { validateCommunities } from './validateCommunities'

let con: Connection
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

const FEDERATION_API = '1_0'

beforeAll(async () => {
  testEnv = await testEnvironment(await federationSchema(FEDERATION_API), logger)
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

    describe('with one Community of api 1_0 but missing pubKey response', () => {
      beforeEach(async () => {
        // eslint-disable-next-line @typescript-eslint/require-await
        jest.spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(async () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return { data: {} } as Response<unknown>
        })
        const variables1 = {
          publicKey: Buffer.from('11111111111111111111111111111111'),
          apiVersion: '1_0',
          endPoint: 'http//localhost:5001/api/',
          lastAnnouncedAt: new Date(),
        }
        await DbFederatedCommunity.createQueryBuilder()
          .insert()
          .into(DbFederatedCommunity)
          .values(variables1)
          .orUpdate({
            // eslint-disable-next-line camelcase
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
      it('logs requestGetPublicKey missing response data ', () => {
        expect(logger.warn).toBeCalledWith(
          'Federation: getPublicKey without response data from endpoint',
          'http//localhost:5001/api/1_0/',
        )
      })
    })

    describe('with one Community of api 1_0 and not matching pubKey', () => {
      beforeEach(async () => {
        // eslint-disable-next-line @typescript-eslint/require-await
        jest.spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(async () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return {
            data: {
              getPublicKey: {
                publicKey: 'somePubKey',
              },
            },
          } as Response<unknown>
        })
        const variables1 = {
          publicKey: Buffer.from('11111111111111111111111111111111'),
          apiVersion: '1_0',
          endPoint: 'http//localhost:5001/api/',
          lastAnnouncedAt: new Date(),
        }
        await DbFederatedCommunity.createQueryBuilder()
          .insert()
          .into(DbFederatedCommunity)
          .values(variables1)
          .orUpdate({
            // eslint-disable-next-line camelcase
            conflict_target: ['id', 'publicKey', 'apiVersion'],
            overwrite: ['end_point', 'last_announced_at'],
          })
          .execute()
        /*
        // eslint-disable-next-line @typescript-eslint/require-await
        jest.spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(async () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
        jest.clearAllMocks()
        await validateCommunities()
      })

      it('logs one community found', () => {
        expect(logger.debug).toBeCalledWith(`Federation: found 1 dbCommunities`)
      })
      it('logs requestGetPublicKey for community api 1_0 ', () => {
        expect(logger.debug).toBeCalledWith(
          'Federation: getPublicKey from endpoint',
          'http//localhost:5001/api/1_0/',
        )
      })
      it('logs not matching publicKeys', () => {
        expect(logger.warn).toBeCalledWith(
          'Federation: received not matching publicKey:',
          'somePubKey',
          expect.stringMatching('11111111111111111111111111111111'),
        )
      })
    })
    describe('with one Community of api 1_0 and matching pubKey', () => {
      beforeEach(async () => {
        // eslint-disable-next-line @typescript-eslint/require-await
        jest.spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(async () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return {
            data: {
              getPublicKey: {
                publicKey: '11111111111111111111111111111111',
              },
            },
          } as Response<unknown>
        })
        const variables1 = {
          publicKey: Buffer.from('11111111111111111111111111111111'),
          apiVersion: '1_0',
          endPoint: 'http//localhost:5001/api/',
          lastAnnouncedAt: new Date(),
        }
        await DbFederatedCommunity.createQueryBuilder()
          .insert()
          .into(DbFederatedCommunity)
          .values(variables1)
          .orUpdate({
            // eslint-disable-next-line camelcase
            conflict_target: ['id', 'publicKey', 'apiVersion'],
            overwrite: ['end_point', 'last_announced_at'],
          })
          .execute()
        await DbFederatedCommunity.update({}, { verifiedAt: null })
        jest.clearAllMocks()
        await validateCommunities()
      })

      it('logs one community found', () => {
        expect(logger.debug).toBeCalledWith(`Federation: found 1 dbCommunities`)
      })
      it('logs requestGetPublicKey for community api 1_0 ', () => {
        expect(logger.debug).toBeCalledWith(
          'Federation: getPublicKey from endpoint',
          'http//localhost:5001/api/1_0/',
        )
      })
      it('logs community pubKey verified', () => {
        expect(logger.debug).toHaveBeenNthCalledWith(
          5,
          'Federation: getPublicKey successful from endpoint',
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
        // eslint-disable-next-line @typescript-eslint/require-await
        jest.spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(async () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
            // eslint-disable-next-line camelcase
            conflict_target: ['id', 'publicKey', 'apiVersion'],
            overwrite: ['end_point', 'last_announced_at'],
          })
          .execute()

        await DbFederatedCommunity.update({}, { verifiedAt: null })
        jest.clearAllMocks()
        await validateCommunities()
      })
      it('logs two communities found', () => {
        expect(logger.debug).toBeCalledWith(`Federation: found 2 dbCommunities`)
      })
      it('logs requestGetPublicKey for community api 1_0 ', () => {
        expect(logger.debug).toBeCalledWith(
          'Federation: getPublicKey from endpoint',
          'http//localhost:5001/api/1_0/',
        )
      })
      it('logs requestGetPublicKey for community api 1_1 ', () => {
        expect(logger.debug).toBeCalledWith(
          'Federation: getPublicKey from endpoint',
          'http//localhost:5001/api/1_1/',
        )
      })
    })
    describe('with three Communities of api 1_0, 1_1 and 2_0', () => {
      let dbCom: DbFederatedCommunity
      beforeEach(async () => {
        const variables3 = {
          publicKey: Buffer.from('11111111111111111111111111111111'),
          apiVersion: '2_0',
          endPoint: 'http//localhost:5001/api/',
          lastAnnouncedAt: new Date(),
        }
        await DbFederatedCommunity.createQueryBuilder()
          .insert()
          .into(DbFederatedCommunity)
          .values(variables3)
          .orUpdate({
            // eslint-disable-next-line camelcase
            conflict_target: ['id', 'publicKey', 'apiVersion'],
            overwrite: ['end_point', 'last_announced_at'],
          })
          .execute()
        dbCom = await DbFederatedCommunity.findOneOrFail({
          where: { publicKey: variables3.publicKey, apiVersion: variables3.apiVersion },
        })
        await DbFederatedCommunity.update({}, { verifiedAt: null })
        jest.clearAllMocks()
        await validateCommunities()
      })
      it('logs three community found', () => {
        expect(logger.debug).toBeCalledWith(`Federation: found 3 dbCommunities`)
      })
      it('logs requestGetPublicKey for community api 1_0 ', () => {
        expect(logger.debug).toBeCalledWith(
          'Federation: getPublicKey from endpoint',
          'http//localhost:5001/api/1_0/',
        )
      })
      it('logs requestGetPublicKey for community api 1_1 ', () => {
        expect(logger.debug).toBeCalledWith(
          'Federation: getPublicKey from endpoint',
          'http//localhost:5001/api/1_1/',
        )
      })
      it('logs unsupported api for community with api 2_0 ', () => {
        expect(logger.warn).toBeCalledWith(
          'Federation: dbCom with unsupported apiVersion',
          dbCom.endPoint,
          '2_0',
        )
      })
    })
  })
})
