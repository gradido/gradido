// AI-GENERATED — not an architecture reference
// Unit test: whose pictures the resolver reads, and what it lets out when the database fails. The
// paths with a database run in KeptPictureResolver.test.ts.
//
// Written to run under jest (today) and `bun test --isolate` (later) alike, as AGENTS.md asks and
// validateCommunities.test.ts shows: the fakes are declared before `jest.mock`, each factory hands
// out its own fakes, and the module under test is imported in `beforeAll`. LogError is one of the
// fakes: what the resolver hands it is what would reach the log -- the resolver writes nothing to
// a log itself.
import { KEPT_PICTURES_MAX_PER_REQUEST } from '@/data/KeptPictures.logic'
import type { Context } from '@/server/context'

/** Stands in for LogError and keeps what it was handed: that is what would reach the log. */
class mockLogError extends Error {
  readonly details: unknown[]
  constructor(message: string, ...details: unknown[]) {
    super(message)
    this.details = details
  }
}
const mockDatabase = {
  dbCountUserKeptPicturesBesides: jest.fn(),
  dbDeleteUserKeptPicture: jest.fn(),
  dbSelectUserKeptPictureFull: jest.fn(),
  dbSelectUserKeptPicturePairs: jest.fn(),
  dbSelectUserKeptPicturesSmall: jest.fn(),
  dbUpsertUserKeptPicture: jest.fn(),
}
const mockDatabaseErrorCode = jest.fn()
const mockResolveCommunityUuid = jest.fn()
const mockAcceptAvatarRenditions = jest.fn()

jest.mock('@/server/LogError', () => ({ LogError: mockLogError }))
jest.mock('database', () => mockDatabase)
jest.mock('core', () => ({ databaseErrorCode: mockDatabaseErrorCode }))
jest.mock('./util/communities', () => ({ resolveCommunityUuid: mockResolveCommunityUuid }))
jest.mock('./util/acceptAvatarRenditions', () => ({
  acceptAvatarRenditions: mockAcceptAvatarRenditions,
}))

const HOME = '1a1a1a1a-1111-4111-8111-11111111aaaa'
const ANNA = 'AAAAAAAA-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PICTURE = 'a picture of Anna, taken at the market'

type ResolverModule = typeof import('./KeptPictureResolver')
type ContextModule = typeof import('@/server/context')
let KeptPictureResolver: ResolverModule['KeptPictureResolver']
let newRequestBudget: ContextModule['newRequestBudget']

beforeAll(async () => {
  ;({ KeptPictureResolver } = await import('./KeptPictureResolver'))
  ;({ newRequestBudget } = await import('@/server/context'))
})

// reset, not only clear: a `mock…Once` a test left unused must not answer in the next one
beforeEach(() => {
  jest.resetAllMocks()
  mockResolveCommunityUuid.mockImplementation(async (uuid: string | null) => uuid ?? HOME)
  mockDatabaseErrorCode.mockReturnValue('ER_LOCK_WAIT_TIMEOUT')
  mockAcceptAvatarRenditions.mockResolvedValue({
    small: Buffer.from(PICTURE),
    full: Buffer.from(PICTURE),
  })
  mockDatabase.dbCountUserKeptPicturesBesides.mockResolvedValue(0)
})

const lenasRequest = (): Context =>
  ({
    token: null,
    setHeaders: [],
    requestBudget: newRequestBudget(),
    user: { id: 1, communityUuid: HOME, gradidoID: 'lena-id' },
  }) as unknown as Context

const annasRef = { gradidoID: ANNA, communityUuid: HOME }

describe('KeptPictureResolver', () => {
  it("reads the signed-in member's own pictures, and the person in lower case", async () => {
    mockDatabase.dbSelectUserKeptPicturesSmall.mockResolvedValue([])
    mockDatabase.dbSelectUserKeptPictureFull.mockResolvedValue({ success: false })
    const resolver = new KeptPictureResolver()
    await resolver.keptPictures(lenasRequest())
    await resolver.keptPictureFull(annasRef, lenasRequest())
    expect(mockDatabase.dbSelectUserKeptPicturesSmall).toHaveBeenCalledWith(1)
    expect(mockDatabase.dbSelectUserKeptPictureFull).toHaveBeenCalledWith(1, {
      communityUuid: HOME,
      gradidoId: ANNA.toLowerCase(),
    })
  })

  it('reads a person named without a community as one of this community', async () => {
    mockDatabase.dbSelectUserKeptPictureFull.mockResolvedValue({ success: false })
    await new KeptPictureResolver().keptPictureFull(
      { gradidoID: ANNA, communityUuid: null },
      lenasRequest(),
    )
    expect(mockDatabase.dbSelectUserKeptPictureFull).toHaveBeenCalledWith(1, {
      communityUuid: HOME,
      gradidoId: ANNA.toLowerCase(),
    })
  })

  // ⛔ A failed query carries its parameters in its message: the person a picture is of, and,
  // writing, the picture. Thrown on as it is, it would be written to the request log and sent back
  // in the answer.
  describe('keeps what the database throws to itself: the error names a code, never a person', () => {
    const failed = new Error(
      `Failed query: ... from \`user_kept_pictures\` ... params: 1,${HOME},${ANNA},${PICTURE}`,
    )
    const refusal = (call: () => Promise<unknown>) =>
      call().then(
        () => null,
        (error: unknown) => error as mockLogError,
      )
    const expectRefusal = (refused: mockLogError | null) => {
      expect(refused).toBeInstanceOf(mockLogError)
      expect(refused?.message).toBe('KEPT_PICTURE_NOT_STORED')
      expect(refused?.details).toEqual(['ER_LOCK_WAIT_TIMEOUT'])
      expect(JSON.stringify(refused?.details)).not.toContain(ANNA)
      expect(mockDatabaseErrorCode).toHaveBeenCalledWith(failed)
    }

    it('reading the list', async () => {
      mockDatabase.dbSelectUserKeptPicturesSmall.mockRejectedValue(failed)
      expectRefusal(await refusal(() => new KeptPictureResolver().keptPictures(lenasRequest())))
    })

    it('reading a full picture', async () => {
      mockDatabase.dbSelectUserKeptPictureFull.mockRejectedValue(failed)
      expectRefusal(
        await refusal(() => new KeptPictureResolver().keptPictureFull(annasRef, lenasRequest())),
      )
    })

    it('counting before a picture is set', async () => {
      mockDatabase.dbCountUserKeptPicturesBesides.mockRejectedValue(failed)
      expectRefusal(
        await refusal(() =>
          new KeptPictureResolver().setKeptPicture(annasRef, 'small', 'full', lenasRequest()),
        ),
      )
    })

    it('setting a picture', async () => {
      mockDatabase.dbUpsertUserKeptPicture.mockRejectedValue(failed)
      expectRefusal(
        await refusal(() =>
          new KeptPictureResolver().setKeptPicture(annasRef, 'small', 'full', lenasRequest()),
        ),
      )
    })

    it('taking a picture away', async () => {
      mockDatabase.dbDeleteUserKeptPicture.mockRejectedValue(failed)
      expectRefusal(
        await refusal(() => new KeptPictureResolver().removeKeptPicture(annasRef, lenasRequest())),
      )
    })
  })

  it('counts before it works on a picture, and works on none at the limit', async () => {
    mockDatabase.dbCountUserKeptPicturesBesides.mockResolvedValue(100)
    const refused = (await new KeptPictureResolver()
      .setKeptPicture(annasRef, 'small', 'full', lenasRequest())
      .catch((error: unknown) => error)) as mockLogError
    expect(refused.message).toBe('KEPT_PICTURES_FULL')
    expect(mockAcceptAvatarRenditions).not.toHaveBeenCalled()
    expect(mockDatabase.dbUpsertUserKeptPicture).not.toHaveBeenCalled()
  })

  it('stores what was taken in, for the signed-in member and the person in lower case', async () => {
    await new KeptPictureResolver().setKeptPicture(annasRef, 'small', 'full', lenasRequest())
    expect(mockAcceptAvatarRenditions).toHaveBeenCalledWith('small', 'full')
    expect(mockDatabase.dbUpsertUserKeptPicture).toHaveBeenCalledWith({
      userId: 1,
      subjectCommunityUuid: HOME,
      subjectGradidoId: ANNA.toLowerCase(),
      pictureSmall: Buffer.from(PICTURE),
      pictureFull: Buffer.from(PICTURE),
      mimeType: 'image/jpeg',
    })
  })

  // WHOM the member keeps a picture of: the signed-in member's, counted like a picture, and a
  // failing read leaves with the driver's code only.
  it("names the signed-in member's own people, counted in the request's budget", async () => {
    mockDatabase.dbSelectUserKeptPicturePairs.mockResolvedValue([
      { subjectCommunityUuid: HOME, subjectGradidoId: ANNA.toLowerCase() },
    ])
    const context = lenasRequest()
    expect(await new KeptPictureResolver().keptPicturePairs(context)).toEqual([
      expect.objectContaining({ communityUuid: HOME, gradidoID: ANNA.toLowerCase() }),
    ])
    expect(mockDatabase.dbSelectUserKeptPicturePairs).toHaveBeenCalledWith(1)
    expect(context.requestBudget.keptPicturesServed).toBe(1)

    mockDatabase.dbSelectUserKeptPicturePairs.mockRejectedValue(
      new Error(`Failed query: select ... params: 1,${ANNA}`),
    )
    const failed = (await new KeptPictureResolver()
      .keptPicturePairs(lenasRequest())
      .catch((error: unknown) => error)) as mockLogError
    expect(failed.message).toBe('KEPT_PICTURE_NOT_STORED')
    expect(failed.details).toEqual(['ER_LOCK_WAIT_TIMEOUT'])
  })

  // A document may repeat the removal under any number of aliases, each a delete: the request's
  // budget counts them as it counts reads.
  it('removes as many in one request as the budget allows, and not one more', async () => {
    const resolver = new KeptPictureResolver()
    const context = lenasRequest()
    for (let n = 0; n < KEPT_PICTURES_MAX_PER_REQUEST; n++) {
      await resolver.removeKeptPicture(annasRef, context)
    }
    const refused = (await resolver
      .removeKeptPicture(annasRef, context)
      .catch((error: unknown) => error)) as mockLogError
    expect(refused.message).toBe('Too many kept pictures asked for at once')
    expect(mockDatabase.dbDeleteUserKeptPicture).toHaveBeenCalledTimes(
      KEPT_PICTURES_MAX_PER_REQUEST,
    )
  })
})
