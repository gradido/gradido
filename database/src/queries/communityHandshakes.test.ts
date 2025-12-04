import { randomBytes } from 'node:crypto'
import { Ed25519PublicKey } from 'shared'
import {
  CommunityHandshakeStateType,
  Community as DbCommunity,
  CommunityHandshakeState as DbCommunityHandshakeState,
  FederatedCommunity as DbFederatedCommunity,
  findPendingCommunityHandshake,
} from '..'
import { AppDatabase } from '../AppDatabase'
import { createCommunity, createVerifiedFederatedCommunity } from '../seeds/community'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

async function createCommunityHandshakeState(publicKey: Buffer) {
  const state = new DbCommunityHandshakeState()
  state.publicKey = publicKey
  state.apiVersion = '1_0'
  state.status = CommunityHandshakeStateType.START_COMMUNITY_AUTHENTICATION
  state.handshakeId = 1
  await state.save()
}

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
    await createCommunityHandshakeState(com1.publicKey)
    const communityHandshakeState = await findPendingCommunityHandshake(
      new Ed25519PublicKey(com1.publicKey),
      '1_0',
    )
    expect(communityHandshakeState).toBeDefined()
    expect(communityHandshakeState).toMatchObject({
      publicKey: com1.publicKey,
      apiVersion: '1_0',
      status: CommunityHandshakeStateType.START_COMMUNITY_AUTHENTICATION,
      handshakeId: 1,
    })
  })

  it('update state', async () => {
    const publicKey = new Ed25519PublicKey(randomBytes(32))
    await createCommunityHandshakeState(publicKey.asBuffer())
    const communityHandshakeState = await findPendingCommunityHandshake(publicKey, '1_0')
    expect(communityHandshakeState).toBeDefined()
    communityHandshakeState!.status = CommunityHandshakeStateType.START_OPEN_CONNECTION_CALLBACK
    await communityHandshakeState!.save()
    const communityHandshakeState2 = await findPendingCommunityHandshake(publicKey, '1_0')
    expect(communityHandshakeState2).toBeDefined()
    expect(communityHandshakeState2).toMatchObject({
      publicKey: publicKey.asBuffer(),
      apiVersion: '1_0',
      status: CommunityHandshakeStateType.START_OPEN_CONNECTION_CALLBACK,
      handshakeId: 1,
    })
  })
})
