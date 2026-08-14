// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import {
  AVATAR_QUALITY_STEPS,
  base64ByteLength,
  encodeUnderTarget,
  isHeicFileName,
} from './avatarImage'

// A stand-in for the canvas that answers with a payload of a chosen size per quality
// step, so the step-down can be measured without a real drawing surface.
const fakeCanvas = (sizesByQuality) => ({
  calls: [],
  toDataURL(type, quality) {
    this.calls.push(quality)
    const bytes = sizesByQuality[quality]
    // 4 base64 characters carry 3 bytes.
    return `data:image/jpeg;base64,${'A'.repeat(Math.ceil((bytes * 4) / 3))}`
  },
})

describe('base64ByteLength', () => {
  it('reads the payload size, not the length of the whole data URI', () => {
    const dataUrl = `data:image/jpeg;base64,${'A'.repeat(4000)}`
    expect(base64ByteLength(dataUrl)).toBe(3000)
  })
})

describe('encodeUnderTarget', () => {
  it('keeps the first quality when the picture already fits', () => {
    const canvas = fakeCanvas({ 0.85: 20000 })
    const result = encodeUnderTarget(canvas, 55 * 1024)

    expect(result.quality).toBe(0.85)
    expect(canvas.calls).toEqual([0.85])
  })

  // The case Bernd's observation produced: a detailed portrait at the default quality
  // lands above the request body limit, and a fixed quality would simply be rejected.
  it('lowers the quality step by step until the picture fits', () => {
    const canvas = fakeCanvas({ 0.85: 120000, 0.75: 90000, 0.65: 50000 })
    const result = encodeUnderTarget(canvas, 55 * 1024)

    expect(result.quality).toBe(0.65)
    expect(result.bytes).toBeLessThanOrEqual(55 * 1024)
    expect(canvas.calls).toEqual([0.85, 0.75, 0.65])
  })

  it('stops at the lowest step instead of looping when nothing fits', () => {
    const sizes = Object.fromEntries(AVATAR_QUALITY_STEPS.map((step) => [step, 900000]))
    const canvas = fakeCanvas(sizes)
    const result = encodeUnderTarget(canvas, 55 * 1024)

    expect(result.quality).toBe(AVATAR_QUALITY_STEPS[AVATAR_QUALITY_STEPS.length - 1])
    expect(canvas.calls).toHaveLength(AVATAR_QUALITY_STEPS.length)
  })

  it('hands back the payload without the data URI head', () => {
    const canvas = fakeCanvas({ 0.85: 300 })
    const result = encodeUnderTarget(canvas, 55 * 1024)

    expect(result.base64.startsWith('data:')).toBe(false)
    expect(result.base64).toMatch(/^A+$/)
  })
})

describe('isHeicFileName', () => {
  it('recognises the iPhone camera format, whatever the case', () => {
    expect(isHeicFileName('IMG_0042.HEIC')).toBe(true)
    expect(isHeicFileName('portrait.heif')).toBe(true)
  })

  it('leaves ordinary pictures alone', () => {
    expect(isHeicFileName('portrait.jpg')).toBe(false)
    expect(isHeicFileName('scan.png')).toBe(false)
    expect(isHeicFileName(undefined)).toBe(false)
  })
})
