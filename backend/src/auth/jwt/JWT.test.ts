import { ApolloServerTestClient } from 'apollo-server-testing'
import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'
import { Response } from 'graphql-request/dist/types'
import { DataSource } from 'typeorm'

import { cleanDB, testEnvironment } from '@test/helpers'
import { logger } from '@test/testSetup'

import { encode, decode, verify, encrypt, decrypt, createKeyPair } from './JWT'
import { OpenConnectionJwtPayloadType } from './payloadtypes/OpenConnectionJwtPayloadType'
import { EncryptedJWEJwtPayloadType } from './payloadtypes/EncryptedJWEJwtPayloadType'

let con: DataSource
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: DataSource
}
let keypairComA: { publicKey: string; privateKey: string }
let keypairComB: { publicKey: string; privateKey: string }

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  con = testEnv.con
  await cleanDB()

  keypairComA = await createKeyPair()
  keypairComB = await createKeyPair()
})

afterAll(async () => {
  // await cleanDB()
  await con.destroy()
})

describe('test JWS creation and verification', () => {
    let jwsComA: string
    let jwsComB: string
    beforeEach(async () => {
      jest.clearAllMocks()
      jwsComA = await encode(new OpenConnectionJwtPayloadType('http://localhost:5001/api/'), keypairComA.privateKey)
      console.log('jwsComA=', jwsComA)
      jwsComB = await encode(new OpenConnectionJwtPayloadType('http://localhost:5002/api/'), keypairComB.privateKey)
      console.log('jwsComB=', jwsComB)
    })
    it('decode jwsComA', async () => {
      const decodedJwsComA = await decode(jwsComA)
      console.log('decodedJwsComA=', decodedJwsComA)
      expect(decodedJwsComA).toEqual({
        expiration: '10m',
        tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
        url: 'http://localhost:5001/api/',
      })
    })
    it('decode jwsComB', async () => {
      const decodedJwsComB = await decode(jwsComB)
      console.log('decodedJwsComB=', decodedJwsComB)
      expect(decodedJwsComB).toEqual({
        expiration: '10m',
        tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
        url: 'http://localhost:5002/api/',
      })
    })
    it('verify jwsComA', async () => {
      const verifiedJwsComA = await verify(jwsComA, keypairComA.publicKey)
      console.log('verify jwsComA=', verifiedJwsComA)
      expect(verifiedJwsComA).toEqual(expect.objectContaining({ 
        payload: expect.objectContaining({
          tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
          url: 'http://localhost:5001/api/',
        })
      }))
    })
    it('verify jwsComB', async () => {
      const verifiedJwsComB = await verify(jwsComB, keypairComB.publicKey)
      console.log('verify jwsComB=', verifiedJwsComB)
      expect(verifiedJwsComB).toEqual(expect.objectContaining({ 
        payload: expect.objectContaining({
          tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
          url: 'http://localhost:5002/api/',
        })
      }))
    })
})

describe('test JWE encryption and decryption', () => {
    let jweComA: string
    let jweComB: string
    beforeEach(async () => {
      jest.clearAllMocks()
      jweComA = await encrypt(new OpenConnectionJwtPayloadType('http://localhost:5001/api/'), keypairComB.publicKey)
      console.log('jweComA=', jweComA)
      jweComB = await encrypt(new OpenConnectionJwtPayloadType('http://localhost:5002/api/'), keypairComA.publicKey)
      console.log('jweComB=', jweComB)
    })
    it('decrypt jweComA', async () => {
      const decryptedAJwT = await decrypt(jweComA, keypairComB.privateKey)
      console.log('decryptedAJwT=', decryptedAJwT)
      expect(JSON.parse(decryptedAJwT)).toEqual(expect.objectContaining({
        tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
        url: 'http://localhost:5001/api/',
      }))
    })
    it('decrypt jweComB', async () => {
      const decryptedBJwT = await decrypt(jweComB, keypairComA.privateKey)
      console.log('decryptedBJwT=', decryptedBJwT)
      expect(JSON.parse(decryptedBJwT)).toEqual(expect.objectContaining({
        tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
        url: 'http://localhost:5002/api/',
      }))
    })
})

describe('test encrypted and signed JWT', () => {
    let jweComA: string
    let jwsComA: string
    let jwtComA: string
    let jweComB: string
    let jwsComB: string
    let jwtComB: string
    beforeEach(async () => {
      jest.clearAllMocks()
      jweComA = await encrypt(new OpenConnectionJwtPayloadType('http://localhost:5001/api/'), keypairComB.publicKey)
      console.log('jweComA=', jweComA)
      jwsComA = await encode(new EncryptedJWEJwtPayloadType(jweComA), keypairComA.privateKey)
      console.log('jwsComA=', jwsComA)
      jweComB = await encrypt(new OpenConnectionJwtPayloadType('http://localhost:5002/api/'), keypairComA.publicKey)
      console.log('jweComB=', jweComB)
      jwsComB = await encode(new EncryptedJWEJwtPayloadType(jweComB), keypairComB.privateKey)
      console.log('jwsComB=', jwsComB)
    })
    it('verify jwsComA', async () => {
      expect(await verify(jwsComA, keypairComA.publicKey)).toEqual(expect.objectContaining({ 
        payload: expect.objectContaining({
          jwe: jweComA,
          tokentype: EncryptedJWEJwtPayloadType.ENCRYPTED_JWE_TYPE,
        })
      }))
    })
    it('verify jwsComB', async () => {
      expect(await verify(jwsComB, keypairComB.publicKey)).toEqual(expect.objectContaining({ 
        payload: expect.objectContaining({
          jwe: jweComB,
          tokentype: EncryptedJWEJwtPayloadType.ENCRYPTED_JWE_TYPE,
        })
      }))
    })
    it('decrypt jweComA', async () => {
      expect(JSON.parse(await decrypt(jweComA, keypairComB.privateKey))).toEqual(expect.objectContaining({
        tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
        url: 'http://localhost:5001/api/',
      }))
    })
    it('decrypt jweComB', async () => {
      expect(JSON.parse(await decrypt(jweComB, keypairComA.privateKey))).toEqual(expect.objectContaining({
        tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
        url: 'http://localhost:5002/api/',
      }))
    })
})