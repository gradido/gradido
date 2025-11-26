// import { testEnvironment } from '@test/helpers'
// import { logger } from '@test/testSetup'

import {
  createKeyPair,
  decode,
  decrypt,
  encode,
  encrypt,
  encryptAndSign,
  verify,
  verifyAndDecrypt,
} from './JWT'
import { EncryptedJWEJwtPayloadType } from './payloadtypes/EncryptedJWEJwtPayloadType'
import { OpenConnectionJwtPayloadType } from './payloadtypes/OpenConnectionJwtPayloadType'

// let con: DataSource
// let testEnv: {
//  mutate: ApolloServerTestClient['mutate']
//  query: ApolloServerTestClient['query']
//  con: DataSource
// }
let keypairComA: { publicKey: string; privateKey: string }
let keypairComB: { publicKey: string; privateKey: string }

beforeAll(async () => {
  //  testEnv = await testEnvironment(logger)
  //  con = testEnv.con
  //  await cleanDB()

  keypairComA = await createKeyPair()
  keypairComB = await createKeyPair()
})

afterAll(async () => {
  // await cleanDB()
  // await con.destroy()
})

describe('test JWS creation and verification', () => {
  let jwsComA: string
  let jwsComB: string
  beforeEach(async () => {
    jest.clearAllMocks()
    jwsComA = await encode(
      new OpenConnectionJwtPayloadType('handshakeID', 'http://localhost:5001/api/'),
      keypairComA.privateKey,
    )
    jwsComB = await encode(
      new OpenConnectionJwtPayloadType('handshakeID', 'http://localhost:5002/api/'),
      keypairComB.privateKey,
    )
  })
  it('decode jwsComA', async () => {
    const decodedJwsComA = await decode(jwsComA)
    expect(decodedJwsComA).toEqual({
      expiration: '10m',
      handshakeID: 'handshakeID',
      tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
      url: 'http://localhost:5001/api/',
    })
  })
  it('decode jwsComB', async () => {
    const decodedJwsComB = await decode(jwsComB)
    expect(decodedJwsComB).toEqual({
      expiration: '10m',
      handshakeID: 'handshakeID',
      tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
      url: 'http://localhost:5002/api/',
    })
  })
  it('verify jwsComA', async () => {
    const verifiedJwsComA = await verify('handshakeID', jwsComA, keypairComA.publicKey)
    expect(verifiedJwsComA).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
          url: 'http://localhost:5001/api/',
        }),
      }),
    )
  })
  it('verify jwsComB', async () => {
    const verifiedJwsComB = await verify('handshakeID', jwsComB, keypairComB.publicKey)
    expect(verifiedJwsComB).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
          url: 'http://localhost:5002/api/',
        }),
      }),
    )
  })
})

describe('test JWE encryption and decryption', () => {
  let jweComA: string
  let jweComB: string
  beforeEach(async () => {
    jest.clearAllMocks()
    jweComA = await encrypt(
      new OpenConnectionJwtPayloadType('handshakeID', 'http://localhost:5001/api/'),
      keypairComB.publicKey,
    )
    jweComB = await encrypt(
      new OpenConnectionJwtPayloadType('handshakeID', 'http://localhost:5002/api/'),
      keypairComA.publicKey,
    )
  })
  it('decrypt jweComA', async () => {
    const decryptedAJwT = await decrypt('handshakeID', jweComA, keypairComB.privateKey)
    expect(JSON.parse(decryptedAJwT)).toEqual(
      expect.objectContaining({
        tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
        url: 'http://localhost:5001/api/',
        handshakeID: 'handshakeID',
      }),
    )
  })
  it('decrypt jweComB', async () => {
    const decryptedBJwT = await decrypt('handshakeID', jweComB, keypairComA.privateKey)
    expect(JSON.parse(decryptedBJwT)).toEqual(
      expect.objectContaining({
        tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
        url: 'http://localhost:5002/api/',
        handshakeID: 'handshakeID',
      }),
    )
  })
})

describe('test encrypted and signed JWT', () => {
  let jweComA: string
  let jwsComA: string
  let jweComB: string
  let jwsComB: string
  beforeEach(async () => {
    jest.clearAllMocks()
    jweComA = await encrypt(
      new OpenConnectionJwtPayloadType('handshakeID', 'http://localhost:5001/api/'),
      keypairComB.publicKey,
    )
    jwsComA = await encode(
      new EncryptedJWEJwtPayloadType('handshakeID', jweComA),
      keypairComA.privateKey,
    )
    jweComB = await encrypt(
      new OpenConnectionJwtPayloadType('handshakeID', 'http://localhost:5002/api/'),
      keypairComA.publicKey,
    )
    jwsComB = await encode(
      new EncryptedJWEJwtPayloadType('handshakeID', jweComB),
      keypairComB.privateKey,
    )
  })
  it('verify jwsComA', async () => {
    const verifiedJwsComA = await verify('handshakeID', jwsComA, keypairComA.publicKey)
    expect(verifiedJwsComA).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          jwe: jweComA,
          tokentype: EncryptedJWEJwtPayloadType.ENCRYPTED_JWE_TYPE,
          handshakeID: 'handshakeID',
        }),
      }),
    )
  })
  it('verify jwsComB', async () => {
    const verifiedJwsComB = await verify('handshakeID', jwsComB, keypairComB.publicKey)
    expect(verifiedJwsComB).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          jwe: jweComB,
          tokentype: EncryptedJWEJwtPayloadType.ENCRYPTED_JWE_TYPE,
          handshakeID: 'handshakeID',
        }),
      }),
    )
  })
  it('decrypt jweComA', async () => {
    expect(JSON.parse(await decrypt('handshakeID', jweComA, keypairComB.privateKey))).toEqual(
      expect.objectContaining({
        tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
        url: 'http://localhost:5001/api/',
        handshakeID: 'handshakeID',
      }),
    )
  })
  it('decrypt jweComB', async () => {
    expect(JSON.parse(await decrypt('handshakeID', jweComB, keypairComA.privateKey))).toEqual(
      expect.objectContaining({
        tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
        url: 'http://localhost:5002/api/',
        handshakeID: 'handshakeID',
      }),
    )
  })
})

describe('test encryptAndSign and verifyAndDecrypt', () => {
  let jwtComA: string
  beforeEach(async () => {
    jest.clearAllMocks()
    jwtComA = await encryptAndSign(
      new OpenConnectionJwtPayloadType('handshakeID', 'http://localhost:5001/api/'),
      keypairComA.privateKey,
      keypairComB.publicKey,
    )
  })
  it('verifyAndDecrypt jwtComA', async () => {
    const verifiedAndDecryptedPayload = await verifyAndDecrypt(
      'handshakeID',
      jwtComA,
      keypairComB.privateKey,
      keypairComA.publicKey,
    )
    expect(verifiedAndDecryptedPayload).toEqual(
      expect.objectContaining({
        tokentype: OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE,
        url: 'http://localhost:5001/api/',
        handshakeID: 'handshakeID',
      }),
    )
  })
})
