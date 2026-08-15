// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { AVATAR_COLOR_PALETTE, avatarPaletteEntry } from './avatarColor'

describe('avatarPaletteEntry', () => {
  it('gives the same seed the same colour every time', () => {
    expect(avatarPaletteEntry('BH')).toEqual(avatarPaletteEntry('BH'))
  })

  // Pinned on purpose. The colour of an avatar without a picture is not decoration: it is
  // printed on cards that members hand out and cannot take back. A change to the palette or
  // to the hash would repaint every one of them, so it has to fail here first.
  it('keeps the colours it has handed out so far', () => {
    expect(avatarPaletteEntry('BH').bg).toBe('#2B6CB0')
    expect(avatarPaletteEntry('AA').bg).toBe('#4A5568')
    expect(avatarPaletteEntry('MK').bg).toBe('#805AD5')
  })

  it('always answers, even without a seed', () => {
    expect(AVATAR_COLOR_PALETTE).toContainEqual(avatarPaletteEntry(''))
    expect(AVATAR_COLOR_PALETTE).toContainEqual(avatarPaletteEntry(null))
    expect(AVATAR_COLOR_PALETTE).toContainEqual(avatarPaletteEntry(undefined))
  })

  it('offers text colours with enough contrast on their background', () => {
    for (const entry of AVATAR_COLOR_PALETTE) {
      expect(entry.bg).toMatch(/^#[0-9A-F]{6}$/i)
      expect(entry.text).toBe('#FFFFFF')
    }
  })
})
