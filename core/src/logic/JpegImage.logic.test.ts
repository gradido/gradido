// AI-GENERATED — not an architecture reference
import { describe, expect, it, spyOn } from 'bun:test'
import { deflateSync } from 'node:zlib'
import * as sharedNative from 'shared-native'
import { probeImage, reencodeImage } from 'shared-native'
import { decodeJpegImage, JPEG_REENCODE_QUALITY_STEPS, reencodeJpegImage } from './JpegImage.logic'

// The smallest thing that passes: the start marker, a few bytes, the end marker.
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9])
const base64 = (bytes: number[] | Buffer): string => Buffer.from(bytes).toString('base64')

/** The reason a picture was refused, or 'taken'. */
const verdict = (data: string, maxBytes = 100): string => {
  const decoded = decodeJpegImage(data, maxBytes)
  return decoded.success ? 'taken' : decoded.error.reason
}

describe('decodeJpegImage', () => {
  it('takes a JPEG and hands back its bytes', () => {
    const decoded = decodeJpegImage(JPEG.toString('base64'), 100)

    expect(decoded.success).toBe(true)
    expect(decoded.success && decoded.value.equals(JPEG)).toBe(true)
  })

  it('refuses nothing as EMPTY -- and what base64 cannot read comes to nothing', () => {
    expect(verdict('')).toBe('EMPTY')
    expect(verdict('!!!')).toBe('EMPTY')
  })

  it('refuses more than the limit as TOO_LARGE, and says how much it was', () => {
    const tooLarge = Buffer.concat([JPEG, Buffer.alloc(100, 0x20), JPEG])
    const decoded = decodeJpegImage(tooLarge.toString('base64'), 100)

    expect(decoded.success).toBe(false)
    expect(!decoded.success && decoded.error).toMatchObject({
      reason: 'TOO_LARGE',
      bytes: tooLarge.length,
      maxBytes: 100,
    })
  })

  // The limit is the largest picture taken, not the first one refused.
  it('takes a picture of exactly the limit, and refuses one byte more', () => {
    expect(verdict(JPEG.toString('base64'), JPEG.length)).toBe('taken')
    expect(verdict(JPEG.toString('base64'), JPEG.length - 1)).toBe('TOO_LARGE')
  })

  it('refuses a wrong start as NOT_JPEG', () => {
    expect(verdict(base64([0x89, 0x50, 0x4e, 0x47, 0xff, 0xd9]))).toBe('NOT_JPEG')
    expect(verdict(base64([0xff, 0xd9, 0x00, 0x00, 0xff, 0xd9]))).toBe('NOT_JPEG')
  })

  // The payload coderabbit found for the avatar: ff d8 00 passes a check on the start alone.
  it('refuses a wrong end as NOT_JPEG, however right the start', () => {
    expect(verdict(base64([0xff, 0xd8, 0x00]))).toBe('NOT_JPEG')
    expect(verdict(base64([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd8]))).toBe('NOT_JPEG')
  })

  it('refuses text as NOT_JPEG', () => {
    expect(verdict(Buffer.from('not an image').toString('base64'))).toBe('NOT_JPEG')
  })
})

// A picture that decodes: 4 x 2 grey pixels, the smallest JPEG ImageMagick writes.
const PICTURE = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/wAALCAACAAQBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AP//Z',
  'base64',
)
const ROOMY = { maxBytes: 64 * 1024, maxSide: 4096, maxPixels: 500_000 }

/** An RGB PNG of seeded noise: the picture a JPEG encoder needs the most bytes for. */
const noisePng = (width: number, height: number): Buffer => {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    return c >>> 0
  })
  const chunk = (type: string, data: Buffer): Buffer => {
    const typeAndData = Buffer.concat([Buffer.from(type), data])
    let crc = 0xffffffff
    for (const byte of typeAndData) {
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
    }
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const checksum = Buffer.alloc(4)
    checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0)
    return Buffer.concat([length, typeAndData, checksum])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // bits per channel
  header[9] = 2 // RGB
  const rowBytes = 1 + width * 3
  const rows = Buffer.alloc(height * rowBytes)
  let seed = 1
  for (let i = 0; i < rows.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    // the first byte of a row is its filter: none
    rows[i] = i % rowBytes === 0 ? 0 : seed >>> 24
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 0 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** A JPEG of noise at this quality, as a member's browser might send one. */
const noiseJpeg = async (width: number, height: number, jpegQuality = 100): Promise<Buffer> => {
  const encoded = await reencodeImage(noisePng(width, height), {
    maxOutputBytes: 1024 * 1024,
    inputFormats: ['png'],
    jpegQuality,
  })
  if (!encoded.success) {
    throw new Error(encoded.error.name)
  }
  return encoded.value.data
}

/** How many bytes the picture takes at each of the qualities, the highest first. */
const bytesPerQuality = async (image: Buffer): Promise<number[]> => {
  const sizes: number[] = []
  for (const jpegQuality of JPEG_REENCODE_QUALITY_STEPS) {
    const encoded = await reencodeImage(image, { maxOutputBytes: 1024 * 1024, jpegQuality })
    sizes.push(encoded.success ? encoded.value.data.length : Number.NaN)
  }
  return sizes
}

describe('reencodeJpegImage', () => {
  it('hands back a JPEG this server wrote, with the size the picture really has', async () => {
    const reencoded = await reencodeJpegImage(PICTURE, ROOMY)

    expect(reencoded.success).toBe(true)
    if (reencoded.success) {
      const { image, width, height } = reencoded.value
      expect({ width, height }).toEqual({ width: 4, height: 2 })
      expect(image.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]))
      expect(image.subarray(-2)).toEqual(Buffer.from([0xff, 0xd9]))
    }
  })

  it('keeps nothing of a comment in the picture, nor of what stands behind its end', async () => {
    const hidden = Buffer.from("<script>alert('hidden')</script>")
    const withHidden = Buffer.concat([
      PICTURE.subarray(0, 2),
      Buffer.from([0xff, 0xfe, 0x00, hidden.length + 2]),
      hidden,
      PICTURE.subarray(2),
      hidden,
    ])

    const reencoded = await reencodeJpegImage(withHidden, ROOMY)
    const plain = await reencodeJpegImage(PICTURE, ROOMY)

    expect(reencoded.success && reencoded.value.image.includes(hidden)).toBe(false)
    // The same pixels, so the same bytes: nothing of the container came along.
    expect(
      reencoded.success && plain.success && reencoded.value.image.equals(plain.value.image),
    ).toBe(true)
  })

  it('takes the highest quality that fits the bytes', async () => {
    const noise = await noiseJpeg(64, 64)
    const sizes = await bytesPerQuality(noise)
    // Every step down is smaller, or the steps would be for nothing.
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a))

    for (const [step, bytes] of sizes.entries()) {
      const reencoded = await reencodeJpegImage(noise, { ...ROOMY, maxBytes: bytes })
      expect(reencoded.success && reencoded.value.image.length).toBe(bytes)
      if (step > 0) {
        // One byte less than the step before needs: that step does not fit, this one does.
        const justUnder = await reencodeJpegImage(noise, {
          ...ROOMY,
          maxBytes: sizes[step - 1] - 1,
        })
        expect(justUnder.success && justUnder.value.image.length).toBe(bytes)
      }
    }
  })

  // The steps are the highest quality used: a picture is never encoded above its own.
  it('encodes a picture at the quality it came in with where that fits', async () => {
    const coarse = await noiseJpeg(64, 64, 60)

    const reencoded = await reencodeJpegImage(coarse, ROOMY)

    expect(reencoded.success).toBe(true)
    if (reencoded.success) {
      const probed = probeImage(reencoded.value.image)
      expect(probed.success && probed.value.inputJpegQuality).toBe(60)
      // No larger than it came in, give or take the two encoders' headers.
      expect(reencoded.value.image.length).toBeLessThan(coarse.length * 1.02)
    }
  })

  it("goes on with the first step below the picture's quality where that does not fit", async () => {
    const coarse = await noiseJpeg(64, 64, 60)
    const asItCame = await reencodeJpegImage(coarse, ROOMY)
    const tooTight = {
      ...ROOMY,
      maxBytes: (asItCame.success ? asItCame.value.image.length : 0) - 1,
    }

    const reencoded = await reencodeJpegImage(coarse, tooTight)

    expect(reencoded.success).toBe(true)
    if (reencoded.success) {
      const probed = probeImage(reencoded.value.image)
      // 85, 75 and 65 all come to 60; the next step that is lower is 55.
      expect(probed.success && probed.value.inputJpegQuality).toBe(55)
    }
  })

  it('refuses a picture that does not fit the bytes at the lowest quality as TOO_LARGE', async () => {
    const noise = await noiseJpeg(64, 64)
    const sizes = await bytesPerQuality(noise)
    const lowest = sizes[sizes.length - 1]

    const refused = await reencodeJpegImage(noise, { ...ROOMY, maxBytes: lowest - 1 })

    expect(refused.success).toBe(false)
    if (!refused.success) {
      expect(refused.error.reason).toBe('TOO_LARGE')
      expect(refused.error.nativeError).toBe('RIMG_ERR_BUFFER_TOO_SMALL')
      expect(refused.error.message).toBe(
        `JPEG_IMAGE_NOT_REENCODED: TOO_LARGE (RIMG_ERR_BUFFER_TOO_SMALL), ${noise.length} bytes`,
      )
    }
  })

  it('refuses a picture wider, higher or larger than the bounds as SIZE', async () => {
    const bounds = [
      { ...ROOMY, maxSide: 3 },
      { ...ROOMY, maxPixels: 7 },
    ]
    for (const tooTight of bounds) {
      const refused = await reencodeJpegImage(PICTURE, tooTight)
      expect(refused.success).toBe(false)
      expect(!refused.success && refused.error.reason).toBe('SIZE')
      expect(!refused.success && refused.error.nativeError).toBe('RIMG_ERR_LIMIT')
    }
    // The bounds are the largest picture taken.
    expect((await reencodeJpegImage(PICTURE, { ...ROOMY, maxSide: 4, maxPixels: 8 })).success).toBe(
      true,
    )
  })

  it('refuses what does not decode as NOT_JPEG: no picture, half a picture, a PNG', async () => {
    const cases: [Buffer, string][] = [
      [
        Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9]),
        'RIMG_ERR_DECODE',
      ],
      [PICTURE.subarray(0, PICTURE.length / 2), 'RIMG_ERR_DECODE'],
      [noisePng(4, 2), 'RIMG_ERR_UNSUPPORTED'],
      [Buffer.from('<svg onload=alert(1)>'), 'RIMG_ERR_UNSUPPORTED'],
    ]
    for (const [image, nativeError] of cases) {
      const refused = await reencodeJpegImage(image, ROOMY)
      expect(refused.success).toBe(false)
      expect(!refused.success && refused.error.reason).toBe('NOT_JPEG')
      expect(!refused.success && refused.error.nativeError).toBe(nativeError)
    }
  })

  // What the header rules out never reaches a worker thread.
  it('refuses on the header alone, without decoding, what the header already rules out', async () => {
    const reencode = spyOn(sharedNative, 'reencodeImage')
    try {
      const cases: [Buffer, typeof ROOMY, string][] = [
        [PICTURE, { ...ROOMY, maxSide: 3 }, 'SIZE'],
        [PICTURE, { ...ROOMY, maxPixels: 7 }, 'SIZE'],
        [noisePng(4, 2), ROOMY, 'NOT_JPEG'],
        [Buffer.from('<svg onload=alert(1)>'), ROOMY, 'NOT_JPEG'],
        [Buffer.alloc(0), ROOMY, 'NOT_JPEG'],
      ]
      for (const [image, bounds, reason] of cases) {
        const refused = await reencodeJpegImage(image, bounds)
        expect(!refused.success && refused.error.reason).toBe(reason)
      }
      expect(reencode).not.toHaveBeenCalled()

      // A picture the header lets through is decoded: one whose header is whole and whose
      // pixel data is broken is refused only there.
      const broken = Buffer.from(await noiseJpeg(64, 64))
      broken.fill(0xff, broken.length - 40, broken.length - 2)
      broken[broken.length - 30] = 0xc4
      expect(probeImage(broken).success).toBe(true)
      reencode.mockClear()
      const refused = await reencodeJpegImage(broken, ROOMY)
      expect(!refused.success && refused.error.nativeError).toBe('RIMG_ERR_DECODE')
      expect((await reencodeJpegImage(PICTURE, ROOMY)).success).toBe(true)
      expect(reencode).toHaveBeenCalledTimes(2)
    } finally {
      reencode.mockRestore()
    }
  })
})
