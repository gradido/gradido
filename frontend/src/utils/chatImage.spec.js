// AI-GENERATED — not an architecture reference
import { describe, it, expect, afterEach, vi } from 'vitest'
import { ApolloError } from '@apollo/client/core'
import { GraphQLError } from 'graphql'
import { AVATAR_QUALITY_STEPS, AVATAR_SOURCE_MAX_BYTES, encodeUnderTarget } from './avatarImage'
import {
  CHAT_IMAGE_AREA,
  CHAT_IMAGE_MAX_SIDE,
  CHAT_IMAGE_ROUNDS,
  CHAT_IMAGE_TARGET_BYTES,
  ChatImageError,
  chatImageRefusal,
  chatImageSize,
  drawChatImage,
  encodeChatImage,
  openChatImage,
  readChatImageFile,
} from './chatImage'
import { CHAT_IMAGE_UNEDITED } from './chatImageEdit'

/**
 * jsdom decodes and paints nothing, so the procedure is measured with stand-ins: a decoded picture
 * of a given size, a canvas that only knows its size, and an encoder that answers with the bytes a
 * test decides. What is measured is the procedure -- which sizes are drawn, in which order, and
 * when it stops -- not what a browser's JPEG encoder makes of a photo (the probe measures that).
 */
const picture = (naturalWidth, naturalHeight) => ({ naturalWidth, naturalHeight })
/** A picture as openChatImage hands it on: the decoded one and its size. */
const opened = (width, height) => ({ image: picture(width, height), width, height })
const file = (name = 'photo.jpg', size = 3 * 1024 * 1024) => ({ name, size })

/** A draw that records the sizes asked for and hands back a canvas of that size. */
const recordingDraw = () => {
  const drawn = []
  const draw = vi.fn((source, edit, width, height) => {
    drawn.push([width, height])
    return { width, height }
  })
  return { draw, drawn }
}

/** An encoder that fits where `fits(canvas)` says so, and is 40 KB otherwise. */
const encoderFitting = (fits) =>
  vi.fn((canvas) => ({
    base64: `JPEG${canvas.width}x${canvas.height}`,
    bytes: fits(canvas) ? 20000 : 40 * 1024,
    quality: 0.45,
  }))

const encodeWith = (source, { edit = CHAT_IMAGE_UNEDITED, fits = () => true } = {}) => {
  const { draw, drawn } = recordingDraw()
  const encode = encoderFitting(fits)
  return {
    result: encodeChatImage(source, edit, { draw, encode }),
    draw,
    drawn,
    encode,
  }
}

describe('chatImageSize', () => {
  // E-041: the measure is the area of 800 x 600, the proportions stay.
  it('fits a landscape photo, a portrait and a square into the same area', () => {
    expect(chatImageSize(4000, 3000)).toEqual({ width: 800, height: 600 })
    expect(chatImageSize(3000, 4000)).toEqual({ width: 600, height: 800 })
    expect(chatImageSize(3000, 3000)).toEqual({ width: 693, height: 693 })
  })

  // The two sizes E-041 names for the motifs of the test bench.
  it('keeps a wide landscape wide and a long screenshot tall, not squeezed into a strip', () => {
    expect(chatImageSize(5120, 2880)).toEqual({ width: 924, height: 520 })
    expect(chatImageSize(1072, 3326)).toEqual({ width: 393, height: 1220 })
  })

  it('never makes a small picture larger', () => {
    expect(chatImageSize(640, 480)).toEqual({ width: 640, height: 480 })
    expect(chatImageSize(1, 1)).toEqual({ width: 1, height: 1 })
    // Exactly the area is left as it is, too.
    expect(chatImageSize(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('draws a smaller area where a later round asks for one', () => {
    expect(chatImageSize(4000, 3000, CHAT_IMAGE_AREA * 0.64)).toEqual({ width: 640, height: 480 })
  })

  // The server takes no side past CHAT_IMAGE_MAX_SIDE; only a panorama beyond about 35 : 1 gets
  // there at this area, and it is drawn smaller rather than refused.
  it('keeps each side within the server’s bound, the proportions still', () => {
    expect(chatImageSize(40000, 500)).toEqual({ width: CHAT_IMAGE_MAX_SIDE, height: 51 })
    expect(chatImageSize(500, 40000)).toEqual({ width: 51, height: CHAT_IMAGE_MAX_SIDE })
    // Gegenprobe: 30 : 1 stays under the bound and keeps the full area.
    const { width, height } = chatImageSize(30000, 1000)
    expect(width).toBeLessThan(CHAT_IMAGE_MAX_SIDE)
    expect(width * height).toBeGreaterThan(CHAT_IMAGE_AREA * 0.99)
  })

  it('answers in whole pixels', () => {
    for (const [w, h] of [
      [4032, 3024],
      [1179, 2556],
      [5120, 2880],
      [333, 777777],
    ]) {
      const size = chatImageSize(w, h)
      expect(Number.isInteger(size.width)).toBe(true)
      expect(Number.isInteger(size.height)).toBe(true)
    }
  })
})

describe('encodeChatImage', () => {
  it('fits the picture the first time where it comes under the target', async () => {
    const { result, draw, encode, drawn } = encodeWith(opened(4000, 3000))

    await expect(result).resolves.toEqual({
      data: 'JPEG800x600',
      width: 800,
      height: 600,
      bytes: 20000,
    })
    expect(drawn).toEqual([[800, 600]])
    expect(draw.mock.calls[0][0]).toEqual(opened(4000, 3000))
    expect(draw.mock.calls[0][1]).toBe(CHAT_IMAGE_UNEDITED)
    // The avatar's encoder, asked with the chat's target and the avatar's steps.
    expect(encode).toHaveBeenCalledWith(
      { width: 800, height: 600 },
      CHAT_IMAGE_TARGET_BYTES,
      AVATAR_QUALITY_STEPS,
    )
  })

  it('aims at 32 KB (E-046)', () => {
    expect(CHAT_IMAGE_TARGET_BYTES).toBe(32 * 1024)
    expect(CHAT_IMAGE_AREA).toBe(800 * 600)
  })

  // The target itself is taken; a byte over it is a size smaller.
  it('takes a picture of exactly 32 KB, and not one a byte larger', async () => {
    const withBytes = (bytes) =>
      encodeChatImage(opened(4000, 3000), CHAT_IMAGE_UNEDITED, {
        draw: (source, edit, width, height) => ({ width, height }),
        encode: (canvas) => ({
          base64: 'JPEG',
          bytes: canvas.width === 800 ? bytes : 1000,
          quality: 0.45,
        }),
      })

    await expect(withBytes(CHAT_IMAGE_TARGET_BYTES)).resolves.toMatchObject({ width: 800 })
    await expect(withBytes(CHAT_IMAGE_TARGET_BYTES + 1)).resolves.toMatchObject({ width: 716 })
  })

  /**
   * The quality goes down first: the real encoder, over a canvas whose JPEG is smaller the
   * lower the quality -- here it fits at 55 %, and the size stays.
   */
  it('lowers the quality before it lowers the size', async () => {
    const asked = []
    const canvas = {
      width: 800,
      height: 600,
      toDataURL: (type, quality) => {
        asked.push([type, quality])
        const bytes = quality > 0.6 ? 40 * 1024 : 30 * 1024
        return `data:image/jpeg;base64,${'A'.repeat(Math.round(bytes / 0.75))}`
      },
    }
    const draw = vi.fn(() => canvas)
    const result = await encodeChatImage(opened(4000, 3000), CHAT_IMAGE_UNEDITED, {
      draw,
      encode: encodeUnderTarget,
    })

    expect(asked).toEqual([
      ['image/jpeg', 0.85],
      ['image/jpeg', 0.75],
      ['image/jpeg', 0.65],
      ['image/jpeg', 0.55],
    ])
    expect(draw).toHaveBeenCalledTimes(1)
    expect(result.width).toBe(800)
    expect(result.bytes).toBeLessThanOrEqual(CHAT_IMAGE_TARGET_BYTES)
  })

  // E-041: where even 45 % does not fit, a size smaller -- the area times 0.8 -- not over the limit.
  it('lowers the size where even the lowest quality does not fit', async () => {
    const { result, drawn } = encodeWith(opened(4000, 3000), {
      fits: (canvas) => canvas.width * canvas.height <= CHAT_IMAGE_AREA * 0.64,
    })

    await expect(result).resolves.toMatchObject({ width: 640, height: 480 })
    expect(drawn).toEqual([
      [800, 600],
      [716, 537],
      [640, 480],
    ])
  })

  it('refuses a picture that does not fit after five sizes', async () => {
    const { result, drawn, encode } = encodeWith(opened(4000, 3000), { fits: () => false })

    await expect(result).rejects.toMatchObject({
      name: 'ChatImageError',
      problem: 'NOT_SMALL_ENOUGH',
    })
    expect(CHAT_IMAGE_ROUNDS).toBe(5)
    expect(drawn).toHaveLength(5)
    expect(encode).toHaveBeenCalledTimes(5)
    // …the last of them about 512 x 384: the area times 0.8 four times over.
    expect(drawn[4]).toEqual([512, 384])
  })

  // Gegenprobe to the one above: a picture that fits in the fifth size is sent, not refused.
  it('takes a picture that fits in the fifth size', async () => {
    const { result, drawn } = encodeWith(opened(4000, 3000), {
      fits: (canvas) => canvas.width <= 512,
    })

    await expect(result).resolves.toMatchObject({ width: 512, height: 384 })
    expect(drawn).toHaveLength(5)
  })

  it('keeps a portrait, a landscape and a long screenshot the way they are', async () => {
    const sizes = []
    for (const source of [opened(3024, 4032), opened(4032, 3024), opened(1072, 3326)]) {
      const { result } = encodeWith(source)
      const { width, height } = await result
      sizes.push([width, height])
    }

    expect(sizes).toEqual([
      [600, 800],
      [800, 600],
      [393, 1220],
    ])
  })

  it('does not make a small picture larger', async () => {
    const { result, drawn } = encodeWith(opened(300, 200))

    await expect(result).resolves.toMatchObject({ width: 300, height: 200 })
    expect(drawn).toEqual([[300, 200]])
  })

  /**
   * What the member cut is what is made small: the cutout's size drives the sizes, and the draw is
   * told the edit (E-047) -- a square cut of a landscape photo becomes a square, a quarter turn a
   * portrait.
   */
  it('makes small the part the member kept, as they turned it', async () => {
    const square = { ...CHAT_IMAGE_UNEDITED, shape: 'square' }
    const cut = encodeWith(opened(4000, 3000), { edit: square })
    await expect(cut.result).resolves.toMatchObject({ width: 693, height: 693 })
    expect(cut.draw.mock.calls[0][1]).toBe(square)

    const turned = encodeWith(opened(4000, 3000), { edit: { ...CHAT_IMAGE_UNEDITED, turn: 90 } })
    await expect(turned.result).resolves.toMatchObject({ width: 600, height: 800 })

    // A small cutout of a large photo is not made larger either.
    const small = encodeWith(opened(4000, 3000), { edit: { ...CHAT_IMAGE_UNEDITED, zoom: 4 } })
    await expect(small.result).resolves.toMatchObject({ width: 800, height: 600 })
    const tiny = encodeWith(opened(1600, 1200), { edit: { ...CHAT_IMAGE_UNEDITED, zoom: 4 } })
    await expect(tiny.result).resolves.toMatchObject({ width: 400, height: 300 })
  })

  // Called without an edit, the picture goes as it was chosen.
  it('sends the picture as chosen where nothing was edited', async () => {
    const draw = vi.fn((source, edit, width, height) => ({ width, height }))
    await encodeChatImage(opened(4000, 3000), undefined, {
      draw,
      encode: encoderFitting(() => true),
    })

    expect(draw.mock.calls[0][1]).toEqual(CHAT_IMAGE_UNEDITED)
  })
})

describe('openChatImage', () => {
  const openWith = (source, { name, size } = {}) => {
    const read = vi.fn(async () => source)
    return { result: openChatImage(file(name, size), { read }), read }
  }

  it('keeps the picture whole, with its size as seen', async () => {
    const decoded = picture(4032, 3024)
    const { result } = openWith(decoded)

    await expect(result).resolves.toEqual({ image: decoded, width: 4032, height: 3024 })
  })

  /**
   * ⛔ Before anything is read: decoding costs several times the file's size in memory. 20 MB is
   * still taken (a camera original), a byte more is not.
   */
  it('refuses a file over 20 MB before reading it, and takes one of 20 MB', async () => {
    const tooLarge = openWith(picture(4000, 3000), { size: AVATAR_SOURCE_MAX_BYTES + 1 })
    await expect(tooLarge.result).rejects.toMatchObject({ problem: 'SOURCE_TOO_LARGE' })
    expect(tooLarge.read).not.toHaveBeenCalled()

    const atTheLimit = openWith(picture(4000, 3000), { size: AVATAR_SOURCE_MAX_BYTES })
    await expect(atTheLimit.result).resolves.toMatchObject({ width: 4000 })
    expect(AVATAR_SOURCE_MAX_BYTES).toBe(20 * 1024 * 1024)
  })

  /**
   * A browser that cannot open the file: an iPhone's HEIC is named as such (iOS converts on pick,
   * a desktop browser cannot decode it), anything else is "cannot open".
   */
  it('names an iPhone’s HEIC where the browser cannot open it, and any other file otherwise', async () => {
    const problem = async (name) => {
      const read = vi.fn(async () => {
        throw new Error('decode')
      })
      try {
        await openChatImage(file(name), { read })
        return null
      } catch (error) {
        expect(error).toBeInstanceOf(ChatImageError)
        return error.problem
      }
    }

    expect(await problem('IMG_4711.HEIC')).toBe('HEIC')
    expect(await problem('Urlaub.heif')).toBe('HEIC')
    expect(await problem('scan.bmp')).toBe('FORMAT')
    expect(await problem('notes.txt')).toBe('FORMAT')
  })

  it('takes a picture without a size for one it cannot open', async () => {
    await expect(openWith(picture(0, 0)).result).rejects.toMatchObject({ problem: 'FORMAT' })
  })
})

describe('readChatImageFile', () => {
  const OriginalImage = globalThis.Image
  afterEach(() => {
    globalThis.Image = OriginalImage
    vi.unstubAllGlobals()
  })

  /** An Image that decodes whatever it is given, or nothing, as a test says. */
  const imageThat = (decodes) =>
    class {
      get src() {
        return this.given
      }

      set src(value) {
        this.given = value
        setTimeout(() => (decodes ? this.onload() : this.onerror()))
      }
    }

  const addresses = () => {
    const created = vi.fn(() => 'blob:picture-1')
    const revoked = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL: created, revokeObjectURL: revoked })
    return { created, revoked }
  }

  // Through an object URL, let go as soon as the picture has come -- not a data URL, which would
  // keep the whole file a second time, as text, for as long as the picture is edited.
  it('reads the file into an Image through an object URL, and lets the URL go', async () => {
    globalThis.Image = imageThat(true)
    const { created, revoked } = addresses()
    const chosen = new File(['JPEG'], 'photo.jpg', { type: 'image/jpeg' })

    const image = await readChatImageFile(chosen)

    expect(created).toHaveBeenCalledWith(chosen)
    expect(image.given).toBe('blob:picture-1')
    expect(revoked).toHaveBeenCalledWith('blob:picture-1')
  })

  it('rejects where the browser cannot decode it, and lets the URL go all the same', async () => {
    globalThis.Image = imageThat(false)
    const { revoked } = addresses()
    const chosen = new File(['?'], 'IMG_0001.HEIC', { type: 'image/heic' })

    await expect(readChatImageFile(chosen)).rejects.toThrow()
    expect(revoked).toHaveBeenCalledWith('blob:picture-1')
  })

  // …and that rejection is the HEIC sentence, through the default reader.
  it('ends in the HEIC sentence for an iPhone photo the browser cannot open', async () => {
    globalThis.Image = imageThat(false)
    addresses()
    const chosen = new File(['?'], 'IMG_0001.HEIC', { type: 'image/heic' })

    await expect(openChatImage(chosen)).rejects.toMatchObject({ problem: 'HEIC' })
  })
})

describe('drawChatImage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * On white, smoothed at the best quality, straight to the size asked for -- one step from the
   * source, the cutout filling the canvas. jsdom has no 2D context, so a recording one stands in.
   */
  it('draws the source straight to the size, on white, smoothed at the best quality', () => {
    const steps = []
    const context = new Proxy(
      {},
      {
        get: (target, name) =>
          name in target ? target[name] : (...args) => steps.push([name, ...args]),
        set: (target, name, value) => {
          target[name] = value
          steps.push([`${String(name)}=`, value])
          return true
        },
      },
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    const source = opened(4000, 3000)

    const canvas = drawChatImage(source, CHAT_IMAGE_UNEDITED, 800, 600)

    expect([canvas.width, canvas.height]).toEqual([800, 600])
    expect(steps).toEqual([
      ['fillStyle=', '#ffffff'],
      ['fillRect', 0, 0, 800, 600],
      ['imageSmoothingEnabled=', true],
      ['imageSmoothingQuality=', 'high'],
      ['save'],
      ['translate', 400, 300],
      ['scale', 0.2, 0.2],
      ['translate', 0, 0],
      ['rotate', 0],
      ['drawImage', source.image, -2000, -1500, 4000, 3000],
      ['restore'],
    ])
  })
})

describe('chatImageRefusal', () => {
  /**
   * Read off the error the way vue-apollo throws it: an ApolloError whose message carries the
   * server's -- measured with the installed @apollo/client, not assumed.
   */
  const refused = (message) =>
    new ApolloError({ graphQLErrors: [new GraphQLError(message, { path: ['sendChatMessage'] })] })

  it('knows a picture the server did not take, whatever the reason', () => {
    for (const reason of ['EMPTY', 'TOO_LARGE', 'NOT_JPEG', 'SIZE']) {
      expect(chatImageRefusal(refused(`CHAT_IMAGE_NOT_ACCEPTED: ${reason}`))).toBe(
        'IMAGE_NOT_ACCEPTED',
      )
    }
  })

  it('knows a text too long to go with the picture to another community', () => {
    expect(chatImageRefusal(refused('CHAT_MESSAGE_NOT_SENT: TOO_LARGE_ACROSS_BORDER'))).toBe(
      'TOO_LARGE_ACROSS_BORDER',
    )
  })

  it('leaves every other failure to the bar’s "not sent"', () => {
    expect(chatImageRefusal(refused('CHAT_MESSAGE_NOT_SENT: NOT_STORED'))).toBeNull()
    expect(chatImageRefusal(refused('CHAT_MESSAGE_NOT_SENT: NO_WAY_TO_DELIVER'))).toBeNull()
    expect(chatImageRefusal(new Error('Network error'))).toBeNull()
    expect(chatImageRefusal(undefined)).toBeNull()
  })
})
