// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { avatarLettering } from './avatarLettering'
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

  /**
   * ⛔ The test the first version of this file could not fail.
   *
   * Every fixture here used to be capitalised, so `.toUpperCase()` on the seed was a no-op
   * across the whole suite -- while in the wallet it moved the colour of every member whose
   * name starts lower case, and of every federated counterparty, whose "last name" is the
   * final character of an alias. `avatarPaletteEntry` hashes with `charCodeAt`, so the case
   * IS the colour.
   *
   * The seed is therefore compared against the literal string the old call sites passed,
   * not against something this file also computes. A test that compares a value with itself
   * cannot notice that both moved.
   */
  describe('the colour a member already had', () => {
    const cases = [
      ['a name typed in lower case', { firstName: 'bernd', lastName: 'hueckstaedt' }, 'bh'],
      ['a Dutch particle', { firstName: 'Ludwig', lastName: 'van Beethoven' }, 'Lv'],
      ['a Spanish particle', { firstName: 'Sofia', lastName: 'del Rio' }, 'Sd'],
      [
        'a federated row, whose last name is one alias character',
        { firstName: 'napol', lastName: 'i' },
        'ni',
      ],
      ['a name already capitalised', { firstName: 'Anna', lastName: 'Meier' }, 'AM'],
    ]

    it.each(cases)('does not move for %s', (_label, member, seedBefore) => {
      expect(avatarLettering(member).colorSeed).toBe(seedBefore)
      expect(avatarPaletteEntry(avatarLettering(member).colorSeed)).toEqual(
        avatarPaletteEntry(seedBefore),
      )
    })

    // The guard under the guard: if this ever stops holding, the test above is measuring
    // nothing and every case in it can be satisfied by uppercasing both sides.
    it('is a rule with teeth, because the palette really is case-sensitive', () => {
      expect(avatarPaletteEntry('bh')).not.toEqual(avatarPaletteEntry('BH'))
    })
  })

  // Two members whose aliases start alike now differ by colour, because the colour comes
  // from somewhere else entirely. With one source both circles would have been identical.
  it('tells two members with the same two letters apart by colour', () => {
    const one = { alias: 'berndh', firstName: 'Bernd', lastName: 'Hueckstaedt' }
    const other = { alias: 'bernd2', firstName: 'Bernd', lastName: 'Zimmermann' }
    expect(avatarLettering(one).letters).toBe(avatarLettering(other).letters)
    expect(avatarPaletteEntry(avatarLettering(one).colorSeed)).not.toEqual(
      avatarPaletteEntry(avatarLettering(other).colorSeed),
    )
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
    })

    /**
     * ⛔ `null`, not `undefined`, and the difference is a whole booking list.
     *
     * A default parameter fires for `undefined` only. `linkedUser` is nullable and the
     * resolver's if/else-if chain has no final branch, so `props.transaction?.linkedUser`
     * hands this a real `null` -- and a throw inside a computed during render takes the
     * whole row with it, or in the sidebar the whole list.
     */
    it('survives a booking whose counterparty could not be resolved', () => {
      expect(() => avatarLettering(null)).not.toThrow()
      expect(avatarLettering(null)).toEqual({ letters: '', colorSeed: '' })
    })
  })

  it('shows the letters in capitals however the alias was typed', () => {
    expect(avatarLettering({ alias: 'aNna', firstName: 'x', lastName: 'y' }).letters).toBe('AN')
  })

  /**
   * VALID_ALIAS_REGEX is `^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$` -- only the
   * FIRST character is guaranteed alphanumeric. A blind two-character slice therefore puts
   * a separator in front of a member, which is what the docblock here used to promise could
   * not happen.
   */
  it('never puts a separator in the circle', () => {
    expect(avatarLettering({ alias: 'j-doe' }).letters).toBe('JD')
    expect(avatarLettering({ alias: 'a_b' }).letters).toBe('AB')
    expect(avatarLettering({ alias: 'x-y-z' }).letters).toBe('XY')
    expect(avatarLettering({ alias: 'a-team' }).letters).toBe('AT')
  })
})
