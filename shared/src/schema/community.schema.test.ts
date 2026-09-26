import { describe, expect, it } from 'bun:test'
import { generateKeyPairSync } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import { communityAuthenticatedSchema, homeCommunityInsertSchema } from './community.schema'

describe('communityAuthenticatedSchema', () => {
  it('should return an error if communityUuid is not a uuidv4', () => {
    const data = communityAuthenticatedSchema.safeParse({
      communityUuid: '1234567890',
      authenticatedAt: new Date(),
    })

    expect(data.success).toBe(false)
    expect(data.error?.issues[0].path).toEqual(['communityUuid'])
  })

  it('should return an error if authenticatedAt is not a date', () => {
    const data = communityAuthenticatedSchema.safeParse({
      communityUuid: uuidv4(),
      authenticatedAt: '2022-01-01',
    })

    expect(data.success).toBe(false)
    expect(data.error?.issues[0].path).toEqual(['authenticatedAt'])
  })

  it('should return no error for valid data and valid uuid4', () => {
    const data = communityAuthenticatedSchema.safeParse({
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
    const data = homeCommunityInsertSchema.safeParse(validInput())
    expect(data.success).toBe(true)
    expect(data.data?.foreign).toBe(false)
  })

  it('rejects foreign = true', () => {
    const data = homeCommunityInsertSchema.safeParse({ ...validInput(), foreign: true })
    expect(data.success).toBe(false)
    expect(data.error?.issues[0].path).toEqual(['foreign'])
  })

  it('rejects a public key without 32 bytes', () => {
    const data = homeCommunityInsertSchema.safeParse({
      ...validInput(),
      publicKey: Buffer.alloc(31),
    })
    expect(data.success).toBe(false)
    expect(data.error?.issues[0].path).toEqual(['publicKey'])
  })

  it('rejects a private key without 64 bytes', () => {
    const data = homeCommunityInsertSchema.safeParse({
      ...validInput(),
      privateKey: Buffer.alloc(32),
    })
    expect(data.success).toBe(false)
    expect(data.error?.issues[0].path).toEqual(['privateKey'])
  })

  it('rejects an invalid url', () => {
    const data = homeCommunityInsertSchema.safeParse({ ...validInput(), url: 'not a url' })
    expect(data.success).toBe(false)
    expect(data.error?.issues[0].path).toEqual(['url'])
  })

  it('rejects a too short name', () => {
    const data = homeCommunityInsertSchema.safeParse({ ...validInput(), name: 'ab' })
    expect(data.success).toBe(false)
    expect(data.error?.issues[0].path).toEqual(['name'])
  })

  it('rejects a too short description', () => {
    const data = homeCommunityInsertSchema.safeParse({ ...validInput(), description: 'short' })
    expect(data.success).toBe(false)
    expect(data.error?.issues[0].path).toEqual(['description'])
  })

  it('rejects swapped jwt keys', () => {
    const data = homeCommunityInsertSchema.safeParse({
      ...validInput(),
      publicJwtKey: rsaKeyPair.privateKey,
      privateJwtKey: rsaKeyPair.publicKey,
    })
    expect(data.success).toBe(false)
    expect(data.error?.issues.map((issue) => [issue.path, issue.message])).toEqual([
      [['publicJwtKey'], 'Private key given, expected a public key'],
      [['privateJwtKey'], 'Invalid private key'],
    ])
  })

  it('rejects a jwt key which is not a key', () => {
    const data = homeCommunityInsertSchema.safeParse({ ...validInput(), publicJwtKey: 'no key' })
    expect(data.success).toBe(false)
    expect(data.error?.issues[0].path).toEqual(['publicJwtKey'])
  })

  it('rejects a non RSA jwt key', () => {
    const ecKeyPair = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    })
    const data = homeCommunityInsertSchema.safeParse({
      ...validInput(),
      publicJwtKey: ecKeyPair.publicKey,
      privateJwtKey: ecKeyPair.privateKey,
    })
    expect(data.success).toBe(false)
    expect(data.error?.issues.map((issue) => issue.message)).toEqual([
      'Not an RSA public key',
      'Not an RSA private key',
    ])
  })
})
