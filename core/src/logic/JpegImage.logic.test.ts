// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { decodeJpegImage } from './JpegImage.logic'

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
