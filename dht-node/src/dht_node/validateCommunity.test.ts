// Unit tests: each function on its own, everything it calls replaced. No database, no network -
// the queries are tested against the database in `database`, the ApiClient in `core`.
//
// Written to run under jest (today) and `bun test --isolate` (later) alike:
// - only `jest.fn` / `jest.mock` and the mock methods both know; bun has no `jest.requireActual`
//   and no `jest.mocked`, so a factory hands out its own fakes instead of the real module
// - the fakes are declared before `jest.mock`: jest hoists the call above them, but runs the
//   factory only when the module under test is imported - and that happens in `beforeAll`,
//   after every declaration, for bun too, which does not hoist at all
// - bun keeps a module mock for the rest of the process: `--isolate` gives each file its own
import type { Ed25519KeyPair } from 'shared-native'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  addContext: jest.fn(),
}
// the error class validateCommunity tells a refused insert by, and the values it reads of the enum
class mockDBUniqueKeyViolation {
  constructor(public readonly uniqueKey: string) {}
}
const mockDatabase = {
  CommunityUniqueKey: { COMMUNITY_UUID: 'uuid_key', PUBLIC_KEY: 'public_key_key', URL: 'url_key' },
  DBUniqueKeyViolation: mockDBUniqueKeyViolation,
  dbFindForeignCommunityByUuid: jest.fn(),
  dbInsertForeignCommunity: jest.fn(),
  dbUpdateForeignCommunity: jest.fn(),
  getHomeCommunityDrizzle: jest.fn(),
}
const mockGetApiClient = jest.fn()

// addLayout: config-schema registers its layout while shared loads
jest.mock('log4js', () => ({ getLogger: () => mockLogger, addLayout: jest.fn() }))
jest.mock('database', () => mockDatabase)
jest.mock('core/apiClient', () => ({
  ApiClientCache: { getInstance: () => ({ getByUrl: mockGetApiClient }) },
}))

type ValidateCommunityModule = typeof import('./validateCommunity')
let getInfoCheckPublicKey: ValidateCommunityModule['getInfoCheckPublicKey__test']
let validateCommunity: ValidateCommunityModule['validateCommunity']

let publicJwtKey: string
beforeAll(async () => {
  const module = await import('./validateCommunity')
  getInfoCheckPublicKey = module.getInfoCheckPublicKey__test
  validateCommunity = module.validateCommunity
  // shared logs from its first line on, so it comes in after the logger fake exists
  const { createKeyPair } = await import('shared')
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

// the key a community announces with, told apart by its first byte
const keyOf = (id: number) => Buffer.alloc(32, id)

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

// the peer client of one community, as far as validateCommunity uses it
const peerClient = (answers: { communityInfos?: unknown } = {}) => ({
  // an honest peer answers with the exchangeId it was asked with
  getCommunityInfos: jest.fn().mockImplementation(async (exchangeId: string) => {
    const answer = (answers.communityInfos ?? { data: null }) as { data: object | null }
    return answer.data ? { ...answer, data: { exchangeId, ...answer.data } } : answer
  }),
})

describe('getInfoCheckPublicKey', () => {
  it('asks the client of the announced url and public key', async () => {
    mockGetApiClient.mockReturnValue(peerClient())

    await getInfoCheckPublicKey(END_POINT, keyOf(1))

    expect(mockGetApiClient).toHaveBeenCalledTimes(1)
    const [url, keyPair] = mockGetApiClient.mock.calls[0] as [string, Ed25519KeyPair]
    expect(url).toBe(END_POINT)
    // the announced key, as a key pair without private key
    expect(keyPair.publicKeyToBuffer()).toEqual(keyOf(1))
    expect(keyPair.hasPrivateKey()).toBe(false)
  })

  it('hands out nothing when the answer carries another exchangeId', async () => {
    mockGetApiClient.mockReturnValue(
      peerClient({
        communityInfos: { data: { ...communityInfoOf(keyOf(1)), exchangeId: 'b'.repeat(32) } },
      }),
    )

    expect(await getInfoCheckPublicKey(END_POINT, keyOf(1))).toBeNull()
  })

  it('hands out the parsed answer as foreign community at the announced url', async () => {
    mockGetApiClient.mockReturnValue(
      peerClient({ communityInfos: { data: communityInfoOf(keyOf(1)) } }),
    )

    expect(await getInfoCheckPublicKey(END_POINT, keyOf(1))).toEqual({
      foreign: true,
      url: END_POINT,
      communityUuid: uuidOf(1),
      name: 'Foreign-Community',
      description: 'Description of the Foreign-Community',
      creationDate: new Date('2024-05-06T07:08:09.123Z'),
      publicKey: keyOf(1),
      publicJwtKey,
      publicEncryptionKey: encryptionKeyOf(1),
      hieroTopicId: '0.0.2',
    })
  })

  it('hands out nothing without an answer', async () => {
    mockGetApiClient.mockReturnValue(peerClient({ communityInfos: { data: null } }))

    expect(await getInfoCheckPublicKey(END_POINT, keyOf(1))).toBeNull()
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'missing result of getPublicCommunityInfo',
      undefined,
    )
  })

  it('names why there is no answer', async () => {
    const reason = new Error('invalid response signature: signature does not match')
    mockGetApiClient.mockReturnValue(
      peerClient({ communityInfos: { data: null, error: { status: 503, value: reason } } }),
    )

    expect(await getInfoCheckPublicKey(END_POINT, keyOf(1))).toBeNull()
    expect(mockLogger.warn).toHaveBeenCalledWith('missing result of getPublicCommunityInfo', reason)
  })

  it('hands out nothing when the answer carries another public key', async () => {
    const otherKey = keyOf(9)
    mockGetApiClient.mockReturnValue(
      peerClient({ communityInfos: { data: communityInfoOf(otherKey) } }),
    )

    expect(await getInfoCheckPublicKey(END_POINT, keyOf(1))).toBeNull()
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'received not matching publicKey',
      otherKey.toString('hex'),
      keyOf(1).toString('hex'),
    )
  })

  it('hands out nothing when the answer carries the uuid of the home community', async () => {
    mockGetApiClient.mockReturnValue(
      peerClient({
        communityInfos: { data: { ...communityInfoOf(keyOf(1)), communityUuid: HOME_UUID } },
      }),
    )

    expect(await getInfoCheckPublicKey(END_POINT, keyOf(1))).toBeNull()
  })

  it('rejects an answer that is no valid community info', async () => {
    mockGetApiClient.mockReturnValue(
      peerClient({
        communityInfos: { data: { ...communityInfoOf(keyOf(1)), hieroTopicId: 'x' } },
      }),
    )

    await expect(getInfoCheckPublicKey(END_POINT, keyOf(1))).rejects.toThrow()
  })
})

// getInfoCheckPublicKey is called from inside the module and cannot be replaced: it runs for
// real, on the peer clients above.
describe('validateCommunity', () => {
  // the community with this key answers correctly
  const answering = () => {
    mockGetApiClient.mockImplementation((_url: string, keyPair: Ed25519KeyPair) =>
      peerClient({ communityInfos: { data: communityInfoOf(keyPair.publicKeyToBuffer()) } }),
    )
  }
  // a foreign community as dbFindForeignCommunityByUuid hands it out: the one that answered
  // with keyOf(id), unless changed
  const storedCommunity = (id: number, changes: Record<string, unknown> = {}) => ({
    id: 100 + id,
    foreign: true,
    url: END_POINT,
    publicKey: keyOf(id),
    publicEncryptionKey: encryptionKeyOf(id),
    communityUuid: uuidOf(id),
    name: 'Foreign-Community',
    description: 'Description of the Foreign-Community',
    hieroTopicId: '0.0.2',
    ...changes,
  })
  const known = (community: ReturnType<typeof storedCommunity> | null = null) => {
    mockDatabase.dbFindForeignCommunityByUuid.mockResolvedValue(community)
  }
  beforeEach(() => {
    answering()
    known()
    mockDatabase.dbInsertForeignCommunity.mockResolvedValue({ success: true })
    mockDatabase.dbUpdateForeignCommunity.mockResolvedValue(true)
  })

  it('writes nothing for a community that does not answer', async () => {
    mockGetApiClient.mockReturnValue(peerClient())

    await validateCommunity(END_POINT, keyOf(1))

    expect(mockDatabase.dbInsertForeignCommunity).not.toHaveBeenCalled()
    expect(mockDatabase.dbUpdateForeignCommunity).not.toHaveBeenCalled()
  })

  // without a handshake, the signed answer with the announced key is the authentication
  it('inserts a new community as authenticated and verified', async () => {
    await validateCommunity(END_POINT, keyOf(1))

    const [[written]] = mockDatabase.dbInsertForeignCommunity.mock.calls
    expect(written.publicKey).toEqual(keyOf(1))
    expect(written.url).toBe(END_POINT)
    expect(written.authenticatedAt).toBeInstanceOf(Date)
    expect(written.verifiedAt).toEqual(written.authenticatedAt)
    expect(written.updatedAt).toEqual(written.authenticatedAt)
    expect(mockDatabase.dbUpdateForeignCommunity).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith('new community added: Foreign-Community')
  })

  it('marks a known community without changes as verified only', async () => {
    known(storedCommunity(1))

    await validateCommunity(END_POINT, keyOf(1))

    expect(mockDatabase.dbUpdateForeignCommunity).toHaveBeenCalledWith(101, {
      verifiedAt: expect.any(Date),
    })
    expect(mockDatabase.dbInsertForeignCommunity).not.toHaveBeenCalled()
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it.each([
    ['name', { name: 'Old-name' }],
    ['description', { description: 'Old description' }],
    ['hiero topic id', { hieroTopicId: '0.0.1' }],
  ])('updates a known community whose %s changed, and marks it verified', async (_, changes) => {
    known(storedCommunity(1, changes))

    await validateCommunity(END_POINT, keyOf(1))

    const [[id, written]] = mockDatabase.dbUpdateForeignCommunity.mock.calls
    expect(id).toBe(101)
    expect(written).toEqual({
      name: 'Foreign-Community',
      description: 'Description of the Foreign-Community',
      hieroTopicId: '0.0.2',
      updatedAt: expect.any(Date),
      verifiedAt: written.updatedAt,
    })
    expect(mockDatabase.dbInsertForeignCommunity).not.toHaveBeenCalled()
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it.each([
    [
      'public key',
      { publicKey: keyOf(9) },
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
  ])('neither updates nor verifies a known community whose %s changed', async (_, changes, log) => {
    known(storedCommunity(1, { name: 'Old-name', ...changes }))

    await validateCommunity(END_POINT, keyOf(1))

    expect(mockDatabase.dbUpdateForeignCommunity).not.toHaveBeenCalled()
    expect(mockDatabase.dbInsertForeignCommunity).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith(log)
  })

  // the unique keys refuse what the uuid lookup cannot see: a known key or url under a new uuid
  it.each([
    ['uuid', 'uuid_key', 'error', `Community UUID Collision detected with uuid: ${uuidOf(1)}`],
    ['public key', 'public_key_key', 'error', `public key already in use: ${'01'.repeat(32)}`],
    [
      'url',
      'url_key',
      'warn',
      `foreign community url already in use: name: Foreign-Community, url: ${END_POINT}`,
    ],
  ] as const)('logs a %s in use', async (_, uniqueKey, level, log) => {
    mockDatabase.dbInsertForeignCommunity.mockResolvedValue({
      success: false,
      error: new mockDBUniqueKeyViolation(uniqueKey),
    })

    await validateCommunity(END_POINT, keyOf(1))

    expect(mockLogger[level]).toHaveBeenCalledWith(log)
    expect(mockLogger.error).not.toHaveBeenCalledWith('Error: ', expect.anything())
  })

  it('logs an insert that failed otherwise instead of throwing it', async () => {
    const failed = new Error('insert failed')
    mockDatabase.dbInsertForeignCommunity.mockResolvedValue({ success: false, error: failed })

    await expect(validateCommunity(END_POINT, keyOf(1))).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalledWith('Error: ', failed)
  })

  it('logs an answer that could not be read instead of throwing it', async () => {
    mockGetApiClient.mockReturnValue(
      peerClient({ communityInfos: { data: { name: 'not a community info' } } }),
    )

    await expect(validateCommunity(END_POINT, keyOf(1))).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalledWith('Error: ', expect.anything())
    expect(mockDatabase.dbInsertForeignCommunity).not.toHaveBeenCalled()
  })

  it('logs a failing query instead of throwing it', async () => {
    const error = new Error('database gone')
    mockDatabase.dbFindForeignCommunityByUuid.mockRejectedValue(error)

    await expect(validateCommunity(END_POINT, keyOf(1))).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalledWith('Error: ', error)
  })
})
