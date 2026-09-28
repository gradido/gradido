// AI-GENERATED — not an architecture reference
import { describe, it, expect, afterEach, vi } from 'vitest'
import { AVATAR_QUALITY_STEPS, AVATAR_SOURCE_MAX_BYTES, encodeUnderTarget } from './avatarImage'
import {
  CHAT_IMAGE_AREA,
  CHAT_IMAGE_MAX_SIDE,
  CHAT_IMAGE_ROUNDS,
  CHAT_IMAGE_TARGET_BYTES,
  ChatImageError,
  chatImageSize,
  drawChatImage,
  encodeChatImage,
  readChatImageFile,
} from './chatImage'

/**
 * jsdom decodes and paints nothing, so the procedure is measured with stand-ins: a decoded picture
 * of a given size, a canvas that only knows its size, and an encoder that answers with the bytes a
 * test decides. What is measured is the procedure -- which sizes are drawn, in which order, and
 * when it stops -- not what a browser's JPEG encoder makes of a photo (the probe measures that).
 */
const picture = (naturalWidth, naturalHeight) => ({ naturalWidth, naturalHeight })
const file = (name = 'photo.jpg', size = 3 * 1024 * 1024) => ({ name, size })

/** A draw that records the sizes asked for and hands back a canvas of that size. */
const recordingDraw = () => {
  const drawn = []
  const draw = vi.fn((image, width, height) => {
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

const encodeWith = (source, { name, size, fits = () => true } = {}) => {
  const { draw, drawn } = recordingDraw()
  const encode = encoderFitting(fits)
  const read = vi.fn(async () => source)
  return {
    result: encodeChatImage(file(name, size), { read, draw, encode }),
    draw,
    drawn,
    encode,
    read,
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
    const { result, draw, encode, drawn } = encodeWith(picture(4000, 3000))

    await expect(result).resolves.toEqual({
      data: 'JPEG800x600',
      width: 800,
      height: 600,
      bytes: 20000,
    })
    expect(drawn).toEqual([[800, 600]])
    expect(draw.mock.calls[0][0]).toEqual(picture(4000, 3000))
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
      encodeChatImage(file(), {
        read: async () => picture(4000, 3000),
        draw: (image, width, height) => ({ width, height }),
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
    const result = await encodeChatImage(file(), {
      read: async () => picture(4000, 3000),
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
    const { result, drawn } = encodeWith(picture(4000, 3000), {
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
    const { result, drawn, encode } = encodeWith(picture(4000, 3000), { fits: () => false })

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
    const { result, drawn } = encodeWith(picture(4000, 3000), {
      fits: (canvas) => canvas.width <= 512,
    })

    await expect(result).resolves.toMatchObject({ width: 512, height: 384 })
    expect(drawn).toHaveLength(5)
  })

  it('keeps a portrait, a landscape and a long screenshot the way they are', async () => {
    const sizes = []
    for (const source of [picture(3024, 4032), picture(4032, 3024), picture(1072, 3326)]) {
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
    const { result, drawn } = encodeWith(picture(300, 200))

    await expect(result).resolves.toMatchObject({ width: 300, height: 200 })
    expect(drawn).toEqual([[300, 200]])
  })

  /**
   * ⛔ Before anything is read: reading pulls the whole file into memory. 20 MB is still taken
   * (a camera original), a byte more is not.
   */
  it('refuses a file over 20 MB before reading it, and takes one of 20 MB', async () => {
    const tooLarge = encodeWith(picture(4000, 3000), { size: AVATAR_SOURCE_MAX_BYTES + 1 })
    await expect(tooLarge.result).rejects.toMatchObject({ problem: 'SOURCE_TOO_LARGE' })
    expect(tooLarge.read).not.toHaveBeenCalled()

    const atTheLimit = encodeWith(picture(4000, 3000), { size: AVATAR_SOURCE_MAX_BYTES })
    await expect(atTheLimit.result).resolves.toMatchObject({ width: 800 })
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
        await encodeChatImage(file(name), { read, draw: vi.fn(), encode: vi.fn() })
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
    const { result, draw } = encodeWith(picture(0, 0))

    await expect(result).rejects.toMatchObject({ problem: 'FORMAT' })
    expect(draw).not.toHaveBeenCalled()
  })
})

describe('readChatImageFile', () => {
  const OriginalImage = globalThis.Image
  afterEach(() => {
    globalThis.Image = OriginalImage
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

  // The way the avatar's cropper reads: the file as a data URI, into an Image.
  it('reads the file into an Image, as the cropper does', async () => {
    globalThis.Image = imageThat(true)
    const chosen = new File(['JPEG'], 'photo.jpg', { type: 'image/jpeg' })

    const image = await readChatImageFile(chosen)

    expect(image.given).toBe(`data:image/jpeg;base64,${btoa('JPEG')}`)
  })

  it('rejects where the browser cannot decode it', async () => {
    globalThis.Image = imageThat(false)
    const chosen = new File(['?'], 'IMG_0001.HEIC', { type: 'image/heic' })

    await expect(readChatImageFile(chosen)).rejects.toThrow()
  })

  // …and that rejection is the HEIC sentence, through the default reader.
  it('ends in the HEIC sentence for an iPhone photo the browser cannot open', async () => {
    globalThis.Image = imageThat(false)
    const chosen = new File(['?'], 'IMG_0001.HEIC', { type: 'image/heic' })

    await expect(encodeChatImage(chosen)).rejects.toMatchObject({ problem: 'HEIC' })
  })
})

describe('drawChatImage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * On white, smoothed at the best quality, straight to the size asked for -- one step from the
   * source. jsdom has no 2D context, so a recording one stands in for it.
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
    const source = picture(4000, 3000)

    const canvas = drawChatImage(source, 800, 600)

    expect([canvas.width, canvas.height]).toEqual([800, 600])
    expect(steps).toEqual([
      ['fillStyle=', '#ffffff'],
      ['fillRect', 0, 0, 800, 600],
      ['imageSmoothingEnabled=', true],
      ['imageSmoothingQuality=', 'high'],
      ['drawImage', source, 0, 0, 800, 600],
    ])
  })
})
