// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Community as DbCommunity } from 'database'
import { Ed25519PublicKey } from 'shared'
import { getLogger } from '../../../../../config-schema/test/testSetup.bun'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../../config/const'
import { EncryptedTransferArgs } from '../../../graphql/model/EncryptedTransferArgs'
import {
  memberAvatarDateForTransfer,
  readTransferAvatarDate,
  storeForeignMemberAvatarDate,
  storeTransferSenderAvatarDate,
} from './transferAvatarDate'

// ⛔ No mock.module('database') here: Bun cannot restore a module mock, and two test files of
// this package already replace that module (validation/user.test.ts, xcomMemberAvatars.test.ts).
// The functions take their queries as a last parameter instead. The real queries behind the
// defaults run against a database in the federation tests (SendCoinsResolver.test.ts).

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.xcom.transferAvatarDate`)

const NOW = new Date('2026-09-15T12:00:00.000Z')
const PICTURE_DATE = '2026-09-15T06:00:00.000Z'
const SIGNER = '56a55482-909e-46a4-bfa2-cd025e894ebb'
const NAMED_IN_PAYLOAD = '56a55482-909e-46a4-bfa2-cd025e894ebe'
const MEMBER = '56a55482-909e-46a4-bfa2-cd025e894ebc'

const failingWith = (message: string) => async () => {
  throw new Error(message)
}

describe('readTransferAvatarDate', () => {
  it('reads an ISO date and nothing else', () => {
    expect(readTransferAvatarDate(PICTURE_DATE, NOW)).toEqual(new Date(PICTURE_DATE))
    for (const value of [null, undefined, 1757916000000, { date: PICTURE_DATE }, 'gestern']) {
      expect(readTransferAvatarDate(value, NOW)).toBeNull()
    }
  })

  // Date.parse would take all four -- the first as March 2nd, the third in this server's time
  // zone. The same moment written the way toISOString writes it is taken.
  it('discards a date that does not print back as the same string', () => {
    for (const value of [
      '2026-02-30T00:00:00.000Z',
      '2026-09-15T06:00:00Z',
      '2026-09-15 06:00:00',
      '2026-09-15T08:00:00.000+02:00',
    ]) {
      expect(Number.isNaN(Date.parse(value))).toBe(false)
      expect(readTransferAvatarDate(value, NOW)).toBeNull()
    }
    expect(readTransferAvatarDate('2026-09-15T06:00:00.000Z', NOW)).toEqual(
      new Date('2026-09-15T06:00:00.000Z'),
    )
  })

  it('discards a date before 2020 and one more than a day ahead', () => {
    expect(readTransferAvatarDate('2020-01-01T00:00:00.000Z', NOW)).toEqual(
      new Date('2020-01-01T00:00:00.000Z'),
    )
    expect(readTransferAvatarDate('2019-12-31T23:59:59.999Z', NOW)).toBeNull()
    expect(readTransferAvatarDate('2026-09-16T12:00:00.000Z', NOW)).toEqual(
      new Date('2026-09-16T12:00:00.000Z'),
    )
    expect(readTransferAvatarDate('2026-09-16T12:00:00.001Z', NOW)).toBeNull()
    expect(readTransferAvatarDate('0001-01-01T00:00:00.000Z', NOW)).toBeNull()
    expect(readTransferAvatarDate('9999-12-31T00:00:00.000Z', NOW)).toBeNull()
  })
})

describe('memberAvatarDateForTransfer', () => {
  it('takes the date of a member who may be shown and null for one who may not', async () => {
    const shown = { readDates: async () => new Map([[7, new Date(PICTURE_DATE)]]) }
    const notShown = { readDates: async () => new Map<number, Date>() }

    expect(await memberAvatarDateForTransfer(7, shown)).toBe(PICTURE_DATE)
    expect(await memberAvatarDateForTransfer(7, notShown)).toBeNull()
  })

  it('sends the transfer without a date when the read fails', async () => {
    logger.warn.mockClear()

    expect(
      await memberAvatarDateForTransfer(7, { readDates: failingWith('database gone') }),
    ).toBeNull()
    expect(logger.warn).toHaveBeenCalledWith(
      'picture date for a transfer not read',
      expect.any(Error),
    )
  })
})

describe('storeForeignMemberAvatarDate', () => {
  const upsert = mock(async (_rows: unknown[]) => undefined)

  beforeEach(() => {
    upsert.mockClear()
    logger.warn.mockClear()
  })

  it('files the date under the pair the caller names, with the time of the check', async () => {
    const before = Date.now()

    await storeForeignMemberAvatarDate(SIGNER, MEMBER, PICTURE_DATE, { upsert })

    expect(upsert).toHaveBeenCalledTimes(1)
    expect(upsert.mock.calls[0][0]).toEqual([
      {
        communityUuid: SIGNER,
        gradidoId: MEMBER,
        avatarUpdatedAt: new Date(PICTURE_DATE),
        checkedAt: expect.any(Date),
      },
    ])
    const [{ checkedAt }] = upsert.mock.calls[0][0] as { checkedAt: Date }[]
    expect(checkedAt.getTime()).toBeGreaterThanOrEqual(before)
  })

  it('files nothing for a missing, null or unusable date and for a gradido id that is not a string', async () => {
    await storeForeignMemberAvatarDate(SIGNER, MEMBER, undefined, { upsert })
    await storeForeignMemberAvatarDate(SIGNER, MEMBER, null, { upsert })
    await storeForeignMemberAvatarDate(SIGNER, MEMBER, 'gestern', { upsert })
    await storeForeignMemberAvatarDate(SIGNER, MEMBER, '1999-01-01T00:00:00.000Z', { upsert })
    await storeForeignMemberAvatarDate(SIGNER, 4711, PICTURE_DATE, { upsert })
    await storeForeignMemberAvatarDate(null, MEMBER, PICTURE_DATE, { upsert })

    expect(upsert).not.toHaveBeenCalled()
    // A server without the field and one with nothing to show are no reason for a log line;
    // a date the other server should not have sent is.
    expect(logger.warn.mock.calls.map((call: unknown[]) => call[1])).toEqual([
      'gestern',
      '1999-01-01T00:00:00.000Z',
    ])
  })

  // What keeps a booked transfer booked: this runs after the money has moved, and a throw would
  // reach the settle that booked it.
  it('does not throw when the write fails', async () => {
    const failing = mock(failingWith('duplicate write refused'))

    await storeForeignMemberAvatarDate(SIGNER, MEMBER, PICTURE_DATE, { upsert: failing })

    expect(failing).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith(
      'picture date of a member of another community not stored',
      expect.any(Error),
    )
  })
})

describe('storeTransferSenderAvatarDate', () => {
  const SIGNER_KEY = 'f'.repeat(64)
  const args: EncryptedTransferArgs = { handshakeID: 'handshakeID', publicKey: SIGNER_KEY, jwt: '' }
  const payload = {
    senderCommunityUuid: NAMED_IN_PAYLOAD,
    senderUserUuid: MEMBER,
    senderAvatarUpdatedAt: PICTURE_DATE,
  }
  const store = mock(
    async (_uuid: string | null, _gradidoId: unknown, _value: unknown) => undefined,
  )
  const findCommunity = mock(
    async (_publicKey: Ed25519PublicKey) =>
      ({ communityUuid: SIGNER, authenticatedAt: new Date() }) as DbCommunity,
  )

  beforeEach(() => {
    store.mockClear()
    findCommunity.mockClear()
    logger.warn.mockClear()
  })

  it("files the sender's date under the community that signed, not the one the payload names", async () => {
    await storeTransferSenderAvatarDate(args, payload, { findCommunity, store })

    expect(findCommunity.mock.calls[0][0].asHex()).toBe(SIGNER_KEY)
    expect(store.mock.calls).toEqual([[SIGNER, MEMBER, PICTURE_DATE]])
  })

  it('files nothing for a signer without completed handshake', async () => {
    const withoutHandshake = mock(
      async (_publicKey: Ed25519PublicKey) =>
        ({ communityUuid: SIGNER, authenticatedAt: null }) as DbCommunity,
    )

    await storeTransferSenderAvatarDate(args, payload, { findCommunity: withoutHandshake, store })

    expect(withoutHandshake).toHaveBeenCalledTimes(1)
    expect(store).not.toHaveBeenCalled()
  })

  it('does not throw when the signer cannot be resolved', async () => {
    await storeTransferSenderAvatarDate(args, payload, {
      findCommunity: failingWith('EntityNotFoundError'),
      store,
    })

    expect(store).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(
      'community that signed the transfer not found, picture date not stored',
      expect.any(Error),
    )
  })
})
