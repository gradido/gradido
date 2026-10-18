// AI-GENERATED — not an architecture reference
// Integration test: the route communityInfos as this server serves it, from the home community in
// the database, through cors and helmet, asked by the client the backend uses. Only the peer on
// the other end is this test; what the route and the client decide on their own is tested in core.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { cleanDB } from '@test/helpers'
import { PeerApiClient } from 'core'
import { AppDatabase, dbInsertHomeCommunity, getHomeCommunityDrizzle } from 'database'
import type { AnyElysia } from 'elysia'
import { getLogger } from 'log4js'
import {
  AppContext,
  createEncryptionKeyPair,
  createKeyPair,
  InvalidResponseSignatureError,
} from 'shared'
import { Ed25519KeyPair } from 'shared-native'
import { createServer } from './createServer'

// the keys as the dht-node stores them: libsodium, privateKey = seed || publicKey
const homeKeyPair = Ed25519KeyPair.generate()
const homeKeys = {
  publicKey: homeKeyPair.publicKeyToBuffer(),
  privateKey: Buffer.concat([homeKeyPair.privateKeyToBuffer(), homeKeyPair.publicKeyToBuffer()]),
}
const homeEncryptionKeys = createEncryptionKeyPair()
const home = {
  communityUuid: '56a55482-909e-46a4-bfa2-cd025e894eba',
  url: 'http://home.example/api/',
  name: 'Gradido Akademie',
  description: 'Die Community, die hier antwortet',
  creationDate: new Date('2024-05-06T07:08:09.123Z'),
}

let app: AnyElysia
let publicJwtKey: string
let url: string

beforeAll(async () => {
  app = (await createServer(getLogger('apollo'))).app
  await cleanDB()
  const jwtKeys = await createKeyPair()
  publicJwtKey = jwtKeys.publicKey
  await dbInsertHomeCommunity({
    ...home,
    ...homeKeys,
    publicJwtKey,
    privateJwtKey: jwtKeys.privateKey,
    publicEncryptionKey: homeEncryptionKeys.publicKey,
    privateEncryptionKey: homeEncryptionKeys.privateKey,
  })
  // as federation's main does at start
  AppContext.getInstance().setHomeCommunity(await getHomeCommunityDrizzle())
  app.listen(0)
  url = `http://localhost:${app.server?.port}/`
})

afterAll(async () => {
  app.stop()
  await cleanDB()
  await AppDatabase.getInstance().destroy()
})

describe('GET peer-api/v1/communityInfos', () => {
  it('hands the peer the home community, signed by its key', async () => {
    const { data, error } = await new PeerApiClient(
      url,
      new Ed25519KeyPair(homeKeys.publicKey),
    ).getCommunityInfos()

    expect(error).toBeNull()
    // Eden types the date as the string on the wire, and hands it out read as Date
    expect(data as unknown).toEqual({
      communityUuid: home.communityUuid,
      name: home.name,
      description: home.description,
      creationDate: home.creationDate,
      publicKey: homeKeys.publicKey.toString('hex'),
      publicJwtKey,
      // the public key only, the private one stays home
      publicEncryptionKey: homeEncryptionKeys.publicKey.toString('hex'),
      hieroTopicId: null,
    })
  })

  it('is refused by a peer that expects another key', async () => {
    const { data, error } = await new PeerApiClient(
      url,
      new Ed25519KeyPair(Ed25519KeyPair.generate().publicKeyToBuffer()),
    ).getCommunityInfos()

    expect(data).toBeNull()
    expect(error?.value).toBeInstanceOf(InvalidResponseSignatureError)
  })
})
