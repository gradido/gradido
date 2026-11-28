// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, setSystemTime, spyOn } from 'bun:test'
import * as database from 'database'
import { Ed25519KeyPair, X25519KeyPair } from 'shared-native'
import { ApiClientCache, UNUSED_CLIENT_TIMEOUT_MS } from './ApiClientCache'

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

describe('ApiClientCache, clients unused', () => {
  const cache = () => ApiClientCache.getInstance()
  const url = 'http://peer.example/api/'
  const start = new Date('2026-11-27T12:00:00.000Z')
  const at = (ms: number) => setSystemTime(new Date(start.getTime() + ms))
  afterEach(() => {
    setSystemTime()
  })

  it('keeps a client while it is used', () => {
    const keyPair = Ed25519KeyPair.generate()
    at(0)
    const client = cache().getByUrl(url, keyPair)
    at(UNUSED_CLIENT_TIMEOUT_MS - 1)
    expect(cache().getByUrl(url, keyPair)).toBe(client)
    // the time counts from the last use
    at(2 * UNUSED_CLIENT_TIMEOUT_MS - 2)
    expect(cache().getByUrl(url, keyPair)).toBe(client)
  })

  it('builds a client anew once it went unused for UNUSED_CLIENT_TIMEOUT_MS', () => {
    const keyPair = Ed25519KeyPair.generate()
    at(0)
    const client = cache().getByUrl(url, keyPair)
    at(UNUSED_CLIENT_TIMEOUT_MS)
    expect(cache().getByUrl(url, keyPair)).not.toBe(client)
  })

  it('asks the database again for a client gone unused', async () => {
    const keyPair = Ed25519KeyPair.generate()
    find.mockResolvedValue(row(keyPair) as never)
    at(0)
    await cache().getByPublicKeyHex(keyPair.publicKeyToHex())
    at(UNUSED_CLIENT_TIMEOUT_MS)
    const client = await cache().getByPublicKeyHex(keyPair.publicKeyToHex())
    expect(find).toHaveBeenCalledTimes(2)
    // with all it needs, as the first time
    expect(client?.communityUuid).toBe(row(keyPair).communityUuid)
  })
})
