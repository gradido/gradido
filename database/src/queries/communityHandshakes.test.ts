import { AppDatabase } from '../AppDatabase'
import { 
  CommunityHandshakeState as DbCommunityHandshakeState, 
  Community as DbCommunity, 
  FederatedCommunity as DbFederatedCommunity, 
  getHomeCommunityWithFederatedCommunityOrFail,
  getCommunityByPublicKeyOrFail,
  findPendingCommunityHandshake,
  CommunityHandshakeStateType
} from '..'
import { describe, expect, it, beforeEach, beforeAll, afterAll } from 'vitest'
import { createCommunity, createVerifiedFederatedCommunity } from '../seeds/community'
import { Ed25519PublicKey } from 'shared'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('communityHandshakes', () => {
  // clean db for every test case
  beforeEach(async () => {
    await DbCommunity.clear()
    await DbFederatedCommunity.clear()
    await DbCommunityHandshakeState.clear()
  })

  it('should find pending community handshake by public key', async () => {
    const com1 = await createCommunity(false)
    await createVerifiedFederatedCommunity('1_0', 100, com1)
    const state = new DbCommunityHandshakeState()
    state.publicKey = com1.publicKey
    state.apiVersion = '1_0'
    state.status = CommunityHandshakeStateType.OPEN_CONNECTION_CALLBACK
    state.handshakeId = 1
    await state.save()
    const communityHandshakeState = await findPendingCommunityHandshake(new Ed25519PublicKey(com1.publicKey), '1_0')
    expect(communityHandshakeState).toBeDefined()
    expect(communityHandshakeState).toMatchObject({
      publicKey: com1.publicKey,
      apiVersion: '1_0',
      status: CommunityHandshakeStateType.OPEN_CONNECTION_CALLBACK,
      handshakeId: 1
    })    
  })

  it('try to use returned public key for loading community', async () => {
    // test this explicit case, because in federation.authentication it lead to server crash
    const com1 = await createCommunity(false)
    await createVerifiedFederatedCommunity('1_0', 100, com1)
    const state = new DbCommunityHandshakeState()
    state.publicKey = com1.publicKey
    state.apiVersion = '1_0'
    state.status = CommunityHandshakeStateType.OPEN_CONNECTION_CALLBACK
    state.handshakeId = 1
    await state.save()
    const communityHandshakeState = await findPendingCommunityHandshake(new Ed25519PublicKey(com1.publicKey), '1_0')
    expect(communityHandshakeState).toBeDefined()
    expect(communityHandshakeState?.federatedCommunity?.community).toBeDefined()
    const ed25519PublicKey = new Ed25519PublicKey(communityHandshakeState?.federatedCommunity?.community?.publicKey)
    const community = await DbCommunity.findOneBy({ publicKey: ed25519PublicKey.asBuffer() })
    expect(community).toBeDefined()
    expect(community).toMatchObject({
      communityUuid: com1.communityUuid,
      name: com1.name,
      description: com1.description,
      url: com1.url,
      creationDate: com1.creationDate,
      authenticatedAt: com1.authenticatedAt,
      foreign: com1.foreign,
      publicKey: com1.publicKey,
      privateKey: com1.privateKey
    })
  })
})