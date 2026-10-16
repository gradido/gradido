import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { Ed25519PublicKey } from 'shared'
import {
  CommunityHandshakeStateType,
  CommunityHandshakeState as DbCommunityHandshakeState,
  findPendingCommunityHandshake,
} from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { communityHandshakeStatesTable } from '../schemas'
import { createCommunity, createVerifiedFederatedCommunity } from '../seeds/community'
import {
  dbInsertCommunityHandshakeState,
  dbUpdateCommunityHandshakeStateError,
} from './communityHandshakes'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'

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
    await dbDeleteAllRowsExceptMigrations()
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

  const stateOf = async (id: number) =>
    (
      await drizzleDb()
        .select()
        .from(communityHandshakeStatesTable)
        .where(eq(communityHandshakeStatesTable.id, id))
    )[0]

  describe('dbInsertCommunityHandshakeState', () => {
    it('inserts a new state on every call and returns its id', async () => {
      const publicKey = randomBytes(32)
      const state = {
        publicKey,
        apiVersion: '1_0',
        status: CommunityHandshakeStateType.START_COMMUNITY_AUTHENTICATION,
        handshakeId: 4711,
      }

      const first = await dbInsertCommunityHandshakeState(state)
      const second = await dbInsertCommunityHandshakeState({ ...state, handshakeId: 4712 })

      expect(second).not.toBe(first)
      expect(await stateOf(first)).toMatchObject({ ...state, lastError: null })
      expect((await stateOf(second)).handshakeId).toBe(4712)
    })
  })

  describe('dbUpdateCommunityHandshakeStateError', () => {
    it('marks a state as failed with its error', async () => {
      const id = await dbInsertCommunityHandshakeState({
        publicKey: randomBytes(32),
        apiVersion: '1_0',
        status: CommunityHandshakeStateType.START_COMMUNITY_AUTHENTICATION,
        handshakeId: 1,
      })

      expect(await dbUpdateCommunityHandshakeStateError(id, 'no answer')).toBe(1)

      expect(await stateOf(id)).toMatchObject({
        status: CommunityHandshakeStateType.FAILED,
        lastError: 'no answer',
      })
    })
  })
})
