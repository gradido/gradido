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
import { EditChatMessageCommand } from '../../../../command/commands/EditChatMessageCommand'
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
/** So many characters of a sentence written over and over -- of letters that are one unit each. */
const written = (sentence: string, characters = MESSAGE_MAX_CHARS): string =>
  sentence.repeat(characters).slice(0, characters)
// Texts of MESSAGE_MAX_CHARS characters as MaxLength counts them (validator.js): an emoji is one
// character, and so is a character together with the variation selector after it.
const GERMAN = 'Grüße aus Köln, bis später! Übermorgen früh? '
const RUSSIAN = 'Привет из Москвы, до встречи завтра утром! '
const GREEK = 'Χαιρετισμούς από την Αθήνα, τα λέμε αύριο! '
const ARABIC = 'تحياتي من القاهرة، أراك غدا في الصباح! '
const CHINESE = '你好我们明天早上在市场见面好吗谢谢'
const HINDI = 'नमस्ते, कल सुबह बाज़ार में मिलते हैं। '
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

// The two communities' keys, of the size the envelope has (RSA 2048).
let home: { publicKey: string; privateKey: string }
let peer: { publicKey: string; privateKey: string }

beforeAll(async () => {
  home = await createKeyPair()
  peer = await createKeyPair()
})

/**
 * P7b, measured with the envelope itself -- encryptAndSign with keys of its size (RSA 2048) --,
 * not with a formula: the command for a chat message as deliverChatMessageAcrossBorder builds it,
 * every field as long as it gets.
 */
describe('the command for a chat message with a picture, sealed', () => {
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

  // A message's full length (MESSAGE_MAX_CHARS) in the scripts whose letters are one or two bytes:
  // the languages the wallet speaks are all among them.
  it("fits with the wallet's picture and a text of full length in Latin, Cyrillic, Greek or Arabic letters", async () => {
    for (const sentence of [GERMAN, RUSSIAN, GREEK, ARABIC]) {
      expect(commandRequestFits(await sealed(written(sentence), WALLET_TARGET_BYTES))).toBe(true)
    }
  })

  it('fits with the largest picture the server takes and a text of full length in German', async () => {
    expect(commandRequestFits(await sealed(written(GERMAN), CHAT_IMAGE_MAX_BYTES))).toBe(true)
  })

  // What MaxLength counts and what the envelope weighs are two things: a Chinese character is
  // three bytes, an emoji four -- with a variation selector seven, and still one character --, and
  // JSON has written a quotation mark as four by the time it is sealed. The sending server refuses
  // such a message before anything is filed, and the wallet says that the text is too long to go
  // with the picture.
  it('does not fit with the picture and a text of full length where a character weighs three bytes or more', async () => {
    for (const caption of [written(CHINESE), EMOJI, QUOTATION_MARKS, EMOJI_WITH_SELECTOR]) {
      expect(commandRequestFits(await sealed(caption, WALLET_TARGET_BYTES))).toBe(false)
    }
  })

  // How far such a text goes beside a picture: 3,927 characters of Chinese, 4,568 of Hindi and
  // 2,945 emoji beside the wallet's picture, 4,291 of Russian beside the largest this server takes
  // (measured 12.10.2026; the comment at CHAT_IMAGE_MAX_BYTES in shared gives them rounded). Held
  // with more than a hundred characters of room on either side: a few bytes more in the envelope
  // are not what this is about.
  const HOW_FAR: [
    script: string,
    picture: string,
    pictureBytes: number,
    fitting: number,
    tooLong: number,
    sentence: string,
  ][] = [
    ['Chinese', "the wallet's picture", WALLET_TARGET_BYTES, 3800, 4050, CHINESE],
    ['Hindi', "the wallet's picture", WALLET_TARGET_BYTES, 4400, 4750, HINDI],
    ['Russian', 'the largest picture the server takes', CHAT_IMAGE_MAX_BYTES, 4100, 4500, RUSSIAN],
  ]
  it.each(HOW_FAR)(
    'takes %s beside %s up to some length',
    async (_script, _picture, pictureBytes, fitting, tooLong, sentence) => {
      expect(commandRequestFits(await sealed(written(sentence, fitting), pictureBytes))).toBe(true)
      expect(commandRequestFits(await sealed(written(sentence, tooLong), pictureBytes))).toBe(false)
    },
  )

  // An emoji is two units and one character: repeated, not cut by units.
  it("takes emoji beside the wallet's picture up to some length", async () => {
    expect(commandRequestFits(await sealed('😀'.repeat(2850), WALLET_TARGET_BYTES))).toBe(true)
    expect(commandRequestFits(await sealed('😀'.repeat(3050), WALLET_TARGET_BYTES))).toBe(false)
  })

  // Without a picture every text goes, the heaviest of all included -- and that one not by much:
  // 91 of the 99 KB.
  it('fits without a picture, whatever the text', async () => {
    for (const caption of [EMOJI_WITH_SELECTOR, CONTROL_WITH_SELECTOR]) {
      expect(commandRequestFits(await sealed(caption))).toBe(true)
    }
  })
})

/**
 * The change of a message (E-060) carries its new text and no picture, and nobody measures it
 * before it goes (carryChatMessageEditAcrossBorder in the backend): it has to fit whatever the
 * text. Measured as the message above is, with the command as that function builds it.
 */
describe('the command for a change of a message, sealed', () => {
  const sealed = async (body: string): Promise<EncryptedTransferArgs> => {
    const payload = new CommandJwtPayloadType(
      HANDSHAKE_ID,
      EditChatMessageCommand.EDIT_CHAT_MESSAGE_COMMAND,
      EditChatMessageCommand.name,
      [
        JSON.stringify({
          senderComUuid: randomUUID(),
          senderGradidoId: randomUUID(),
          messageUuid: randomUUID(),
          body,
        }),
      ],
    )
    return argsWith(await encryptAndSign(payload, home.privateKey, peer.publicKey))
  }

  it('fits whatever the text, the heaviest the sending server lets through included', async () => {
    for (const body of [written(GERMAN), EMOJI_WITH_SELECTOR, CONTROL_WITH_SELECTOR]) {
      expect(commandRequestFits(await sealed(body))).toBe(true)
    }
  })
})
