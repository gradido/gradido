// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EMOJI_ROWS, emojiKeysOf, offersEmojiPicker } from './emojiChoice'
import { isComputer } from '@/utils/isComputer'

vi.mock('@/utils/isComputer', () => ({ isComputer: vi.fn(() => true) }))

const ALL = EMOJI_ROWS.flat()
const codePoints = (emoji) => [...emoji].map((sign) => sign.codePointAt(0))
/** The selector that asks for the coloured drawing of a sign that is also a letter of some font. */
const COLOURED = 0xfe0f

describe('the wallet’s choice of emoji', () => {
  it('is forty-eight emoji, six rows of eight', () => {
    expect(EMOJI_ROWS).toHaveLength(6)
    for (const row of EMOJI_ROWS) expect(row).toHaveLength(8)
    expect(ALL).toHaveLength(48)
  })

  it('offers none of them twice', () => {
    expect(new Set(ALL).size).toBe(ALL.length)
  })

  it('cannot be changed by whoever reads it', () => {
    expect(Object.isFrozen(EMOJI_ROWS)).toBe(true)
    for (const row of EMOJI_ROWS) expect(Object.isFrozen(row)).toBe(true)
  })

  // Plain ones only: what is joined out of several signs, coloured by a skin tone or made of two
  // letters (a flag) is drawn in pieces, or not at all, where the device does not know it.
  it.each(ALL)('%s is one sign, at most with the selector for its coloured drawing', (emoji) => {
    const points = codePoints(emoji)
    expect(points.length).toBeLessThanOrEqual(2)
    if (points.length === 2) expect(points[1]).toBe(COLOURED)
    // One sign for the reader as well.
    const seen = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(emoji)]
    expect(seen).toHaveLength(1)
  })

  it.each(ALL)('%s is no flag, no skin tone and nothing joined', (emoji) => {
    for (const point of codePoints(emoji)) {
      // The letters flags are made of.
      expect(point < 0x1f1e6 || point > 0x1f1ff).toBe(true)
      // The five skin tones.
      expect(point < 0x1f3fb || point > 0x1f3ff).toBe(true)
      // The joiner.
      expect(point).not.toBe(0x200d)
    }
  })

  // The three that are a letter of some font without the selector: the heart, the sun, the hand.
  it('asks for the coloured drawing where a sign could come out black', () => {
    for (const emoji of ['❤️', '☀️', '✌️']) {
      expect(ALL).toContain(emoji)
      expect(codePoints(emoji)[1]).toBe(COLOURED)
    }
  })
})

describe('whether the smiley stands beside a field', () => {
  afterEach(() => vi.mocked(isComputer).mockReturnValue(true))

  it('does at a computer', () => {
    expect(offersEmojiPicker()).toBe(true)
  })

  it('does not on a phone or a tablet, whose keyboard has the emoji', () => {
    vi.mocked(isComputer).mockReturnValue(false)
    expect(offersEmojiPicker()).toBe(false)
  })
})

describe('the keys that open the device’s own emoji', () => {
  afterEach(() => vi.unstubAllGlobals())

  const on = (navigator) => {
    vi.stubGlobal('navigator', navigator)
    return emojiKeysOf()
  }

  it('are the Mac’s on a Mac', () => {
    expect(
      on({ platform: 'MacIntel', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }),
    ).toBe('mac')
  })

  it('are Windows’ on Windows', () => {
    expect(on({ platform: 'Win32', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })).toBe(
      'windows',
    )
  })

  it('are read from what the browser says of its platform where it says so', () => {
    expect(on({ userAgentData: { platform: 'Windows' }, platform: '', userAgent: '' })).toBe(
      'windows',
    )
    expect(on({ userAgentData: { platform: 'macOS' }, platform: '', userAgent: '' })).toBe('mac')
  })

  it('are not named where the wallet does not know them', () => {
    expect(on({ platform: 'Linux x86_64', userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' })).toBe(
      null,
    )
    expect(on({})).toBe(null)
  })
})
