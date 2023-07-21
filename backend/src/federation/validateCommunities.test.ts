/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Connection } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { ApolloServerTestClient } from 'apollo-server-testing'
// eslint-disable-next-line import/no-extraneous-dependencies
import { Headers } from 'cross-fetch'
import { GraphQLClient } from 'graphql-request'
import { Response } from 'graphql-request/dist/types'

import { testEnvironment, cleanDB } from '@test/helpers'
import { logger } from '@test/testSetup'

import sodium, {
  crypto_sign_seed_keypair,
  crypto_sign_PUBLICKEYBYTES,
  crypto_sign_SECRETKEYBYTES,
} from 'sodium-native'

// import * as sodium from 'sodium-native'

import { generateToken } from './auth/JWE'
import { validateCommunities } from './validateCommunities'

// Somewhere in your test case or test suite
jest.spyOn(sodium, 'randombytes_random').mockReturnValue(1)

let con: Connection
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  // await cleanDB()
  await con.close()
})

const ownSeed = Buffer.from('0123456789abcdef0123456789abcdef')
const ownPublicKey = Buffer.alloc(crypto_sign_PUBLICKEYBYTES)
const ownPrivateKey = Buffer.alloc(crypto_sign_SECRETKEYBYTES)

const foreignSeed = Buffer.from('fedcba9876543210fedcba9876543210')
const foreignPublicKey = Buffer.alloc(crypto_sign_PUBLICKEYBYTES)
const foreignPrivateKey = Buffer.alloc(crypto_sign_SECRETKEYBYTES)

describe('validate Communities', () => {
  beforeAll(async () => {
    // generate keypair
    crypto_sign_seed_keypair(ownPublicKey, ownPrivateKey, ownSeed)

    // own community 1.0
    const ownFederatedCommunity10 = new DbFederatedCommunity()
    ownFederatedCommunity10.apiVersion = '1_0'
    ownFederatedCommunity10.endPoint = 'http://localhost:5001/api/'
    ownFederatedCommunity10.lastAnnouncedAt = new Date()
    ownFederatedCommunity10.publicKey = ownPublicKey
    ownFederatedCommunity10.foreign = false
    ownFederatedCommunity10.lastErrorAt = null
    await ownFederatedCommunity10.save()

    const ownCommunity10 = new DbCommunity()
    ownCommunity10.authenticatedAt = null
    ownCommunity10.description = 'own community'
    ownCommunity10.foreign = false
    ownCommunity10.name = 'own community'
    ownCommunity10.privateKey = ownPrivateKey
    ownCommunity10.publicKey = ownPublicKey
    ownCommunity10.url = 'http://localhost/'
    await ownCommunity10.save()
  })
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
    beforeAll(async () => {
      jest.clearAllMocks()
      await validateCommunities()
    })

    it('logs zero communities found', () => {
      expect(logger.debug).toBeCalledWith(`Federation: found 0 dbCommunities`)
    })

    describe('with one Community of api 1_0 and not matching pubKey', () => {
      beforeAll(async () => {
        // eslint-disable-next-line @typescript-eslint/require-await
        jest.spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(async () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return {
            data: {
              getPublicKey: {
                publicKey: Buffer.from('somePubKey'),
              },
            },
            headers: new Headers([
              [
                'token',
                await generateToken(
                  1,
                  { publicKey: foreignPublicKey, privateKey: foreignPrivateKey },
                  ownPublicKey,
                ),
              ],
            ]),
            status: 200,
          } as Response<unknown>
        })

        // generate foreign
        crypto_sign_seed_keypair(foreignPublicKey, foreignPrivateKey, foreignSeed)

        // foreign community 1.0
        const foreignFederatedCommunity10 = new DbFederatedCommunity()
        foreignFederatedCommunity10.apiVersion = '1_0'
        foreignFederatedCommunity10.endPoint = 'http://foreignhost:5001/api/'
        foreignFederatedCommunity10.lastAnnouncedAt = new Date()
        foreignFederatedCommunity10.publicKey = foreignPublicKey
        foreignFederatedCommunity10.foreign = true
        foreignFederatedCommunity10.lastErrorAt = null
        await foreignFederatedCommunity10.save()

        const foreignCommunity10 = new DbCommunity()
        foreignCommunity10.authenticatedAt = null
        foreignCommunity10.description = 'own community'
        foreignCommunity10.foreign = false
        foreignCommunity10.name = 'own community'
        foreignCommunity10.privateKey = null
        foreignCommunity10.publicKey = foreignPublicKey
        foreignCommunity10.url = 'http://foreignhost/'
        await foreignCommunity10.save()

        jest.clearAllMocks()
        await validateCommunities()
      })

      it('logs one community found', () => {
        expect(logger.debug).toBeCalledWith(`Federation: found 1 dbCommunities`)
      })
      it('logs requestGetPublicKey for community api 1_0 ', () => {
        expect(logger.info).toBeCalledWith(
          'Federation: getPublicKey from endpoint',
          'http://foreignhost:5001/api/1_0/',
        )
      })
      it('logs not matching publicKeys', () => {
        expect(logger.warn).toBeCalledWith(
          'Federation: received not matching publicKey:',
          'somePubKey',
          foreignPublicKey.toString('hex'),
        )
      })
    })
    describe('with one Community of api 1_0 and matching pubKey', () => {
      beforeAll(async () => {
        // eslint-disable-next-line @typescript-eslint/require-await
        jest.spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(async () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return {
            data: {
              getPublicKey: {
                publicKey: foreignPublicKey,
              },
            },
            headers: new Headers([
              [
                'token',
                await generateToken(
                  1,
                  { publicKey: foreignPublicKey, privateKey: foreignPrivateKey },
                  ownPublicKey,
                ),
              ],
            ]),
            status: 200,
          } as Response<unknown>
        })

        await DbFederatedCommunity.update({ foreign: true }, { verifiedAt: null })
        jest.clearAllMocks()
        await validateCommunities()
      })

      it('logs one community found', () => {
        expect(logger.debug).toBeCalledWith(`Federation: found 1 dbCommunities`)
      })
      it('logs requestGetPublicKey for community api 1_0 ', () => {
        expect(logger.info).toBeCalledWith(
          'Federation: getPublicKey from endpoint',
          'http://foreignhost:5001/api/1_0/',
        )
      })
      it('logs community pubKey verified', () => {
        expect(logger.info).toHaveBeenNthCalledWith(
          3,
          'Federation: verified community with',
          'http://foreignhost:5001/api/',
        )
      })
    })
    describe.skip('with two Communities of api 1_0 and 1_1', () => {
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
        expect(logger.info).toBeCalledWith(
          'Federation: getPublicKey from endpoint',
          'http//localhost:5001/api/1_0/',
        )
      })
      it('logs requestGetPublicKey for community api 1_1 ', () => {
        expect(logger.info).toBeCalledWith(
          'Federation: getPublicKey from endpoint',
          'http//localhost:5001/api/1_1/',
        )
      })
    })
    describe.skip('with three Communities of api 1_0, 1_1 and 2_0', () => {
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
        expect(logger.info).toBeCalledWith(
          'Federation: getPublicKey from endpoint',
          'http//localhost:5001/api/1_0/',
        )
      })
      it('logs requestGetPublicKey for community api 1_1 ', () => {
        expect(logger.info).toBeCalledWith(
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
