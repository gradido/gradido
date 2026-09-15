// AI-GENERATED — not an architecture reference
import { beforeAll, describe, expect, it } from 'bun:test'
import { randomBytes } from 'node:crypto'
import { createKeyPair, encryptAndSign, verifyAndDecrypt } from './JWT'
import {
  isMemberAvatarsKind,
  MemberAvatarsJwtPayloadType,
} from './payloadtypes/MemberAvatarsJwtPayloadType'
import {
  MemberAvatarPayload,
  MemberAvatarsResponseJwtPayloadType,
} from './payloadtypes/MemberAvatarsResponseJwtPayloadType'

// Both payloads cross a community border, so the round trip is the contract: whatever one
// server builds with encryptAndSign has to come out of verifyAndDecrypt on the other one,
// with every field and every null intact. The asking side encrypts for the answering side
// and signs as itself; the answer goes the other way round.
let asking: { publicKey: string; privateKey: string }
let answering: { publicKey: string; privateKey: string }

beforeAll(async () => {
  asking = await createKeyPair()
  answering = await createKeyPair()
})

const gid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

describe('the member pictures payloads', () => {
  it('carries the question to the other community', async () => {
    const jwt = await encryptAndSign(
      new MemberAvatarsJwtPayloadType('handshakeID', 'small', [gid(1), gid(2)]),
      asking.privateKey,
      answering.publicKey,
    )

    const received = await verifyAndDecrypt(
      'handshakeID',
      jwt,
      answering.privateKey,
      asking.publicKey,
    )

    expect(received).toEqual(
      expect.objectContaining({
        tokentype: MemberAvatarsJwtPayloadType.MEMBER_AVATARS_TYPE,
        handshakeID: 'handshakeID',
        kind: 'small',
        gradidoIDs: [gid(1), gid(2)],
      }),
    )
  })

  // `avatar: null` is what kind 'dates' sends. JSON keeps a null, and the reader of a date
  // answer must be able to tell "no picture data" from a missing field.
  it('carries the answer back, a null picture included', async () => {
    const members: MemberAvatarPayload[] = [
      { gradidoID: gid(1), avatarUpdatedAt: '2026-09-15T06:00:00.000Z', avatar: 'AQID' },
      { gradidoID: gid(2), avatarUpdatedAt: '2026-09-14T06:00:00.000Z', avatar: null },
    ]
    const jwt = await encryptAndSign(
      new MemberAvatarsResponseJwtPayloadType('handshakeID', members),
      answering.privateKey,
      asking.publicKey,
    )

    const received = await verifyAndDecrypt(
      'handshakeID',
      jwt,
      asking.privateKey,
      answering.publicKey,
    )

    expect(received).toEqual(
      expect.objectContaining({
        tokentype: MemberAvatarsResponseJwtPayloadType.MEMBER_AVATARS_RESPONSE_TYPE,
        handshakeID: 'handshakeID',
        members,
      }),
    )
  })

  it('does not open for a key the answer was not encrypted for', async () => {
    const stranger = await createKeyPair()
    const jwt = await encryptAndSign(
      new MemberAvatarsResponseJwtPayloadType('handshakeID', []),
      answering.privateKey,
      asking.publicKey,
    )

    await expect(
      verifyAndDecrypt('handshakeID', jwt, stranger.privateKey, answering.publicKey),
    ).rejects.toThrow()
  })

  it('knows the three kinds and nothing else', () => {
    expect(['small', 'full', 'dates'].every(isMemberAvatarsKind)).toBe(true)
    expect(
      ['SMALL', 'thumbnail', '', null, undefined, 1, ['small']].some(isMemberAvatarsKind),
    ).toBe(false)
  })

  /**
   * CHECK-F5: the biggest answer kind 'small' produces -- a full chunk of 100 members at
   * ~11 KB of base64 each, the size the wallet's step-down aims for (~8 KB of JPEG). That is
   * about 1.1 MB of payload, base64-encoded once more inside the JWE and again inside the
   * JWS around it. Asserted for correctness; the durations are printed for the record,
   * because a time limit here would measure the CI runner rather than the code.
   */
  it('carries a full chunk of 100 pictures intact', async () => {
    const members: MemberAvatarPayload[] = Array.from({ length: 100 }, (_, n) => ({
      gradidoID: gid(n),
      avatarUpdatedAt: new Date(Date.UTC(2026, 8, 15, 6, 0, n)).toISOString(),
      avatar: randomBytes(8250).toString('base64'),
    }))
    expect(members[0].avatar).toHaveLength(11000)

    const encryptStart = performance.now()
    const jwt = await encryptAndSign(
      new MemberAvatarsResponseJwtPayloadType('handshakeID', members),
      answering.privateKey,
      asking.publicKey,
    )
    const encryptMs = performance.now() - encryptStart

    const decryptStart = performance.now()
    const received = await verifyAndDecrypt(
      'handshakeID',
      jwt,
      asking.privateKey,
      answering.publicKey,
    )
    const decryptMs = performance.now() - decryptStart

    expect((received as MemberAvatarsResponseJwtPayloadType).members).toEqual(members)

    // biome-ignore lint/suspicious/noConsole: measure time (CHECK-F5)
    console.log(
      `CHECK-F5 100 x 11 KB: encryptAndSign ${encryptMs.toFixed(0)} ms, verifyAndDecrypt ${decryptMs.toFixed(0)} ms, token ${(jwt.length / 1024 / 1024).toFixed(2)} MB`,
    )
  })
})
