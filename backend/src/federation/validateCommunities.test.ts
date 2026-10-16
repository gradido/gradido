// Unit tests: each function on its own, everything it calls replaced. No database, no network -
// the queries are tested against the database in `database`, the peer client in `core`.
//
// Written to run under jest (today) and `bun test --isolate` (later) alike:
// - only `jest.fn` / `jest.mock` and the mock methods both know; bun has no `jest.requireActual`
//   and no `jest.mocked`, so a factory hands out its own fakes instead of the real module
// - the fakes are declared before `jest.mock`: jest hoists the call above them, but runs the
//   factory only when the module under test is imported - and that happens in `beforeAll`,
//   after every declaration, for bun too, which does not hoist at all
// - bun keeps a module mock for the rest of the process: `--isolate` gives each file its own
import { createKeyPair } from 'shared'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  addContext: jest.fn(),
}
const mockDatabase = {
  // the values validateCommunities writes, nothing of the real enum is asked
  CommunityHandshakeStateType: {
    START_COMMUNITY_AUTHENTICATION: 'START_COMMUNITY_AUTHENTICATION',
  },
  dbClearFederatedCommunities: jest.fn(),
  dbFindFederatedCommunitiesNotVerified: jest.fn(),
  dbFindForeignCommunitiesNeedingHandshake: jest.fn(),
  dbInsertCommunityHandshakeState: jest.fn(),
  dbUpdateCommunityHandshakeStateError: jest.fn(),
  dbUpdateFederatedCommunitiesVerified: jest.fn(),
  dbUpsertVerifiedForeignCommunities: jest.fn(),
  drizzleDb: jest.fn(),
}
const mockGetPeerApiClient = jest.fn()

jest.mock('log4js', () => ({ getLogger: () => mockLogger }))
jest.mock('database', () => mockDatabase)
jest.mock('core', () => ({
  PeerApiClientCache: { getInstance: () => ({ get: mockGetPeerApiClient }) },
}))
jest.mock('sodium-native', () => ({ randombytes_random: () => 4711 }))

type ValidateCommunitiesModule = typeof import('./validateCommunities')
let federatedCommunityGetInfoCheckPublicKey: ValidateCommunitiesModule['federatedCommunityGetInfoCheckPublicKey__test']
let startCommunityAuthentication: ValidateCommunitiesModule['startCommunityAuthentication__test']
let validateCommunities: ValidateCommunitiesModule['validateCommunities__test']
let startValidateCommunities: ValidateCommunitiesModule['startValidateCommunities']

let publicJwtKey: string
beforeAll(async () => {
  const module = await import('./validateCommunities')
  federatedCommunityGetInfoCheckPublicKey = module.federatedCommunityGetInfoCheckPublicKey__test
  startCommunityAuthentication = module.startCommunityAuthentication__test
  validateCommunities = module.validateCommunities__test
  startValidateCommunities = module.startValidateCommunities
  publicJwtKey = (await createKeyPair()).publicKey
})

// reset, not only clear: a `mock…Once` a test left unused must not answer in the next one
beforeEach(() => {
  jest.resetAllMocks()
})

const END_POINT = 'http://foreign.example/api/'

// an announced entry as dbFindFederatedCommunitiesNotVerified hands it out
const federatedCommunity = (id: number, publicKey = Buffer.alloc(32, id)) => ({
  id,
  publicKey,
  apiVersion: '1_0',
  endPoint: END_POINT,
  lastAnnouncedAt: new Date(),
  verifiedAt: null,
  lastErrorAt: null,
  createdAt: new Date(),
  updatedAt: null,
})

// what another community answers on GET communityInfos, as it travels over the wire
const communityInfoOf = (publicKey: Buffer) => ({
  name: 'Foreign-Community',
  description: 'Description of the Foreign-Community',
  creationDate: '2024-05-06T07:08:09.123Z',
  publicKey: publicKey.toString('hex'),
  publicJwtKey,
  hieroTopicId: '0.0.2',
})

// the peer client of one community, as far as validateCommunities uses it
const peerClient = (answers: { communityInfos?: unknown; handshake1Open?: unknown } = {}) => ({
  publicJwtKey: undefined as string | undefined,
  getCommunityInfos: jest.fn().mockResolvedValue(answers.communityInfos ?? { data: null }),
  postHandshake1Open: jest.fn().mockResolvedValue(answers.handshake1Open ?? { data: true }),
  toString: () => 'http://foreign.example/',
})

describe('federatedCommunityGetInfoCheckPublicKey', () => {
  it('asks the client of the announced endpoint and public key', async () => {
    const fedCom = federatedCommunity(1)
    mockGetPeerApiClient.mockReturnValue(peerClient())

    await federatedCommunityGetInfoCheckPublicKey(fedCom)

    expect(mockGetPeerApiClient).toHaveBeenCalledWith(END_POINT, fedCom.publicKey)
  })

  it('hands out the parsed answer as foreign community at the announced endpoint', async () => {
    const fedCom = federatedCommunity(1)
    mockGetPeerApiClient.mockReturnValue(
      peerClient({ communityInfos: { data: communityInfoOf(fedCom.publicKey) } }),
    )

    expect(await federatedCommunityGetInfoCheckPublicKey(fedCom)).toEqual({
      foreignCommunity: {
        foreign: true,
        url: END_POINT,
        name: 'Foreign-Community',
        description: 'Description of the Foreign-Community',
        creationDate: new Date('2024-05-06T07:08:09.123Z'),
        publicKey: fedCom.publicKey,
        publicJwtKey,
        hieroTopicId: '0.0.2',
      },
      federatedCommunityId: 1,
    })
  })

  it('hands out nothing without an answer', async () => {
    mockGetPeerApiClient.mockReturnValue(peerClient({ communityInfos: { data: null } }))

    expect(await federatedCommunityGetInfoCheckPublicKey(federatedCommunity(1))).toBeNull()
    expect(mockLogger.warn).toHaveBeenCalledWith('missing result of getPublicCommunityInfo')
  })

  it('hands out nothing when the answer carries another public key', async () => {
    const fedCom = federatedCommunity(1)
    const otherKey = Buffer.alloc(32, 9)
    mockGetPeerApiClient.mockReturnValue(
      peerClient({ communityInfos: { data: communityInfoOf(otherKey) } }),
    )

    expect(await federatedCommunityGetInfoCheckPublicKey(fedCom)).toBeNull()
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'received not matching publicKey',
      otherKey.toString('hex'),
      fedCom.publicKey.toString('hex'),
    )
  })

  it('rejects an answer that is no valid community info', async () => {
    const fedCom = federatedCommunity(1)
    mockGetPeerApiClient.mockReturnValue(
      peerClient({
        communityInfos: { data: { ...communityInfoOf(fedCom.publicKey), hieroTopicId: 'x' } },
      }),
    )

    await expect(federatedCommunityGetInfoCheckPublicKey(fedCom)).rejects.toThrow()
  })
})

describe('startCommunityAuthentication', () => {
  const community = {
    publicKey: Buffer.alloc(32, 1),
    publicJwtKey: 'stored-public-jwt-key',
    url: END_POINT,
  }

  it('records the handshake, then opens it at the community with the stored jwt key', async () => {
    const client = peerClient({ handshake1Open: { data: true } })
    mockGetPeerApiClient.mockReturnValue(client)
    mockDatabase.dbInsertCommunityHandshakeState.mockResolvedValue(17)

    await startCommunityAuthentication(community)

    expect(mockGetPeerApiClient).toHaveBeenCalledWith(END_POINT, community.publicKey)
    expect(client.publicJwtKey).toBe('stored-public-jwt-key')
    expect(mockDatabase.dbInsertCommunityHandshakeState).toHaveBeenCalledWith({
      publicKey: community.publicKey,
      apiVersion: '1_0',
      status: 'START_COMMUNITY_AUTHENTICATION',
      handshakeId: 4711,
    })
    expect(client.postHandshake1Open).toHaveBeenCalledWith(4711)
    expect(mockDatabase.dbUpdateCommunityHandshakeStateError).not.toHaveBeenCalled()
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it('records the error the community answered with', async () => {
    const error = { status: 400, value: { message: 'refused' } }
    mockGetPeerApiClient.mockReturnValue(peerClient({ handshake1Open: { data: null, error } }))
    mockDatabase.dbInsertCommunityHandshakeState.mockResolvedValue(17)

    await startCommunityAuthentication(community)

    expect(mockDatabase.dbUpdateCommunityHandshakeStateError).toHaveBeenCalledWith(
      17,
      JSON.stringify(error),
    )
    expect(mockLogger.error).toHaveBeenCalledWith('http error: ', error)
  })

  it('records a failure when the community answers neither true nor with an error', async () => {
    mockGetPeerApiClient.mockReturnValue(
      peerClient({ handshake1Open: { data: false, error: null } }),
    )
    mockDatabase.dbInsertCommunityHandshakeState.mockResolvedValue(17)

    await startCommunityAuthentication(community)

    expect(mockDatabase.dbUpdateCommunityHandshakeStateError).toHaveBeenCalledWith(
      17,
      "can't initiate at community: http://foreign.example/",
    )
  })
})

// federatedCommunityGetInfoCheckPublicKey and startCommunityAuthentication are called from
// inside the module and cannot be replaced: they run for real, on the peer clients above.
describe('validateCommunities', () => {
  const tx = { name: 'the transaction' }
  beforeEach(() => {
    mockDatabase.drizzleDb.mockReturnValue({
      transaction: (run: (transaction: typeof tx) => Promise<unknown>) => run(tx),
    })
  })

  // the entries per batch, then no more
  const batches = (...entries: ReturnType<typeof federatedCommunity>[][]) => {
    for (const batch of entries) {
      mockDatabase.dbFindFederatedCommunitiesNotVerified.mockResolvedValueOnce(batch)
    }
    mockDatabase.dbFindFederatedCommunitiesNotVerified.mockResolvedValueOnce([])
  }
  // every community answers with its own key, except those named
  const answering = (silent: number[] = []) => {
    mockGetPeerApiClient.mockImplementation((_url: string, publicKey: Buffer) =>
      silent.includes(publicKey[0])
        ? peerClient()
        : peerClient({ communityInfos: { data: communityInfoOf(publicKey) } }),
    )
  }
  const writesSucceed = (count: number) => {
    mockDatabase.dbUpdateFederatedCommunitiesVerified.mockResolvedValue(count)
    mockDatabase.dbUpsertVerifiedForeignCommunities.mockResolvedValue(count)
    mockDatabase.dbFindForeignCommunitiesNeedingHandshake.mockResolvedValue([])
  }

  it('stops when there is nothing to verify', async () => {
    batches()

    await validateCommunities(mockLogger as never)

    expect(mockDatabase.dbFindFederatedCommunitiesNotVerified).toHaveBeenCalledWith(100, 0)
    expect(mockDatabase.drizzleDb).not.toHaveBeenCalled()
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it('goes through the batches by the last id of the one before', async () => {
    batches([federatedCommunity(3), federatedCommunity(7)], [federatedCommunity(9)])
    answering()
    writesSucceed(2)

    await validateCommunities(mockLogger as never)

    expect(mockDatabase.dbFindFederatedCommunitiesNotVerified.mock.calls).toEqual([
      [100, 0],
      [100, 7],
      [100, 9],
    ])
  })

  it('verifies and writes the answering communities only, in one transaction', async () => {
    batches([federatedCommunity(1), federatedCommunity(2), federatedCommunity(3)])
    answering([2])
    writesSucceed(2)

    await validateCommunities(mockLogger as never)

    expect(mockDatabase.dbUpdateFederatedCommunitiesVerified).toHaveBeenCalledWith(
      [1, 3],
      expect.any(Date),
      tx,
    )
    const [written, writtenIn] = mockDatabase.dbUpsertVerifiedForeignCommunities.mock.calls[0]
    expect(written.map((community: { publicKey: Buffer }) => community.publicKey[0])).toEqual([
      1, 3,
    ])
    expect(written[0].updatedAt).toEqual(
      mockDatabase.dbUpdateFederatedCommunitiesVerified.mock.calls[0][1],
    )
    expect(writtenIn).toBe(tx)
    expect(mockDatabase.dbFindForeignCommunitiesNeedingHandshake).toHaveBeenCalledWith([1, 3], tx)
  })

  it('writes nothing for a batch nobody answered, and goes on with the next', async () => {
    batches([federatedCommunity(1)], [federatedCommunity(2)])
    answering([1])
    writesSucceed(1)

    await validateCommunities(mockLogger as never)

    expect(mockDatabase.dbUpdateFederatedCommunitiesVerified).toHaveBeenCalledTimes(1)
    expect(mockDatabase.dbUpdateFederatedCommunitiesVerified).toHaveBeenCalledWith(
      [2],
      expect.any(Date),
      tx,
    )
  })

  it('logs an answer that could not be read and goes on with the others', async () => {
    batches([federatedCommunity(1), federatedCommunity(2)])
    mockGetPeerApiClient.mockImplementation((_url: string, publicKey: Buffer) =>
      publicKey[0] === 1
        ? peerClient({ communityInfos: { data: { name: 'not a community info' } } })
        : peerClient({ communityInfos: { data: communityInfoOf(publicKey) } }),
    )
    writesSucceed(1)

    await validateCommunities(mockLogger as never)

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining(`get community info at: ${END_POINT} resulted in rejected`),
    )
    expect(mockDatabase.dbUpdateFederatedCommunitiesVerified).toHaveBeenCalledWith(
      [2],
      expect.any(Date),
      tx,
    )
  })

  it('opens a handshake with every community that needs one', async () => {
    batches([federatedCommunity(1), federatedCommunity(2)])
    answering()
    writesSucceed(2)
    const needingHandshake = [
      { publicKey: Buffer.alloc(32, 1), publicJwtKey, url: END_POINT },
      { publicKey: Buffer.alloc(32, 2), publicJwtKey, url: END_POINT },
    ]
    mockDatabase.dbFindForeignCommunitiesNeedingHandshake.mockResolvedValue(needingHandshake)
    mockDatabase.dbInsertCommunityHandshakeState.mockResolvedValue(1)

    await validateCommunities(mockLogger as never)

    expect(
      mockDatabase.dbInsertCommunityHandshakeState.mock.calls.map(([state]) => state.publicKey),
    ).toEqual([needingHandshake[0].publicKey, needingHandshake[1].publicKey])
  })

  it('logs when fewer entries were verified than answered', async () => {
    batches([federatedCommunity(1), federatedCommunity(2)])
    answering()
    writesSucceed(2)
    mockDatabase.dbUpdateFederatedCommunitiesVerified.mockResolvedValue(1)

    await validateCommunities(mockLogger as never)

    expect(mockLogger.error).toHaveBeenCalledWith('only 1 federated communities verified from 2')
  })

  // affected rows of an upsert: 1 per insert, 2 per update, 0 per row left as it was
  it.each([
    [2, false],
    [4, false],
    [3, false],
    [1, true],
    [5, true],
  ])('with %i affected rows for 2 communities logs an error: %s', async (affectedRows, logged) => {
    batches([federatedCommunity(1), federatedCommunity(2)])
    answering()
    writesSucceed(2)
    mockDatabase.dbUpsertVerifiedForeignCommunities.mockResolvedValue(affectedRows)

    await validateCommunities(mockLogger as never)

    expect(mockLogger.error).toHaveBeenCalledTimes(logged ? 1 : 0)
  })

  it('logs a failing query instead of throwing it', async () => {
    const error = new Error('database gone')
    mockDatabase.dbFindFederatedCommunitiesNotVerified.mockRejectedValueOnce(error)

    await expect(validateCommunities(mockLogger as never)).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalledWith('Error: ', error)
  })
})

describe('startValidateCommunities', () => {
  it('clears the announced communities before the first round', async () => {
    jest.useFakeTimers()
    try {
      await startValidateCommunities(1000)

      expect(mockDatabase.dbClearFederatedCommunities).toHaveBeenCalledTimes(1)
      expect(mockDatabase.dbFindFederatedCommunitiesNotVerified).not.toHaveBeenCalled()
    } finally {
      jest.clearAllTimers()
      jest.useRealTimers()
    }
  })
})
