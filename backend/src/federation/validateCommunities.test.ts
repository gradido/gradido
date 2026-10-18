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
// the error class validateCommunities tells a refused insert by, and the values it reads of the enum
class mockDBUniqueKeyViolation {
  constructor(public readonly uniqueKey: string) {}
}
const mockDatabase = {
  CommunityUniqueKey: { COMMUNITY_UUID: 'uuid_key', PUBLIC_KEY: 'public_key_key', URL: 'url_key' },
  DBUniqueKeyViolation: mockDBUniqueKeyViolation,
  dbClearFederatedCommunities: jest.fn(),
  dbFindFederatedCommunitiesNotVerified: jest.fn(),
  dbFindForeignCommunitiesByUuid: jest.fn(),
  dbInsertForeignCommunity: jest.fn(),
  dbUpdateFederatedCommunitiesVerified: jest.fn(),
  dbUpdateForeignCommunity: jest.fn(),
  drizzleDb: jest.fn(),
  getHomeCommunityDrizzle: jest.fn(),
}
const mockGetPeerApiClient = jest.fn()

jest.mock('log4js', () => ({ getLogger: () => mockLogger }))
jest.mock('database', () => mockDatabase)
jest.mock('core', () => ({
  PeerApiClientCache: { getInstance: () => ({ get: mockGetPeerApiClient }) },
}))

type ValidateCommunitiesModule = typeof import('./validateCommunities')
let federatedCommunityGetInfoCheckPublicKey: ValidateCommunitiesModule['federatedCommunityGetInfoCheckPublicKey__test']
let validateCommunities: ValidateCommunitiesModule['validateCommunities__test']
let startValidateCommunities: ValidateCommunitiesModule['startValidateCommunities']

let publicJwtKey: string
beforeAll(async () => {
  const module = await import('./validateCommunities')
  federatedCommunityGetInfoCheckPublicKey = module.federatedCommunityGetInfoCheckPublicKey__test
  validateCommunities = module.validateCommunities__test
  startValidateCommunities = module.startValidateCommunities
  publicJwtKey = (await createKeyPair()).publicKey
})

// reset, not only clear: a `mock…Once` a test left unused must not answer in the next one
beforeEach(() => {
  jest.resetAllMocks()
  mockDatabase.getHomeCommunityDrizzle.mockResolvedValue({ communityUuid: HOME_UUID })
})

const END_POINT = 'http://foreign.example/api/'
const HOME_UUID = '00000000-0000-4000-8000-ffffffffffff'
// every community its own uuid, told apart by the first byte of its public key like the rest
const uuidOf = (id: number) => `00000000-0000-4000-8000-${id.toString(16).padStart(12, '0')}`

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

// every community its own encryption key, by the same first byte
const encryptionKeyOf = (id: number) => Buffer.alloc(32, 0x80 + id)

// what another community answers on GET communityInfos, as it travels over the wire
const communityInfoOf = (publicKey: Buffer) => ({
  communityUuid: uuidOf(publicKey[0]),
  name: 'Foreign-Community',
  description: 'Description of the Foreign-Community',
  creationDate: '2024-05-06T07:08:09.123Z',
  publicKey: publicKey.toString('hex'),
  publicJwtKey,
  publicEncryptionKey: encryptionKeyOf(publicKey[0]).toString('hex'),
  hieroTopicId: '0.0.2',
})

// the peer client of one community, as far as validateCommunities uses it
const peerClient = (answers: { communityInfos?: unknown } = {}) => ({
  getCommunityInfos: jest.fn().mockResolvedValue(answers.communityInfos ?? { data: null }),
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
        communityUuid: uuidOf(1),
        name: 'Foreign-Community',
        description: 'Description of the Foreign-Community',
        creationDate: new Date('2024-05-06T07:08:09.123Z'),
        publicKey: fedCom.publicKey,
        publicJwtKey,
        publicEncryptionKey: encryptionKeyOf(1),
        hieroTopicId: '0.0.2',
      },
      federatedCommunityId: 1,
    })
  })

  it('hands out nothing without an answer', async () => {
    mockGetPeerApiClient.mockReturnValue(peerClient({ communityInfos: { data: null } }))

    expect(await federatedCommunityGetInfoCheckPublicKey(federatedCommunity(1))).toBeNull()
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'missing result of getPublicCommunityInfo',
      undefined,
    )
  })

  it('names why there is no answer', async () => {
    const reason = new Error('invalid response signature: signature does not match')
    mockGetPeerApiClient.mockReturnValue(
      peerClient({ communityInfos: { data: null, error: { status: 503, value: reason } } }),
    )

    expect(await federatedCommunityGetInfoCheckPublicKey(federatedCommunity(1))).toBeNull()
    expect(mockLogger.warn).toHaveBeenCalledWith('missing result of getPublicCommunityInfo', reason)
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

  it('hands out nothing when the answer carries the uuid of the home community', async () => {
    const fedCom = federatedCommunity(1)
    mockGetPeerApiClient.mockReturnValue(
      peerClient({
        communityInfos: {
          data: { ...communityInfoOf(fedCom.publicKey), communityUuid: HOME_UUID },
        },
      }),
    )

    expect(await federatedCommunityGetInfoCheckPublicKey(fedCom)).toBeNull()
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

// federatedCommunityGetInfoCheckPublicKey is called from inside the module and cannot be
// replaced: it runs for real, on the peer clients above.
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
    mockDatabase.dbFindForeignCommunitiesByUuid.mockResolvedValue(new Map())
    mockDatabase.dbInsertForeignCommunity.mockResolvedValue({ success: true })
  }
  // the public keys of the inserted communities, by their first byte
  const inserted = () =>
    mockDatabase.dbInsertForeignCommunity.mock.calls.map(
      ([community]: [{ publicKey: Buffer }]) => community.publicKey[0],
    )

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

  it('verifies the answering communities only and inserts the new ones, in one transaction', async () => {
    batches([federatedCommunity(1), federatedCommunity(2), federatedCommunity(3)])
    answering([2])
    writesSucceed(2)

    await validateCommunities(mockLogger as never)

    expect(mockDatabase.dbUpdateFederatedCommunitiesVerified).toHaveBeenCalledWith(
      [1, 3],
      expect.any(Date),
      tx,
    )
    const [askedUuids, askedIn] = mockDatabase.dbFindForeignCommunitiesByUuid.mock.calls[0]
    expect(askedUuids).toEqual([uuidOf(1), uuidOf(3)])
    expect(askedIn).toBe(tx)
    expect(inserted()).toEqual([1, 3])
    for (const [, writtenIn] of mockDatabase.dbInsertForeignCommunity.mock.calls) {
      expect(writtenIn).toBe(tx)
    }
  })

  // without a handshake, the signed answer with the announced key is the authentication
  it('marks a new community as authenticated when it was verified', async () => {
    batches([federatedCommunity(1)])
    answering()
    writesSucceed(1)

    await validateCommunities(mockLogger as never)

    const verifiedAt = mockDatabase.dbUpdateFederatedCommunitiesVerified.mock.calls[0][1]
    const [[written]] = mockDatabase.dbInsertForeignCommunity.mock.calls
    expect(written.authenticatedAt).toEqual(verifiedAt)
    expect(written.updatedAt).toEqual(verifiedAt)
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

  // a foreign community as dbFindForeignCommunitiesByUuid hands it out: the one that answered
  // as federatedCommunity(id), unless changed
  const storedCommunity = (id: number, changes: Record<string, unknown> = {}) => ({
    id: 100 + id,
    foreign: true,
    url: END_POINT,
    publicKey: Buffer.alloc(32, id),
    publicEncryptionKey: encryptionKeyOf(id),
    communityUuid: uuidOf(id),
    name: 'Foreign-Community',
    description: 'Description of the Foreign-Community',
    hieroTopicId: '0.0.2',
    ...changes,
  })
  const known = (...communities: ReturnType<typeof storedCommunity>[]) => {
    mockDatabase.dbFindForeignCommunitiesByUuid.mockResolvedValue(
      new Map(communities.map((community) => [community.communityUuid, community])),
    )
  }
  it('inserts only the communities not known yet, and logs nothing', async () => {
    batches([federatedCommunity(1), federatedCommunity(2)])
    answering()
    writesSucceed(2)
    known(storedCommunity(1))

    await validateCommunities(mockLogger as never)

    expect(inserted()).toEqual([2])
    expect(mockDatabase.dbUpdateForeignCommunity).not.toHaveBeenCalled()
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it.each([
    ['name', { name: 'Old-name' }],
    ['description', { description: 'Old description' }],
    ['hiero topic id', { hieroTopicId: '0.0.1' }],
  ])('updates a known community whose %s changed, in the transaction', async (_, changes) => {
    batches([federatedCommunity(1)])
    answering()
    writesSucceed(1)
    known(storedCommunity(1, changes))
    mockDatabase.dbUpdateForeignCommunity.mockResolvedValue(true)

    await validateCommunities(mockLogger as never)

    expect(mockDatabase.dbUpdateForeignCommunity).toHaveBeenCalledWith(
      101,
      {
        name: 'Foreign-Community',
        description: 'Description of the Foreign-Community',
        hieroTopicId: '0.0.2',
        updatedAt: mockDatabase.dbUpdateFederatedCommunitiesVerified.mock.calls[0][1],
      },
      tx,
    )
    expect(inserted()).toEqual([])
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it.each([
    [
      'public key',
      { publicKey: Buffer.alloc(32, 9) },
      "Old-name foreign community public key isn't equal to the stored version",
    ],
    [
      'url',
      { url: 'http://old.example/api/' },
      `Old-name changed url from http://old.example/api/ to ${END_POINT}`,
    ],
    [
      'public encryption key',
      { publicEncryptionKey: encryptionKeyOf(9) },
      "Old-name foreign community public encryption key isn't equal to the stored version",
    ],
  ])('neither updates nor inserts a known community whose %s changed', async (_, changes, log) => {
    batches([federatedCommunity(1)])
    answering()
    writesSucceed(1)
    known(storedCommunity(1, { name: 'Old-name', ...changes }))

    await validateCommunities(mockLogger as never)

    expect(mockDatabase.dbUpdateForeignCommunity).not.toHaveBeenCalled()
    expect(inserted()).toEqual([])
    expect(mockLogger.error).toHaveBeenCalledWith(log)
  })

  it('logs when fewer entries were verified than answered', async () => {
    batches([federatedCommunity(1), federatedCommunity(2)])
    answering()
    writesSucceed(2)
    mockDatabase.dbUpdateFederatedCommunitiesVerified.mockResolvedValue(1)

    await validateCommunities(mockLogger as never)

    expect(mockLogger.error).toHaveBeenCalledWith('only 1 federated communities verified from 2')
  })

  // the unique keys refuse what the uuid lookup cannot see: a known key or url under a new uuid,
  // or the uuid of the home community
  const refusedBy = (uniqueKey: string, publicKeyByte: number) => {
    mockDatabase.dbInsertForeignCommunity.mockImplementation(async (community) =>
      community.publicKey[0] === publicKeyByte
        ? { success: false, error: new mockDBUniqueKeyViolation(uniqueKey) }
        : { success: true },
    )
  }

  it.each([
    ['public key', 'public_key_key', 'error', `public key already in use: ${'01'.repeat(32)}`],
    [
      'url',
      'url_key',
      'warn',
      `foreign community url already in use: name: Foreign-Community, url: ${END_POINT}`,
    ],
  ] as const)(
    'logs a %s in use and goes on with the next community',
    async (_, uniqueKey, level, log) => {
      batches([federatedCommunity(1), federatedCommunity(2)])
      answering()
      writesSucceed(2)
      refusedBy(uniqueKey, 1)

      await validateCommunities(mockLogger as never)

      expect(mockLogger[level]).toHaveBeenCalledWith(log)
      expect(inserted()).toEqual([1, 2])
    },
  )

  it('breaks off the round at an insert that failed otherwise', async () => {
    batches([federatedCommunity(1), federatedCommunity(2)], [federatedCommunity(3)])
    answering()
    writesSucceed(2)
    const failed = new Error('insert failed')
    mockDatabase.dbInsertForeignCommunity.mockResolvedValueOnce({ success: false, error: failed })

    await validateCommunities(mockLogger as never)

    expect(mockLogger.error).toHaveBeenCalledWith('Error: ', failed)
    expect(inserted()).toEqual([1])
    expect(mockDatabase.dbFindFederatedCommunitiesNotVerified).toHaveBeenCalledTimes(1)
  })

  // two new communities in one batch claiming the same uuid: the lookup before the inserts
  // knows neither, the unique key refuses the second
  it('logs a uuid in use and goes on with the next community', async () => {
    batches([federatedCommunity(1), federatedCommunity(2)], [federatedCommunity(3)])
    answering()
    writesSucceed(2)
    refusedBy('uuid_key', 1)

    await validateCommunities(mockLogger as never)

    expect(mockLogger.error).toHaveBeenCalledWith(
      `Community UUID Collision detected with uuid: ${uuidOf(1)}`,
    )
    expect(inserted()).toEqual([1, 2, 3])
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
