// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { CommunitiesSelect } from 'database'
import { AVATAR_FULL_MAX_BYTES, AVATAR_SMALL_MAX_BYTES } from 'shared'
import { Ed25519KeyPair, X25519KeyPair } from 'shared-native'
import { ApiClient } from '../ApiClient'
import { xcomMemberAvatarDates, xcomMemberAvatarFull, xcomMemberAvatarsSmall } from './askingSide'

// The other community is a stub on the client's request: what it answers goes through the
// checks of the answer as between two servers. The envelope is apiRoutes' own test.
// ⛔ spyOn, not mock.module: Bun cannot restore a module mock and core runs without --isolate.

const PEER_UUID = '22222222-2222-4222-8222-222222222222'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const BEN = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const MONDAY = '2026-09-14T10:00:00.000Z'
// A picture that decodes, 4 x 2 grey pixels: what another community answers with is held to
// the bounds of this community's own avatars, header included.
const FACE =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//wAALCAACAAQBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AP//Z'
// 200 x 200 grey pixels: more than a small rendition may have, well within a full one.
const FACE_200_PIXELS =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//wAALCADIAMgBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//Z'

const peer = {
  communityUuid: PEER_UUID,
  url: 'http://peer.invalid/api/',
  publicKey: Ed25519KeyPair.generate().toBuffer().publicKey,
  publicEncryptionKey: X25519KeyPair.generate().toBuffer().publicKey,
} as CommunitiesSelect

const jpegOf = (bytes: number) =>
  Buffer.concat([
    Buffer.from(FACE, 'base64'),
    Buffer.alloc(bytes - Buffer.from(FACE, 'base64').length - 2, 0x20),
    Buffer.from([0xff, 0xd9]),
  ]).toString('base64')

let spies: { mockRestore: () => void }[] = []
type Route = 'memberAvatarsSmall' | 'memberAvatarDates' | 'memberAvatarFull'
const peerAnswers = (route: Route, data: unknown, error: unknown = null) => {
  const spy = spyOn(ApiClient.prototype, route).mockResolvedValue({ data, error } as never)
  spies.push(spy)
  return spy
}
afterEach(() => {
  for (const spy of spies) {
    spy.mockRestore()
  }
  spies = []
})

const reasonOf = (result: { success: boolean; error?: { reason: string } }) =>
  result.success ? 'success' : result.error?.reason

describe('xcomMemberAvatarsSmall', () => {
  it('takes the pictures of the members asked about, with their dates', async () => {
    const asked = peerAnswers('memberAvatarsSmall', [
      { gradidoId: ANNA, avatarUpdatedAt: MONDAY, avatar: FACE },
    ])
    expect(await xcomMemberAvatarsSmall(peer, [ANNA, BEN])).toEqual({
      success: true,
      value: [{ gradidoId: ANNA, avatarUpdatedAt: new Date(MONDAY), avatar: FACE }],
    })
    expect(asked).toHaveBeenCalledWith({ gradidoIds: [ANNA, BEN] })
  })

  it('is a failure naming the community where it does not answer', async () => {
    peerAnswers('memberAvatarsSmall', null, { status: 503 })
    const result = await xcomMemberAvatarsSmall(peer, [ANNA])
    expect(result.success).toBe(false)
    expect(!result.success && result.error.message).toContain(PEER_UUID)
  })

  it('does not take a member nobody asked about, nor one twice', async () => {
    peerAnswers('memberAvatarsSmall', [{ gradidoId: BEN, avatarUpdatedAt: MONDAY, avatar: FACE }])
    expect(reasonOf(await xcomMemberAvatarsSmall(peer, [ANNA]))).toContain('nobody asked')
    spies.pop()?.mockRestore()

    const anna = { gradidoId: ANNA, avatarUpdatedAt: MONDAY, avatar: FACE }
    peerAnswers('memberAvatarsSmall', [anna, anna])
    expect(reasonOf(await xcomMemberAvatarsSmall(peer, [ANNA]))).toContain('twice')
  })

  it('does not take a date it would not take with a transfer', async () => {
    for (const avatarUpdatedAt of ['2026-02-30T10:00:00.000Z', '2019-01-01T00:00:00.000Z', null]) {
      peerAnswers('memberAvatarsSmall', [{ gradidoId: ANNA, avatarUpdatedAt, avatar: FACE }])
      expect(reasonOf(await xcomMemberAvatarsSmall(peer, [ANNA]))).not.toBe('success')
      spies.pop()?.mockRestore()
    }
  })

  // ⛔ What passes goes to the wallet as it is, and stays on members' devices.
  describe('a picture this community would not take of its own members', () => {
    const answerWithPicture = (avatar: string) => {
      spies.pop()?.mockRestore()
      peerAnswers('memberAvatarsSmall', [{ gradidoId: ANNA, avatarUpdatedAt: MONDAY, avatar }])
    }

    it('takes a small picture of exactly the limit and not one byte more', async () => {
      answerWithPicture(jpegOf(AVATAR_SMALL_MAX_BYTES))
      expect(reasonOf(await xcomMemberAvatarsSmall(peer, [ANNA]))).toBe('success')
      answerWithPicture(jpegOf(AVATAR_SMALL_MAX_BYTES + 1))
      expect(reasonOf(await xcomMemberAvatarsSmall(peer, [ANNA]))).toContain('TOO_LARGE')
    })

    it('does not take what is no picture, or not plain base64, or too many pixels', async () => {
      const framed = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9])
      const cases: [string, string][] = [
        [jpegOf(AVATAR_SMALL_MAX_BYTES + 3), 'too long'],
        ['', 'EMPTY'],
        [Buffer.from('<svg onload=alert(1)>').toString('base64'), 'NOT_JPEG'],
        [framed.toString('base64'), 'no JPEG header'],
        [`${FACE.slice(0, 40)}\n${FACE.slice(40)}`, 'not plain base64'],
        [FACE_200_PIXELS, 'too many pixels'],
      ]
      for (const [avatar, reason] of cases) {
        answerWithPicture(avatar)
        expect(reasonOf(await xcomMemberAvatarsSmall(peer, [ANNA]))).toContain(reason)
      }
    })

    it('fails the whole answer for one such picture, and the reason names no picture', async () => {
      peerAnswers('memberAvatarsSmall', [
        { gradidoId: ANNA, avatarUpdatedAt: MONDAY, avatar: FACE },
        { gradidoId: BEN, avatarUpdatedAt: MONDAY, avatar: FACE_200_PIXELS },
      ])
      const reason = reasonOf(await xcomMemberAvatarsSmall(peer, [ANNA, BEN]))
      expect(reason).toContain('too many pixels')
      expect(reason).not.toContain(FACE_200_PIXELS.slice(0, 40))
    })
  })

  // a mistake of the caller rather than something the other community did
  it('throws for a question without members', async () => {
    expect(() => xcomMemberAvatarsSmall(peer, [])).toThrow()
  })
})

describe('xcomMemberAvatarFull', () => {
  it('takes the full picture, held to its own, wider limit', async () => {
    peerAnswers('memberAvatarFull', FACE_200_PIXELS)
    expect(await xcomMemberAvatarFull(peer, ANNA)).toEqual({
      success: true,
      value: FACE_200_PIXELS,
    })
    spies.pop()?.mockRestore()

    peerAnswers('memberAvatarFull', jpegOf(AVATAR_FULL_MAX_BYTES + 1))
    expect(reasonOf(await xcomMemberAvatarFull(peer, ANNA))).toContain('too long')
  })

  it('takes no picture as no picture', async () => {
    peerAnswers('memberAvatarFull', null)
    expect(await xcomMemberAvatarFull(peer, ANNA)).toEqual({ success: true, value: null })
  })
})

describe('xcomMemberAvatarDates', () => {
  it('takes the dates of the members asked about', async () => {
    peerAnswers('memberAvatarDates', [{ gradidoId: BEN, avatarUpdatedAt: MONDAY }])
    expect(await xcomMemberAvatarDates(peer, [ANNA, BEN])).toEqual({
      success: true,
      value: [{ gradidoId: BEN, avatarUpdatedAt: new Date(MONDAY) }],
    })
  })
})
