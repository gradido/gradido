// AI-GENERATED — not an architecture reference
import { afterEach, beforeAll, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import * as database from 'database'
import { ClientError, GraphQLClient } from 'graphql-request'
import {
  createKeyPair,
  encryptAndSign,
  JwtPayloadType,
  MemberAvatarPayload,
  MemberAvatarsJwtPayloadType,
  MemberAvatarsResponseJwtPayloadType,
  Result,
  verifyAndDecrypt,
  XComRequestError,
} from 'shared'
import { CONFIG } from '../../../config'
import { EncryptedTransferArgs } from '../../../graphql/model/EncryptedTransferArgs'
import { xcomMemberAvatars } from './xcomMemberAvatars'

const PEER_UUID = '22222222-2222-4222-8222-222222222222'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const BEN = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const MONDAY = '2026-09-14T10:00:00.000Z'
const FACE = Buffer.from('a small face').toString('base64')

const homeCom = {
  communityUuid: '11111111-1111-4111-8111-111111111111',
  publicKey: Buffer.alloc(32, 1),
  privateJwtKey: '',
} as database.Community
const peerCom = {
  communityUuid: PEER_UUID,
  publicKey: Buffer.alloc(32, 2),
  publicJwtKey: '',
} as database.Community
const peerEntry = {
  id: 4711,
  apiVersion: '1_0',
  endPoint: 'http://peer.invalid/api/',
} as database.FederatedCommunity

let homeKeys: { publicKey: string; privateKey: string }
let peerKeys: { publicKey: string; privateKey: string }

let entryExists = true
const findEntry = mock(async (_publicKey: Buffer, _apiVersion: string) =>
  entryExists
    ? { success: true, value: peerEntry }
    : { success: false, error: new database.DBNotFoundError('federated_communities', 'test') },
)
// Bun cannot restore a module mock (see validation/user.test.ts), so everything else stays the
// real module and no other test file finds this one in its way.
mock.module('database', () => ({
  ...database,
  dbFindFederatedCommunityByPublicKeyAndApi: findEntry,
}))

interface SentRequest {
  variables: { args: EncryptedTransferArgs }
  signal?: AbortSignal
}

/** What the other community received: who asked, and the question as it could read it. */
let received: { publicKey: string; question: JwtPayloadType }[] = []

/**
 * The other community, as far as this test needs it: it opens the question with ITS private
 * key and this community's public one, and seals whatever `answer` returns with its private
 * key for this community's public one. A real token both ways -- a stand-in that returned a
 * made-up string would leave verifyAndDecrypt and the tokentype check untested.
 */
const sealedAnswer = async (request: SentRequest, answer: (handshakeID: string) => object) => {
  const { args } = request.variables
  const question = await verifyAndDecrypt(
    args.handshakeID,
    args.jwt,
    peerKeys.privateKey,
    homeKeys.publicKey,
  )
  if (!question) {
    throw new Error('the question does not verify with the key of the community that asked')
  }
  received.push({ publicKey: args.publicKey, question })
  const token = await encryptAndSign(
    answer(args.handshakeID) as JwtPayloadType,
    peerKeys.privateKey,
    homeKeys.publicKey,
  )
  return { data: { memberAvatars: token }, status: 200 }
}

let rawRequest: ReturnType<typeof spyOn> | undefined
const stubRawRequest = (implementation: (request: SentRequest) => Promise<unknown>) => {
  rawRequest = spyOn(GraphQLClient.prototype, 'rawRequest').mockImplementation(
    implementation as unknown as GraphQLClient['rawRequest'],
  )
}
const peerAnswers = (answer: (handshakeID: string) => object) =>
  stubRawRequest((request) => sealedAnswer(request, answer))

const answerWith = (handshakeID: string, members: unknown[]) =>
  new MemberAvatarsResponseJwtPayloadType(handshakeID, members as MemberAvatarPayload[])

const expectFailure = (result: Result<MemberAvatarPayload[], XComRequestError>, reason: string) => {
  if (result.success) {
    throw new Error(`expected a failure, got ${JSON.stringify(result.value)}`)
  }
  expect(result.error).toBeInstanceOf(XComRequestError)
  expect(result.error.communityUuid).toBe(PEER_UUID)
  expect(result.error.reason).toContain(reason)
}

describe('xcomMemberAvatars', () => {
  beforeAll(async () => {
    homeKeys = await createKeyPair()
    peerKeys = await createKeyPair()
    homeCom.privateJwtKey = homeKeys.privateKey
    peerCom.publicJwtKey = peerKeys.publicKey
  })

  beforeEach(() => {
    entryExists = true
    received = []
    findEntry.mockClear()
  })

  afterEach(() => {
    rawRequest?.mockRestore()
    rawRequest = undefined
  })

  it('hands back what the other community answered about its members', async () => {
    peerAnswers((handshakeID) =>
      answerWith(handshakeID, [{ gradidoID: ANNA, avatarUpdatedAt: MONDAY, avatar: FACE }]),
    )

    const result = await xcomMemberAvatars(homeCom, peerCom, 'small', [ANNA, BEN], 5000)

    expect(result).toEqual({
      success: true,
      value: [{ gradidoID: ANNA, avatarUpdatedAt: MONDAY, avatar: FACE }],
    })
    // What travelled: the question as the other side could open it, and the key it uses to
    // find out who is asking (the federation resolver looks the community up by it).
    expect(received).toHaveLength(1)
    expect(received[0].publicKey).toBe(homeCom.publicKey.toString('hex'))
    expect(received[0].question).toMatchObject({
      tokentype: MemberAvatarsJwtPayloadType.MEMBER_AVATARS_TYPE,
      kind: 'small',
      gradidoIDs: [ANNA, BEN],
    })
    expect(findEntry).toHaveBeenCalledWith(peerCom.publicKey, CONFIG.FEDERATION_BACKEND_SEND_ON_API)
  })

  /**
   * ⛔ A token that verifies, decrypts and even carries a valid member list -- only its type is
   * wrong. Without the list, the shape check behind the tokentype check would refuse it as
   * well, and this test would stay green with the tokentype check removed.
   */
  it('does not take a token of another type for an answer', async () => {
    peerAnswers((handshakeID) =>
      Object.assign(
        answerWith(handshakeID, [{ gradidoID: ANNA, avatarUpdatedAt: MONDAY, avatar: FACE }]),
        { tokentype: MemberAvatarsJwtPayloadType.MEMBER_AVATARS_TYPE },
      ),
    )

    expectFailure(await xcomMemberAvatars(homeCom, peerCom, 'small', [ANNA], 5000), 'tokentype')
  })

  it('turns a request that fails into a failed result, not a throw', async () => {
    stubRawRequest(async () => {
      throw new Error('connect ECONNREFUSED 10.0.0.1:443')
    })

    expectFailure(await xcomMemberAvatars(homeCom, peerCom, 'small', [ANNA], 5000), 'ECONNREFUSED')
  })

  // An older community without the query answers "Cannot query field", one that does not
  // trust this one "memberAvatars refused: ...". graphql-request's own message for that
  // appends the whole request as JSON, token included -- the reason keeps only the refusal.
  it('reports a refusal without the request it refused', async () => {
    let sentToken = ''
    stubRawRequest(async (request) => {
      sentToken = request.variables.args.jwt
      throw new ClientError(
        {
          errors: [{ message: 'memberAvatars refused: requesting community is not authenticated' }],
          status: 200,
        } as unknown as ConstructorParameters<typeof ClientError>[0],
        { query: 'memberAvatars', variables: request.variables },
      )
    })

    const result = await xcomMemberAvatars(homeCom, peerCom, 'small', [ANNA], 5000)

    expectFailure(result, 'memberAvatars refused: requesting community is not authenticated')
    expect(sentToken.length).toBeGreaterThan(0)
    expect(result.success || result.error.reason.includes(sentToken)).toBe(false)
  })

  /**
   * ⛔ The time limit is the signal handed to the request. This stand-in behaves like the real
   * fetch: it answers after two seconds unless the signal aborts it first -- so the case fails
   * the moment the signal is no longer passed on, and no clock has to be faked.
   */
  it('gives up on a community that does not answer within the time limit', async () => {
    stubRawRequest(
      (request) =>
        new Promise((resolve, reject) => {
          const late = setTimeout(() => {
            resolve(sealedAnswer(request, (handshakeID) => answerWith(handshakeID, [])))
          }, 2000)
          request.signal?.addEventListener('abort', () => {
            clearTimeout(late)
            reject(request.signal?.reason ?? new Error('aborted'))
          })
        }),
    )

    const started = Date.now()
    const result = await xcomMemberAvatars(homeCom, peerCom, 'small', [ANNA], 50)

    expect(Date.now() - started).toBeLessThan(1000)
    expectFailure(result, 'memberAvatars failed')
  })

  it('does not take an answer about a member nobody asked about', async () => {
    peerAnswers((handshakeID) =>
      answerWith(handshakeID, [{ gradidoID: BEN, avatarUpdatedAt: MONDAY, avatar: FACE }]),
    )

    expectFailure(
      await xcomMemberAvatars(homeCom, peerCom, 'small', [ANNA], 5000),
      'nobody asked about',
    )
  })

  // One date that does not parse would make GraphQL throw away the backend's whole answer --
  // this community's own faces with it.
  it('does not take an answer with a date that does not parse', async () => {
    peerAnswers((handshakeID) =>
      answerWith(handshakeID, [{ gradidoID: ANNA, avatarUpdatedAt: 'not a date', avatar: FACE }]),
    )

    expectFailure(await xcomMemberAvatars(homeCom, peerCom, 'small', [ANNA], 5000), 'date')
  })

  // The same for a picture that is not a string: GraphQL cannot serialise it as one.
  it('does not take an answer whose picture is not a picture', async () => {
    peerAnswers((handshakeID) =>
      answerWith(handshakeID, [
        { gradidoID: ANNA, avatarUpdatedAt: MONDAY, avatar: { not: 'a picture' } },
      ]),
    )

    expectFailure(await xcomMemberAvatars(homeCom, peerCom, 'small', [ANNA], 5000), 'picture')
  })

  it('asks nothing when the community has no federation entry for the API version', async () => {
    entryExists = false
    peerAnswers((handshakeID) => answerWith(handshakeID, []))

    expectFailure(
      await xcomMemberAvatars(homeCom, peerCom, 'small', [ANNA], 5000),
      'no federation entry',
    )
    expect(rawRequest).not.toHaveBeenCalled()
  })

  // A mistake of the caller rather than something the other community did.
  it('throws for a zoom that names more than one member', async () => {
    await expect(xcomMemberAvatars(homeCom, peerCom, 'full', [ANNA, BEN], 5000)).rejects.toThrow(
      'gradidoIDs for kind full',
    )
  })
})
