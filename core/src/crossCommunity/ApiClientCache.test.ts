// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import * as database from 'database'
import { Ed25519KeyPair, X25519KeyPair } from 'shared-native'
import { ApiClientCache } from './ApiClientCache'

// The query behind the spy runs against a database in database/src/queries/communities.test.ts.
// The cache is a singleton: every test takes a key of its own.

const row = (keyPair: Ed25519KeyPair, values: object = {}) => ({
  publicKey: keyPair.publicKeyToBuffer(),
  publicEncryptionKey: X25519KeyPair.generate().publicKeyToBuffer(),
  communityUuid: '7a2e4c90-1b5d-4f3a-8c6e-0d9b3f2a1e47',
  url: 'http://peer.example/api/',
  authenticatedAt: new Date(),
  ...values,
})

let find: ReturnType<typeof spyOn<typeof database, 'dbFindForeignCommunityByPublicKey'>>
beforeEach(() => {
  find = spyOn(database, 'dbFindForeignCommunityByPublicKey').mockResolvedValue(null)
})
afterEach(() => {
  find.mockRestore()
})

describe('ApiClientCache.getByPublicKeyHex', () => {
  const cache = () => ApiClientCache.getInstance()

  it('hands out the client of an authenticated community with all it needs', async () => {
    const keyPair = Ed25519KeyPair.generate()
    const com = row(keyPair)
    find.mockResolvedValue(com as never)
    const client = await cache().getByPublicKeyHex(keyPair.publicKeyToHex())
    expect(client?.communityUuid).toBe(com.communityUuid)
    expect(client?.publicEncryptionKey?.publicKeyToHex()).toBe(
      com.publicEncryptionKey.toString('hex'),
    )
  })

  it('asks the database only once', async () => {
    const keyPair = Ed25519KeyPair.generate()
    find.mockResolvedValue(row(keyPair) as never)
    await cache().getByPublicKeyHex(keyPair.publicKeyToHex())
    await cache().getByPublicKeyHex(keyPair.publicKeyToHex())
    expect(find).toHaveBeenCalledTimes(1)
  })

  it('hands out nothing for an unknown community', async () => {
    expect(
      await cache().getByPublicKeyHex(Ed25519KeyPair.generate().publicKeyToHex()),
    ).toBeUndefined()
  })

  it('hands out nothing for a community that is not authenticated', async () => {
    const keyPair = Ed25519KeyPair.generate()
    find.mockResolvedValue(row(keyPair, { authenticatedAt: null }) as never)
    expect(await cache().getByPublicKeyHex(keyPair.publicKeyToHex())).toBeUndefined()
  })

  it('hands out nothing for a client of getByUrl() whose community is not authenticated', async () => {
    const keyPair = Ed25519KeyPair.generate()
    cache().getByUrl('http://peer.example/api/', keyPair)
    find.mockResolvedValue(row(keyPair, { authenticatedAt: null }) as never)
    expect(await cache().getByPublicKeyHex(keyPair.publicKeyToHex())).toBeUndefined()
  })
})
