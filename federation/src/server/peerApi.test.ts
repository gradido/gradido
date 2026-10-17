// AI-GENERATED — not an architecture reference
// Integration test: the route communityInfos as this server serves it, from the home community in
// the database, through cors and helmet, asked by the client the backend uses. Only the peer on
// the other end is this test; what the route and the client decide on their own is tested in core.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { cleanDB } from '@test/helpers'
import { PeerApiClient } from 'core'
import { AppDatabase, dbInsertHomeCommunity } from 'database'
import type { AnyElysia } from 'elysia'
import { getLogger } from 'log4js'
import { createKeyPair, InvalidResponseSignatureError } from 'shared'
import { crypto_sign_keypair } from 'sodium-native'
import { createServer } from './createServer'

// a key pair as the dht-node stores it: libsodium, privateKey = seed || publicKey
const libsodiumKeyPair = () => {
  const publicKey = Buffer.alloc(32)
  const privateKey = Buffer.alloc(64)
  crypto_sign_keypair(publicKey, privateKey)
  return { publicKey, privateKey }
}

const homeKeys = libsodiumKeyPair()
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
  })
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
    const { data, error } = await new PeerApiClient(url, homeKeys.publicKey).getCommunityInfos()

    expect(error).toBeNull()
    // Eden types the date as the string on the wire, and hands it out read as Date
    expect(data as unknown).toEqual({
      communityUuid: home.communityUuid,
      name: home.name,
      description: home.description,
      creationDate: home.creationDate,
      publicKey: homeKeys.publicKey.toString('hex'),
      publicJwtKey,
      hieroTopicId: null,
    })
  })

  it('is refused by a peer that expects another key', async () => {
    const { data, error } = await new PeerApiClient(
      url,
      libsodiumKeyPair().publicKey,
    ).getCommunityInfos()

    expect(data).toBeNull()
    expect(error?.value).toBeInstanceOf(InvalidResponseSignatureError)
  })
})
