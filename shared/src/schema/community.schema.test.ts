import { describe, expect, it } from 'bun:test'
import { generateKeyPairSync } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { communityAuthenticatedSchema, homeCommunityInsertSchema } from './community.schema'

describe('communityAuthenticatedSchema', () => {
  it('should return an error if communityUuid is not a uuidv4', () => {
    const data = v.safeParse(communityAuthenticatedSchema, {
      communityUuid: '1234567890',
      authenticatedAt: new Date(),
    })

    expect(data.success).toBe(false)
    expect(data.issues && v.getDotPath(data.issues[0])).toBe('communityUuid')
  })

  it('should return an error if authenticatedAt is not a date', () => {
    const data = v.safeParse(communityAuthenticatedSchema, {
      communityUuid: uuidv4(),
      authenticatedAt: '2022-01-01',
    })

    expect(data.success).toBe(false)
    expect(data.issues && v.getDotPath(data.issues[0])).toBe('authenticatedAt')
  })

  it('should return no error for valid data and valid uuid4', () => {
    const data = v.safeParse(communityAuthenticatedSchema, {
      communityUuid: uuidv4(),
      authenticatedAt: new Date(),
    })

    expect(data.success).toBe(true)
  })
})

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
