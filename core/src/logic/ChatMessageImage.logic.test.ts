// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { inspect } from 'node:util'
import * as database from 'database'
import { CHAT_IMAGE_MAX_BYTES } from 'shared'
import { getLogger } from '../../../config-schema/test/testSetup.bun'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import {
  acceptChatMessageImage,
  ChatMessageImageToStore,
  chatMessageImageSizeFits,
  removeChatMessageImages,
  storeChatMessageImages,
} from './ChatMessageImage.logic'

// ⛔ spyOn, not mock.module: Bun cannot restore a module mock (see ChatMessage.logic.test.ts).
// The queries behind these spies run against a database in database/src/queries/
// chatMessageImages.test.ts.

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.logic.ChatMessageImage`)

const MESSAGE_UUID = '10000000-0000-4000-8000-000000000001'
const FIRST = '40000000-0000-4000-8000-000000000001'
const SECOND = '40000000-0000-4000-8000-000000000002'

// A JPEG with something recognisable inside: the log must never show it.
const SECRET = Buffer.from('a private picture of Anna and Ben')
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8]), SECRET, Buffer.from([0xff, 0xd9])])
const OTHER_JPEG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0x01]),
  SECRET,
  Buffer.from([0xff, 0xd9]),
])

const sent = (width = 800, height = 600, data = JPEG.toString('base64')) => ({
  data,
  width,
  height,
})

/** The reason a picture was refused, or 'taken'. */
const verdict = (picture: ReturnType<typeof sent>): string => {
  const accepted = acceptChatMessageImage(picture)
  return accepted.success ? 'taken' : accepted.error.reason
}

/** A JPEG of exactly this many bytes. */
const jpegOf = (bytes: number): Buffer =>
  Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    Buffer.alloc(bytes - 4, 0x20),
    Buffer.from([0xff, 0xd9]),
  ])

const pictures: ChatMessageImageToStore[] = [
  { imageUuid: FIRST, position: 0, width: 800, height: 600, image: JPEG },
  { imageUuid: SECOND, position: 1, width: 393, height: 1220, image: OTHER_JPEG },
]

/** Everything this file's logger was handed, at any level, as one piece of text. */
const everythingLogged = () =>
  ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
    .flatMap((level) => logger[level].mock.calls)
    .map((call: unknown[]) => inspect(call, { depth: 5 }))
    .join('\n')

/** A failed Drizzle query as it really looks: the parameters are part of the message. */
const failedQuery = () => {
  const error = new Error(
    `Failed query: insert into \`chat_message_images\` ... params: ${FIRST},${MESSAGE_UUID},0,800,600,${SECRET.toString()},image/jpeg`,
  ) as Error & { cause: { code: string } }
  error.cause = { code: 'ER_LOCK_WAIT_TIMEOUT' }
  return error
}

let spies: { mockRestore: () => void }[] = []

beforeEach(() => {
  for (const level of ['trace', 'debug', 'info', 'warn', 'error', 'fatal']) {
    logger[level].mockClear()
  }
})

afterEach(() => {
  for (const spy of spies) {
    spy.mockRestore()
  }
  spies = []
})

describe('acceptChatMessageImage', () => {
  it('takes a JPEG of a size that fits, and hands back its bytes and its size', () => {
    const accepted = acceptChatMessageImage(sent(800, 600))

    expect(accepted.success).toBe(true)
    expect(accepted.success && accepted.value.image.equals(JPEG)).toBe(true)
    expect(accepted.success && [accepted.value.width, accepted.value.height]).toEqual([800, 600])
  })

  // The avatar's check, with the chat picture's limit.
  it('refuses what the JPEG check refuses, for the same reason', () => {
    expect(verdict(sent(800, 600, ''))).toBe('EMPTY')
    expect(verdict(sent(800, 600, Buffer.from('not an image').toString('base64')))).toBe('NOT_JPEG')
    expect(verdict(sent(800, 600, Buffer.from([0xff, 0xd8, 0x00]).toString('base64')))).toBe(
      'NOT_JPEG',
    )
  })

  it('takes a picture of exactly the limit, and refuses one byte more as TOO_LARGE', () => {
    expect(verdict(sent(800, 600, jpegOf(CHAT_IMAGE_MAX_BYTES).toString('base64')))).toBe('taken')
    expect(verdict(sent(800, 600, jpegOf(CHAT_IMAGE_MAX_BYTES + 1).toString('base64')))).toBe(
      'TOO_LARGE',
    )
  })

  // The area of 800 x 600 whatever the format -- a long screenshot, a panorama -- with room to
  // round.
  it('takes the formats the wallet scales to, up to the area bound', () => {
    for (const [width, height] of [
      [800, 600],
      [393, 1220],
      [924, 520],
      [1000, 500],
    ]) {
      expect(verdict(sent(width, height))).toBe('taken')
    }
  })

  it('refuses as SIZE an area over the bound, a side out of bounds, and a side that is no whole number', () => {
    for (const [width, height] of [
      [1000, 501],
      [0, 600],
      [800, -1],
      [4097, 100],
      [100, 4097],
      [800.5, 600],
    ]) {
      expect(verdict(sent(width, height))).toBe('SIZE')
    }
  })

  it('names the reason and the numbers in its error, never the picture', () => {
    const refused = acceptChatMessageImage(sent(2000, 2000))

    expect(refused.success).toBe(false)
    expect(!refused.success && refused.error).toMatchObject({
      reason: 'SIZE',
      bytes: JPEG.length,
      width: 2000,
      height: 2000,
    })
    expect(!refused.success && refused.error.message).not.toContain(SECRET.toString())
    expect(!refused.success && refused.error.message).not.toContain(JPEG.toString('base64'))
  })
})

describe('chatMessageImageSizeFits', () => {
  it('is the rule on its own: each side 1 to 4096, the area at most 500,000', () => {
    expect(chatMessageImageSizeFits(1, 1)).toBe(true)
    expect(chatMessageImageSizeFits(4096, 122)).toBe(true)
    expect(chatMessageImageSizeFits(4096, 123)).toBe(false)
    expect(chatMessageImageSizeFits(Number.NaN, 600)).toBe(false)
  })
})

describe('storeChatMessageImages', () => {
  it('files each picture under the message, in its place, as a JPEG, and says so', async () => {
    const insert = spyOn(database, 'dbInsertChatMessageImage').mockResolvedValue({ success: true })
    const remove = spyOn(database, 'dbDeleteChatMessageImagesByMessageUuid')
    spies = [insert, remove]

    expect(await storeChatMessageImages(MESSAGE_UUID, pictures)).toBe(true)

    expect(insert.mock.calls).toEqual([
      [
        {
          imageUuid: FIRST,
          messageUuid: MESSAGE_UUID,
          position: 0,
          width: 800,
          height: 600,
          image: JPEG,
          mimeType: 'image/jpeg',
        },
      ],
      [
        {
          imageUuid: SECOND,
          messageUuid: MESSAGE_UUID,
          position: 1,
          width: 393,
          height: 1220,
          image: OTHER_JPEG,
          mimeType: 'image/jpeg',
        },
      ],
    ])
    expect(remove).not.toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith(
      `chat message pictures stored: message_uuid=${MESSAGE_UUID} count=2`,
    )
    expect(everythingLogged()).not.toContain(SECRET.toString())
  })

  // A message goes with all its pictures or not at all.
  it('takes back what it filed, and says no, where a picture is refused', async () => {
    const insert = spyOn(database, 'dbInsertChatMessageImage')
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({
        success: false,
        error: new database.DBDuplicateEntryError('chat_message_images', 'image_uuid', SECOND),
      })
    const remove = spyOn(database, 'dbDeleteChatMessageImagesByMessageUuid').mockResolvedValue(1)
    spies = [insert, remove]

    expect(await storeChatMessageImages(MESSAGE_UUID, pictures)).toBe(false)

    expect(remove.mock.calls).toEqual([[MESSAGE_UUID]])
    expect(logger.error).toHaveBeenCalledWith(
      `chat message picture not stored: message_uuid=${MESSAGE_UUID} image_uuid=${SECOND} (DBDuplicateEntryError)`,
    )
    expect(logger.info).not.toHaveBeenCalledWith(
      `chat message pictures stored: message_uuid=${MESSAGE_UUID} count=2`,
    )
  })

  // The message must not be filed without its picture: a failure comes back as false, not as a
  // throw -- and the query, which carries the picture, stays out of the log.
  it('does not throw when the database does, takes back what it filed, and logs the code', async () => {
    const insert = spyOn(database, 'dbInsertChatMessageImage').mockRejectedValue(failedQuery())
    const remove = spyOn(database, 'dbDeleteChatMessageImagesByMessageUuid').mockResolvedValue(0)
    spies = [insert, remove]

    expect(await storeChatMessageImages(MESSAGE_UUID, pictures)).toBe(false)

    expect(remove.mock.calls).toEqual([[MESSAGE_UUID]])
    expect(logger.error).toHaveBeenCalledWith(
      `chat message picture not stored: message_uuid=${MESSAGE_UUID} (ER_LOCK_WAIT_TIMEOUT)`,
    )
    expect(everythingLogged()).not.toContain(SECRET.toString())
    expect(everythingLogged()).not.toContain('Failed query')
  })
})

describe('removeChatMessageImages', () => {
  it('removes the pictures of a message and logs how many', async () => {
    const remove = spyOn(database, 'dbDeleteChatMessageImagesByMessageUuid').mockResolvedValue(1)
    spies = [remove]

    await removeChatMessageImages(MESSAGE_UUID)

    expect(remove.mock.calls).toEqual([[MESSAGE_UUID]])
    expect(logger.info).toHaveBeenCalledWith(
      `chat message pictures removed: message_uuid=${MESSAGE_UUID} count=1`,
    )
  })

  // It runs where something has failed already: its own failure is only logged.
  it('does not throw when the database does, and logs the code instead of the query', async () => {
    spies = [
      spyOn(database, 'dbDeleteChatMessageImagesByMessageUuid').mockRejectedValue(failedQuery()),
    ]

    await removeChatMessageImages(MESSAGE_UUID)

    expect(logger.error).toHaveBeenCalledWith(
      `chat message pictures not removed: message_uuid=${MESSAGE_UUID} (ER_LOCK_WAIT_TIMEOUT)`,
    )
    expect(everythingLogged()).not.toContain('Failed query')
  })
})
