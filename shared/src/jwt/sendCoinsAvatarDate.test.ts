// AI-GENERATED — not an architecture reference
import { beforeAll, describe, expect, it } from 'bun:test'
import { createKeyPair, encryptAndSign, verifyAndDecrypt } from './JWT'
import { SendCoinsJwtPayloadType } from './payloadtypes/SendCoinsJwtPayloadType'
import { SendCoinsResponseJwtPayloadType } from './payloadtypes/SendCoinsResponseJwtPayloadType'

// The picture date is an optional field on both transfer payloads, and a server on either
// side may be one that does not know it. The round trip has three answers to keep apart:
// a date, null (nothing to show) and no key at all (built without the field). A reader that
// is handed undefined must be able to tell it from null.
let sending: { publicKey: string; privateKey: string }
let receiving: { publicKey: string; privateKey: string }

beforeAll(async () => {
  sending = await createKeyPair()
  receiving = await createKeyPair()
})

const PICTURE_DATE = '2026-09-15T06:00:00.000Z'
const RECIPIENT_COMMUNITY = '56a55482-909e-46a4-bfa2-cd025e894eba'
const SENDER_COMMUNITY = '56a55482-909e-46a4-bfa2-cd025e894ebb'
const SENDER = '56a55482-909e-46a4-bfa2-cd025e894ebc'
const RECIPIENT = '56a55482-909e-46a4-bfa2-cd025e894ebd'

/** The settle payload with a date, or with null; the sender signs, the recipient opens it. */
const settle = async (senderAvatarUpdatedAt: string | null) =>
  await roundTripToRecipient(
    new SendCoinsJwtPayloadType(
      'handshakeID',
      RECIPIENT_COMMUNITY,
      RECIPIENT,
      '2026-09-15T07:00:00.000Z',
      '100.0000',
      'memo',
      SENDER_COMMUNITY,
      SENDER,
      'first last',
      'alias',
      undefined,
      senderAvatarUpdatedAt,
    ),
  )

const roundTripToRecipient = async (payload: SendCoinsJwtPayloadType) => {
  const jwt = await encryptAndSign(payload, sending.privateKey, receiving.publicKey)
  return await verifyAndDecrypt('handshakeID', jwt, receiving.privateKey, sending.publicKey)
}

/** The answer to the vote; the recipient signs, the sender opens it. */
const roundTripToSender = async (payload: SendCoinsResponseJwtPayloadType) => {
  const jwt = await encryptAndSign(payload, receiving.privateKey, sending.publicKey)
  return await verifyAndDecrypt('handshakeID', jwt, sending.privateKey, receiving.publicKey)
}

describe('the picture date on the transfer payloads', () => {
  describe('from the sender, in the settle payload', () => {
    it("carries the sender's picture date with the settle payload", async () => {
      expect(await settle(PICTURE_DATE)).toEqual(
        expect.objectContaining({
          tokentype: SendCoinsJwtPayloadType.SEND_COINS_TYPE,
          senderUserUuid: SENDER,
          senderAvatarUpdatedAt: PICTURE_DATE,
        }),
      )
    })

    it('carries a null date as null', async () => {
      const received = await settle(null)
      expect(received).toHaveProperty('senderAvatarUpdatedAt', null)
    })

    // The promise to a server without the field: the call that existed before it -- the one
    // the vote still makes -- sends no key at all, so a reader gets undefined, not null.
    it('a payload built without the field arrives without it', async () => {
      const received = await roundTripToRecipient(
        new SendCoinsJwtPayloadType(
          'handshakeID',
          RECIPIENT_COMMUNITY,
          RECIPIENT,
          '2026-09-15T07:00:00.000Z',
          '100.0000',
          'memo',
          SENDER_COMMUNITY,
          SENDER,
          'first last',
          'alias',
          undefined,
        ),
      )
      expect(received).toEqual(expect.objectContaining({ senderUserUuid: SENDER }))
      expect(received).not.toHaveProperty('senderAvatarUpdatedAt')
    })
  })

  describe('from the recipient, in the answer to the vote', () => {
    const answer = (recipAvatarUpdatedAt: string | null) =>
      new SendCoinsResponseJwtPayloadType(
        'handshakeID',
        true,
        RECIPIENT,
        'first',
        'last',
        'alias',
        recipAvatarUpdatedAt,
      )

    it("carries the recipient's picture date with the answer", async () => {
      expect(await roundTripToSender(answer(PICTURE_DATE))).toEqual(
        expect.objectContaining({
          tokentype: SendCoinsResponseJwtPayloadType.SEND_COINS_RESPONSE_TYPE,
          recipGradidoID: RECIPIENT,
          recipAvatarUpdatedAt: PICTURE_DATE,
        }),
      )
    })

    it('carries a null date as null', async () => {
      expect(await roundTripToSender(answer(null))).toHaveProperty('recipAvatarUpdatedAt', null)
    })

    // What a server without the field answers.
    it('an answer built without the field arrives without it', async () => {
      const received = await roundTripToSender(
        new SendCoinsResponseJwtPayloadType(
          'handshakeID',
          true,
          RECIPIENT,
          'first',
          'last',
          'alias',
        ),
      )
      expect(received).toEqual(expect.objectContaining({ recipGradidoID: RECIPIENT }))
      expect(received).not.toHaveProperty('recipAvatarUpdatedAt')
    })
  })
})
