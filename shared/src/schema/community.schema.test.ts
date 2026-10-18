import { describe, expect, it } from 'bun:test'
import { generateKeyPairSync } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { homeCommunityInsertSchema, homeCommunityUpdateSchema } from './community.schema'

describe('homeCommunityInsertSchema', () => {
  const rsaKeyPair = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  const validInput = () => ({
    publicKey: Buffer.alloc(32, 1),
    privateKey: Buffer.alloc(64, 2),
    communityUuid: uuidv4(),
    url: 'https://test.gradido.net/api/',
    name: 'Gradido Test Community',
    description: 'Community to test the federation',
    creationDate: new Date(),
    publicJwtKey: rsaKeyPair.publicKey,
    privateJwtKey: rsaKeyPair.privateKey,
    publicEncryptionKey: Buffer.alloc(32, 3),
    privateEncryptionKey: Buffer.alloc(32, 4),
  })

  it('accepts valid data and sets foreign to false', () => {
    const data = v.safeParse(homeCommunityInsertSchema, validInput())
    expect(data.success).toBe(true)
    expect(data.success && data.output.foreign).toBe(false)
  })

  it('rejects foreign = true', () => {
    const data = v.safeParse(homeCommunityInsertSchema, { ...validInput(), foreign: true })
    expect(data.success).toBe(false)
    expect(data.issues && v.getDotPath(data.issues[0])).toBe('foreign')
  })

  it('rejects a public key without 32 bytes', () => {
    const data = v.safeParse(homeCommunityInsertSchema, {
      ...validInput(),
      publicKey: Buffer.alloc(31),
    })
    expect(data.success).toBe(false)
    expect(data.issues && v.getDotPath(data.issues[0])).toBe('publicKey')
  })

  it('rejects a private key without 64 bytes', () => {
    const data = v.safeParse(homeCommunityInsertSchema, {
      ...validInput(),
      privateKey: Buffer.alloc(32),
    })
    expect(data.success).toBe(false)
    expect(data.issues && v.getDotPath(data.issues[0])).toBe('privateKey')
  })

  it.each(['publicEncryptionKey', 'privateEncryptionKey'])(
    'rejects a %s without 32 bytes',
    (field) => {
      const data = v.safeParse(homeCommunityInsertSchema, {
        ...validInput(),
        [field]: Buffer.alloc(64),
      })
      expect(data.success).toBe(false)
      expect(data.issues && v.getDotPath(data.issues[0])).toBe(field)
    },
  )

  it('rejects an invalid url', () => {
    const data = v.safeParse(homeCommunityInsertSchema, { ...validInput(), url: 'not a url' })
    expect(data.success).toBe(false)
    expect(data.issues && v.getDotPath(data.issues[0])).toBe('url')
  })

  it('rejects a too short name', () => {
    const data = v.safeParse(homeCommunityInsertSchema, { ...validInput(), name: 'ab' })
    expect(data.success).toBe(false)
    expect(data.issues && v.getDotPath(data.issues[0])).toBe('name')
  })

  it('rejects a too short description', () => {
    const data = v.safeParse(homeCommunityInsertSchema, { ...validInput(), description: 'short' })
    expect(data.success).toBe(false)
    expect(data.issues && v.getDotPath(data.issues[0])).toBe('description')
  })

  it('rejects swapped jwt keys', () => {
    const data = v.safeParse(homeCommunityInsertSchema, {
      ...validInput(),
      publicJwtKey: rsaKeyPair.privateKey,
      privateJwtKey: rsaKeyPair.publicKey,
    })
    expect(data.success).toBe(false)
    expect(data.issues?.map((issue) => [v.getDotPath(issue), issue.message])).toEqual([
      ['publicJwtKey', 'Private key given, expected a public key'],
      ['privateJwtKey', 'Invalid private key'],
    ])
  })

  it('rejects a jwt key which is not a key', () => {
    const data = v.safeParse(homeCommunityInsertSchema, { ...validInput(), publicJwtKey: 'no key' })
    expect(data.success).toBe(false)
    expect(data.issues && v.getDotPath(data.issues[0])).toBe('publicJwtKey')
  })

  it('rejects a non RSA jwt key', () => {
    const ecKeyPair = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    })
    const data = v.safeParse(homeCommunityInsertSchema, {
      ...validInput(),
      publicJwtKey: ecKeyPair.publicKey,
      privateJwtKey: ecKeyPair.privateKey,
    })
    expect(data.success).toBe(false)
    expect(data.issues?.map((issue) => issue.message)).toEqual([
      'Not an RSA public key',
      'Not an RSA private key',
    ])
  })
})

describe('homeCommunityUpdateSchema', () => {
  it('keeps the fields that may change', () => {
    const input = {
      url: 'https://test.gradido.net/api/',
      name: 'Gradido Test Community',
      description: 'Community to test the federation',
      gmsApiKey: null,
      location: { type: 'Point' as const, coordinates: [13.4, 52.5] },
      hieroTopicId: null,
      matchingKeyingActive: true,
    }
    expect(v.parse(homeCommunityUpdateSchema, input)).toEqual(input)
  })

  it('accepts no field at all', () => {
    expect(v.parse(homeCommunityUpdateSchema, {})).toEqual({})
  })

  it('drops the keys, the uuid and the creation date', () => {
    const data = v.parse(homeCommunityUpdateSchema, {
      name: 'Gradido Test Community',
      publicKey: Buffer.alloc(32, 1),
      privateKey: Buffer.alloc(64, 2),
      publicJwtKey: 'public',
      privateJwtKey: 'private',
      publicEncryptionKey: Buffer.alloc(32, 3),
      privateEncryptionKey: Buffer.alloc(32, 4),
      communityUuid: uuidv4(),
      creationDate: new Date(),
    })
    expect(data).toEqual({ name: 'Gradido Test Community' })
  })

  it('accepts a point without coordinates, which is "no position"', () => {
    const location = { type: 'Point' as const, coordinates: [] }
    expect(v.parse(homeCommunityUpdateSchema, { location })).toEqual({ location })
  })

  it('rejects a point with one coordinate', () => {
    const data = v.safeParse(homeCommunityUpdateSchema, {
      location: { type: 'Point', coordinates: [13.4] },
    })
    expect(data.success).toBe(false)
  })

  it('rejects a too short name', () => {
    const data = v.safeParse(homeCommunityUpdateSchema, { name: 'ab' })
    expect(data.success).toBe(false)
    expect(data.issues && v.getDotPath(data.issues[0])).toBe('name')
  })
})
