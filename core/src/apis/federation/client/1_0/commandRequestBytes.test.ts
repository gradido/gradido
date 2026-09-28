// AI-GENERATED — not an architecture reference
import { beforeAll, describe, expect, it } from 'bun:test'
import { randomBytes, randomUUID } from 'node:crypto'
import { FederatedCommunity as DbFederatedCommunity } from 'database'
import {
  ALIAS_MAX_CHARS,
  CHAT_IMAGE_MAX_BYTES,
  CommandJwtPayloadType,
  createKeyPair,
  encryptAndSign,
  MESSAGE_MAX_CHARS,
} from 'shared'
import { SendEmailCommand } from '../../../../command/commands/SendEmailCommand'
import { EncryptedTransferArgs } from '../../../../graphql/model/EncryptedTransferArgs'
import { CommandClient } from './CommandClient'
import { commandRequestBytes, commandRequestFits } from './commandRequestBytes'

/** The wallet's target for a picture (E-046); CHAT_IMAGE_TARGET_BYTES lives in the wallet. */
const WALLET_TARGET_BYTES = 32 * 1024
/** The longest handshake id randombytes_random() gives the sending server. */
const HANDSHAKE_ID = '4294967295'

const VARIATION_SELECTOR = String.fromCodePoint(0xfe0f)
const text = (piece: string): string => piece.repeat(MESSAGE_MAX_CHARS)
// Texts of MESSAGE_MAX_CHARS characters as MaxLength counts them (validator.js): an emoji is one
// character, and so is a character together with the variation selector after it.
const GERMAN = 'Grüße aus Köln, bis später! Übermorgen früh? '
  .repeat(MESSAGE_MAX_CHARS)
  .slice(0, MESSAGE_MAX_CHARS)
const EMOJI = text('😀')
const QUOTATION_MARKS = text('"')
const EMOJI_WITH_SELECTOR = text(`😀${VARIATION_SELECTOR}`)
const CONTROL_WITH_SELECTOR = text(`${String.fromCharCode(1)}${VARIATION_SELECTOR}`)

const argsWith = (jwt: string, handshakeID = HANDSHAKE_ID): EncryptedTransferArgs => {
  const args = new EncryptedTransferArgs()
  args.handshakeID = handshakeID
  args.publicKey = randomBytes(32).toString('hex')
  args.jwt = jwt
  return args
}

describe('commandRequestBytes', () => {
  // ⛔ What graphql-request sends, not what it is given: the body is taken from CommandClient's own
  // GraphQLClient, with its own options -- only the transport is replaced.
  it('counts the body CommandClient sends, byte for byte', async () => {
    const client = new CommandClient({
      endPoint: 'http://peer.invalid/api/',
      apiVersion: '1_0',
    } as DbFederatedCommunity)
    const bodies: string[] = []
    const transport = client.client as unknown as { options: { fetch?: unknown } }
    transport.options.fetch = async (_url: unknown, init?: { body?: unknown }) => {
      bodies.push(String(init?.body))
      return new Response(
        JSON.stringify({ data: { sendCommand: { success: true, data: null } } }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
    // A value beyond ASCII: body-parser counts bytes, not characters.
    const args = argsWith('eyJhbGciOiJSUzI1NiJ9.e30.c2lnbmF0dXJl', 'Grüße')

    expect(await client.sendCommandForAnswer(args)).toEqual({ success: true, value: null })

    expect(bodies).toHaveLength(1)
    expect(commandRequestBytes(args)).toBe(Buffer.byteLength(bodies[0], 'utf8'))
    expect(commandRequestBytes(args)).toBeGreaterThan(bodies[0].length)
  })
})

describe('commandRequestFits', () => {
  // The federation module's 100 KB (102,400 bytes) less the 1 KB kept free.
  it('takes a request of up to 101,376 bytes, and not one byte more', () => {
    const around = commandRequestBytes(argsWith(''))

    expect(commandRequestFits(argsWith('a'.repeat(101_376 - around)))).toBe(true)
    expect(commandRequestFits(argsWith('a'.repeat(101_377 - around)))).toBe(false)
  })
})

/**
 * P7b, measured with the envelope itself -- encryptAndSign with keys of its size (RSA 2048) --,
 * not with a formula: the command for a chat message as deliverChatMessageAcrossBorder builds it,
 * every field as long as it gets.
 */
describe('the command for a chat message with a picture, sealed', () => {
  let home: { publicKey: string; privateKey: string }
  let peer: { publicKey: string; privateKey: string }

  beforeAll(async () => {
    home = await createKeyPair()
    peer = await createKeyPair()
  })

  /** The sealed command for a message with this text and a picture of this many bytes, or none. */
  const sealed = async (memo: string, pictureBytes = 0): Promise<EncryptedTransferArgs> => {
    const picture = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      randomBytes(Math.max(0, pictureBytes - 4)),
      Buffer.from([0xff, 0xd9]),
    ])
    const payload = new CommandJwtPayloadType(
      HANDSHAKE_ID,
      SendEmailCommand.SEND_MAIL_COMMAND,
      SendEmailCommand.name,
      [
        JSON.stringify({
          mailType: 'sendCustomEmail',
          senderComUuid: randomUUID(),
          senderGradidoId: randomUUID(),
          receiverComUuid: randomUUID(),
          receiverGradidoId: randomUUID(),
          subject: '',
          memo,
          messageUuid: randomUUID(),
          senderAlias: 'a'.repeat(ALIAS_MAX_CHARS),
          notify: 'none',
          ...(pictureBytes > 0
            ? {
                images: [
                  {
                    imageUuid: randomUUID(),
                    width: 924,
                    height: 520,
                    data: picture.toString('base64'),
                  },
                ],
              }
            : {}),
        }),
      ],
    )
    return argsWith(await encryptAndSign(payload, home.privateKey, peer.publicKey))
  }

  it("fits with the wallet's picture and 2000 characters -- emoji and quotation marks, which weigh the most, included", async () => {
    for (const caption of [GERMAN, EMOJI, QUOTATION_MARKS]) {
      expect(commandRequestFits(await sealed(caption, WALLET_TARGET_BYTES))).toBe(true)
    }
  })

  it('fits with the largest picture the server takes and 2000 characters of German', async () => {
    expect(commandRequestFits(await sealed(GERMAN, CHAT_IMAGE_MAX_BYTES))).toBe(true)
  })

  // What MaxLength counts as 2000 characters and what the envelope weighs are two things: an emoji
  // with a variation selector is one character and seven bytes, before JSON and the envelope.
  it('does not fit with 2000 emoji, each with a variation selector', async () => {
    expect(commandRequestFits(await sealed(EMOJI_WITH_SELECTOR, WALLET_TARGET_BYTES))).toBe(false)
    expect(commandRequestFits(await sealed(EMOJI_WITH_SELECTOR, CHAT_IMAGE_MAX_BYTES))).toBe(false)
  })

  // Without a picture nothing comes near the limit, the heaviest text of all included.
  it('fits without a picture, whatever the text', async () => {
    for (const caption of [EMOJI_WITH_SELECTOR, CONTROL_WITH_SELECTOR]) {
      expect(commandRequestFits(await sealed(caption))).toBe(true)
    }
  })
})
