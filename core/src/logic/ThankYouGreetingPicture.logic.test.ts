// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { inspect } from 'node:util'
import * as database from 'database'
import {
  CHAT_IMAGE_MAX_BYTES,
  CHAT_IMAGE_MAX_PIXELS,
  CHAT_IMAGE_MAX_SIDE,
  THANK_YOU_PICTURE_LARGE_MAX_BYTES,
  THANK_YOU_PICTURE_LARGE_MAX_PIXELS,
} from 'shared'
import { getLogger } from '../../../config-schema/test/testSetup.bun'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import { acceptChatMessageImage } from './ChatMessageImage.logic'
import {
  acceptLargeThankYouGreetingPicture,
  acceptSmallThankYouGreetingPicture,
  largeThankYouGreetingPictureSizeFits,
  removeLargeThankYouGreetingPicture,
  removeThankYouGreetingPictures,
} from './ThankYouGreetingPicture.logic'

// ⛔ spyOn, not mock.module: Bun cannot restore a module mock (see ChatMessage.logic.test.ts).
// The query behind the spy runs against a database in database/src/queries/
// thankYouGreetingPictures.test.ts.

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.logic.ThankYouGreetingPicture`)

const CODE = 'a1f9c2d41b7e19981fa0d001'

// A picture that decodes: 4 x 2 grey pixels, the smallest JPEG ImageMagick writes.
const PICTURE_WIDTH = 4
const PICTURE_HEIGHT = 2
const PICTURE = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/wAALCAACAAQBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AP//Z',
  'base64',
)
const END = Buffer.from([0xff, 0xd9])

// The same picture with something recognisable inside, in a comment segment and behind its end
// marker: the log must never show it, and neither may what is stored.
const SECRET = Buffer.from('a private photo of Oma Emma')
const JPEG = Buffer.concat([
  PICTURE.subarray(0, 2),
  Buffer.from([0xff, 0xfe, 0x00, SECRET.length + 2]),
  SECRET,
  PICTURE.subarray(2),
  SECRET,
  END,
])

const sent = (width = 1080, height = 750, data = JPEG.toString('base64')) => ({
  data,
  width,
  height,
})

/** The reason the large rendition was refused, or 'taken'. */
const verdict = async (picture: ReturnType<typeof sent>): Promise<string> => {
  const accepted = await acceptLargeThankYouGreetingPicture(picture)
  return accepted.success ? 'taken' : accepted.error.reason
}

/** The picture, filled up behind its end marker to exactly this many bytes. */
const jpegOf = (bytes: number): Buffer =>
  Buffer.concat([PICTURE, Buffer.alloc(bytes - PICTURE.length - END.length, 0x20), END])

/** Something of exactly this many bytes that is a JPEG at both ends and no picture between. */
const noPictureOf = (bytes: number): Buffer =>
  Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(bytes - 4, 0x20), END])

/** Everything this file's logger was handed, at any level, as one piece of text. */
const everythingLogged = () =>
  ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
    .flatMap((level) => logger[level].mock.calls)
    .map((call: unknown[]) => inspect(call, { depth: 5 }))
    .join('\n')

/** A failed Drizzle query as it really looks: the parameters are part of the message. */
const failedQuery = () => {
  const error = new Error(
    `Failed query: delete from \`thank_you_greeting_pictures\` ... params: ${CODE},${SECRET.toString()}`,
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

describe('acceptLargeThankYouGreetingPicture', () => {
  it('takes a JPEG and hands back the picture encoded again, at the size it really has', async () => {
    const accepted = await acceptLargeThankYouGreetingPicture(sent())

    expect(accepted.success).toBe(true)
    if (accepted.success) {
      const { image, width, height } = accepted.value
      // Not what the sender said (1080 x 750): what the decoder found.
      expect({ width, height }).toEqual({ width: PICTURE_WIDTH, height: PICTURE_HEIGHT })
      expect(image.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]))
      expect(image.subarray(-2)).toEqual(END)
      expect(image.equals(JPEG)).toBe(false)
    }
  })

  it('stores nothing of what was hidden in the picture', async () => {
    expect(JPEG.includes(SECRET)).toBe(true)

    const accepted = await acceptLargeThankYouGreetingPicture(sent())

    expect(accepted.success && accepted.value.image.includes(SECRET)).toBe(false)
  })

  it('encodes the same picture to the same bytes every time', async () => {
    const first = await acceptLargeThankYouGreetingPicture(sent())
    const second = await acceptLargeThankYouGreetingPicture(sent())

    expect(first.success && second.success && first.value.image.equals(second.value.image)).toBe(
      true,
    )
  })

  it('refuses nothing as EMPTY', async () => {
    expect(await verdict(sent(1080, 750, ''))).toBe('EMPTY')
    expect(await verdict(sent(1080, 750, '!!!'))).toBe('EMPTY')
  })

  // The limit is the largest picture taken, not the first one refused.
  it('takes a picture of exactly the limit and refuses one byte more as TOO_LARGE', async () => {
    const atTheLimit = jpegOf(THANK_YOU_PICTURE_LARGE_MAX_BYTES)
    const oneMore = jpegOf(THANK_YOU_PICTURE_LARGE_MAX_BYTES + 1)

    expect(await verdict(sent(1080, 750, atTheLimit.toString('base64')))).toBe('taken')
    expect(await verdict(sent(1080, 750, oneMore.toString('base64')))).toBe('TOO_LARGE')
  })

  it('refuses what is no JPEG at its start, or at its end, as NOT_JPEG', async () => {
    const noStart = Buffer.concat([Buffer.from([0x89, 0x50]), SECRET, END])
    const noEnd = Buffer.concat([Buffer.from([0xff, 0xd8]), SECRET, Buffer.from([0x00, 0x00])])

    expect(await verdict(sent(1080, 750, noStart.toString('base64')))).toBe('NOT_JPEG')
    expect(await verdict(sent(1080, 750, noEnd.toString('base64')))).toBe('NOT_JPEG')
    expect(
      await verdict(sent(1080, 750, Buffer.from('<svg onload=alert(1)>').toString('base64'))),
    ).toBe('NOT_JPEG')
  })

  // What the check of both ends alone used to take: anything between the two markers.
  it('refuses what is a JPEG at both ends and no picture between as NOT_JPEG', async () => {
    const between = Buffer.concat([Buffer.from([0xff, 0xd8]), SECRET, END])
    const halfAPicture = Buffer.concat([PICTURE.subarray(0, PICTURE.length / 2), END])

    expect(await verdict(sent(1080, 750, between.toString('base64')))).toBe('NOT_JPEG')
    expect(await verdict(sent(1080, 750, halfAPicture.toString('base64')))).toBe('NOT_JPEG')
    expect(await verdict(sent(1080, 750, noPictureOf(1024).toString('base64')))).toBe('NOT_JPEG')
  })

  it('refuses a width or a height out of bounds as SIZE', async () => {
    expect(await verdict(sent(0, 750))).toBe('SIZE')
    expect(await verdict(sent(1080, 0))).toBe('SIZE')
    expect(await verdict(sent(-1080, 750))).toBe('SIZE')
    expect(await verdict(sent(1080.5, 750))).toBe('SIZE')
    expect(await verdict(sent(CHAT_IMAGE_MAX_SIDE + 1, 100))).toBe('SIZE')
    expect(await verdict(sent(100, CHAT_IMAGE_MAX_SIDE + 1))).toBe('SIZE')
    expect(await verdict(sent(Number.NaN, 750))).toBe('SIZE')
  })

  // 1080 x 750 are 810,000 pixels; the bound leaves a little room and no more.
  it('takes the area the wallet draws and refuses the first one past the bound', async () => {
    expect(largeThankYouGreetingPictureSizeFits(1080, 750)).toBe(true)
    expect(largeThankYouGreetingPictureSizeFits(1000, 850)).toBe(true)
    expect(1000 * 850).toBe(THANK_YOU_PICTURE_LARGE_MAX_PIXELS)
    expect(largeThankYouGreetingPictureSizeFits(1001, 850)).toBe(false)
    expect(await verdict(sent(1200, 833))).toBe('SIZE')
    // Each side up to the chat picture's bound, as long as the area holds.
    expect(largeThankYouGreetingPictureSizeFits(CHAT_IMAGE_MAX_SIDE, 207)).toBe(true)
  })

  it('names the reason and the numbers in its error, never the picture', async () => {
    const refused = await acceptLargeThankYouGreetingPicture(sent(1200, 833))

    expect(refused.success).toBe(false)
    if (!refused.success) {
      expect(refused.error.message).toBe(
        `THANK_YOU_PICTURE_NOT_ACCEPTED: SIZE, ${JPEG.length} bytes, 1200 x 833`,
      )
      expect(inspect(refused.error, { depth: 5 })).not.toContain(SECRET.toString())
      expect(inspect(refused.error, { depth: 5 })).not.toContain(JPEG.toString('base64'))
    }
  })

  it('names the numbers of what came in for a picture that does not decode, never the picture', async () => {
    const noPicture = Buffer.concat([Buffer.from([0xff, 0xd8]), SECRET, END])
    const refused = await acceptLargeThankYouGreetingPicture(
      sent(1080, 750, noPicture.toString('base64')),
    )

    expect(refused.success).toBe(false)
    if (!refused.success) {
      expect(refused.error.message).toBe(
        `THANK_YOU_PICTURE_NOT_ACCEPTED: NOT_JPEG, ${noPicture.length} bytes, 1080 x 750`,
      )
      expect(inspect(refused.error, { depth: 5 })).not.toContain(SECRET.toString())
    }
  })
})

describe('acceptSmallThankYouGreetingPicture', () => {
  it('takes a chat picture and hands back the picture encoded again, at the size it really has', async () => {
    const accepted = await acceptSmallThankYouGreetingPicture(sent(800, 600))

    expect(accepted.success).toBe(true)
    if (accepted.success) {
      const { image, width, height } = accepted.value
      expect({ width, height }).toEqual({ width: PICTURE_WIDTH, height: PICTURE_HEIGHT })
      expect(image.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]))
      expect(image.includes(SECRET)).toBe(false)
    }
  })

  it("refuses what a chat picture is refused for, in a chat picture's words", async () => {
    const tooLarge = jpegOf(CHAT_IMAGE_MAX_BYTES + 1).toString('base64')
    const cases: [ReturnType<typeof sent>, string][] = [
      [sent(800, 600, ''), 'EMPTY'],
      [sent(800, 600, tooLarge), 'TOO_LARGE'],
      [sent(800, 600, Buffer.from('<svg onload=alert(1)>').toString('base64')), 'NOT_JPEG'],
      [sent(1080, 750), 'SIZE'],
    ]
    for (const [picture, reason] of cases) {
      const refused = await acceptSmallThankYouGreetingPicture(picture)
      expect(refused.success).toBe(false)
      expect(!refused.success && refused.error.reason).toBe(reason)
      expect(!refused.success && refused.error.message).toStartWith('CHAT_IMAGE_NOT_ACCEPTED: ')
    }
  })

  it('refuses what is a JPEG at both ends and no picture between as NOT_JPEG', async () => {
    const noPicture = Buffer.concat([Buffer.from([0xff, 0xd8]), SECRET, END])
    const refused = await acceptSmallThankYouGreetingPicture(
      sent(800, 600, noPicture.toString('base64')),
    )

    expect(refused.success).toBe(false)
    if (!refused.success) {
      expect(refused.error.message).toBe(
        `CHAT_IMAGE_NOT_ACCEPTED: NOT_JPEG, ${noPicture.length} bytes, 800 x 600`,
      )
    }
  })
})

// The two renditions have two sets of bounds, and each is checked by its own: what the small
// one may be is the chat picture's check, used as it is.
describe('the two renditions, each by its own bounds', () => {
  it('the large bounds are wider than the small ones in bytes and in area', () => {
    expect(THANK_YOU_PICTURE_LARGE_MAX_BYTES).toBeGreaterThan(CHAT_IMAGE_MAX_BYTES)
    expect(THANK_YOU_PICTURE_LARGE_MAX_PIXELS).toBeGreaterThan(CHAT_IMAGE_MAX_PIXELS)
  })

  it('a picture of the large size is no small rendition, and is one as the large', async () => {
    const picture = sent(1080, 750, jpegOf(CHAT_IMAGE_MAX_BYTES + 1).toString('base64'))

    const asSmall = acceptChatMessageImage(picture)
    expect(asSmall.success).toBe(false)
    expect(!asSmall.success && asSmall.error.reason).toBe('TOO_LARGE')
    expect((await acceptLargeThankYouGreetingPicture(picture)).success).toBe(true)
  })

  it('a picture of the small size with the large area is refused as the small one for its SIZE', () => {
    const asSmall = acceptChatMessageImage(sent(1080, 750))
    expect(!asSmall.success && asSmall.error.reason).toBe('SIZE')
  })
})

describe('removeThankYouGreetingPictures', () => {
  it('takes both renditions of a link out, and says so in the log by the code', async () => {
    const remove = spyOn(database, 'dbDeleteThankYouGreetingPicturesByLinkCode').mockResolvedValue(
      2,
    )
    spies.push(remove)

    expect(await removeThankYouGreetingPictures(CODE)).toBe(true)

    expect(remove).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith(CODE, undefined)
    expect(everythingLogged()).toContain(`code=${CODE} rendition=all count=2`)
  })

  it('takes the large one alone out after a thank-you was accepted', async () => {
    const remove = spyOn(database, 'dbDeleteThankYouGreetingPicturesByLinkCode').mockResolvedValue(
      1,
    )
    spies.push(remove)

    expect(await removeLargeThankYouGreetingPicture(CODE)).toBe(true)

    expect(remove).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith(CODE, 'large')
    expect(everythingLogged()).toContain(`code=${CODE} rendition=large count=1`)
  })

  // Most links have no picture: that is no news, and no line in the log.
  it('says nothing where there was nothing to take out', async () => {
    spies.push(spyOn(database, 'dbDeleteThankYouGreetingPicturesByLinkCode').mockResolvedValue(0))

    expect(await removeLargeThankYouGreetingPicture(CODE)).toBe(true)

    expect(everythingLogged()).toBe('')
  })

  // It runs after a booking, after a deletion, after a link that could not be saved: none of
  // them may fail over it.
  it('never throws, and logs the driver code of a failed query -- not its parameters', async () => {
    spies.push(
      spyOn(database, 'dbDeleteThankYouGreetingPicturesByLinkCode').mockRejectedValue(
        failedQuery(),
      ),
    )

    expect(await removeThankYouGreetingPictures(CODE)).toBe(false)
    expect(await removeLargeThankYouGreetingPicture(CODE)).toBe(false)

    const logged = everythingLogged()
    expect(logged).toContain('ER_LOCK_WAIT_TIMEOUT')
    expect(logged).toContain(`code=${CODE}`)
    expect(logged).not.toContain(SECRET.toString())
    expect(logged).not.toContain('Failed query')
  })
})
