// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { avatarLettering, avatarPaletteFor } from './avatarLettering'
import { avatarPaletteEntry } from './avatarColor'

const BERND = { alias: 'berndh', firstName: 'Bernd', lastName: 'Hueckstaedt' }

describe('avatarLettering', () => {
  it('takes the letters from the alias, because that is what the line beside it says', () => {
    expect(avatarLettering(BERND).letters).toBe('BE')
  })

  // ★ The point of the whole file: the colour must NOT follow the letters. If it did, every
  // member with an alias would change colour the day this shipped, and the printed card --
  // which seeds from initials on a canvas and is not reprinted -- would disagree with the
  // screen forever after.
  it('keeps the colour seeded from the real initials', () => {
    expect(avatarLettering(BERND).colorSeed).toBe('BH')
    expect(avatarLettering(BERND).colorSeed).not.toBe(avatarLettering(BERND).letters)
  })

  it('gives a member with an alias exactly the colour they had before', () => {
    expect(avatarPaletteFor(BERND)).toEqual(avatarPaletteEntry('BH'))
  })

  // Two members whose aliases start alike now differ by colour, because the colour comes
  // from somewhere else entirely. With one source both circles would have been identical.
  it('tells two members with the same two letters apart by colour', () => {
    const one = { alias: 'berndh', firstName: 'Bernd', lastName: 'Hueckstaedt' }
    const other = { alias: 'bernd2', firstName: 'Bernd', lastName: 'Zimmermann' }
    expect(avatarLettering(one).letters).toBe(avatarLettering(other).letters)
    expect(avatarPaletteFor(one)).not.toEqual(avatarPaletteFor(other))
  })

  describe('without an alias', () => {
    // Members of another community, and old rows. This is today's behaviour, unchanged.
    it('falls back to the real initials', () => {
      const stranger = { firstName: 'Anna', lastName: 'Meier' }
      expect(avatarLettering(stranger).letters).toBe('AM')
      expect(avatarLettering({ ...stranger, alias: null }).letters).toBe('AM')
      expect(avatarLettering({ ...stranger, alias: '' }).letters).toBe('AM')
    })

    it('still says something with only one name', () => {
      expect(avatarLettering({ firstName: 'Anna' }).letters).toBe('A')
      expect(avatarLettering({ lastName: 'Meier' }).letters).toBe('M')
    })

    // A row that carries nothing at all must not crash a booking list over a circle.
    it('says nothing rather than failing when there is nothing to say', () => {
      expect(avatarLettering({}).letters).toBe('')
      expect(avatarLettering().letters).toBe('')
      expect(() => avatarPaletteFor()).not.toThrow()
    })
  })

  it('shows the letters in capitals however the alias was typed', () => {
    expect(avatarLettering({ alias: 'aNna', firstName: 'x', lastName: 'y' }).letters).toBe('AN')
  })
})
