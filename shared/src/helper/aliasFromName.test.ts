import { aliasCandidates, aliasStemFromEmail, transliterateForAlias } from './aliasFromName'

describe('transliterateForAlias', () => {
  it('writes german umlauts out instead of dropping their second letter', () => {
    expect(transliterateForAlias('Hückstädt')).toBe('Hueckstaedt')
    expect(transliterateForAlias('Weiß')).toBe('Weiss')
  })

  it('capitalises only the first letter of what an umlaut becomes', () => {
    expect(transliterateForAlias('Über')).toBe('Ueber')
  })

  it('strips the accents that a latin letter merely carries', () => {
    expect(transliterateForAlias('Ñuñez')).toBe('Nunez')
    expect(transliterateForAlias('Şahin')).toBe('Sahin')
    expect(transliterateForAlias('Fauré')).toBe('Faure')
  })

  it('writes latin letters that carry no strippable mark', () => {
    expect(transliterateForAlias('Søren')).toBe('Soren')
    expect(transliterateForAlias('Łukasz')).toBe('Lukasz')
  })

  it('transliterates greek, accents and all', () => {
    expect(transliterateForAlias('Αλέξανδρος')).toBe('Alexandros')
    expect(transliterateForAlias('Γιώργος')).toBe('Giorgos')
  })

  it('transliterates cyrillic', () => {
    expect(transliterateForAlias('Иван')).toBe('Ivan')
    expect(transliterateForAlias('Щербаков')).toBe('Shcherbakov')
  })

  // The case the whole ladder exists for: nothing can be pulled out of these, which is
  // why the email is the last rung rather than a nicety.
  it('yields nothing for a script it has no table for', () => {
    expect(transliterateForAlias('张三')).toBe('')
    expect(transliterateForAlias('田中')).toBe('')
    expect(transliterateForAlias('김민수')).toBe('')
  })
})

describe('aliasStemFromEmail', () => {
  it('takes what stands before the at sign', () => {
    expect(aliasStemFromEmail('zhangsan@example.com')).toBe('zhangsan')
  })

  it('drops a plus tag and the punctuation the alias cannot hold', () => {
    expect(aliasStemFromEmail('bernd.hueckstaedt+gradido@example.com')).toBe('berndhueckstaedt')
  })

  it('has nothing to give without an address', () => {
    expect(aliasStemFromEmail(undefined)).toBe('')
    expect(aliasStemFromEmail(null)).toBe('')
  })
})

describe('aliasCandidates', () => {
  it('offers the first name plus one letter of the last, best first', () => {
    expect(aliasCandidates('Bernd', 'Hückstädt', 'b@example.com')[0]).toBe('BerndH')
  })

  it('walks further into the last name when one letter is too short', () => {
    // `AlB` is two letters plus one and still under the minimum at `AB`, so a name
    // this short only becomes usable a letter later.
    expect(aliasCandidates('Al', 'Bo', 'al@example.com')[0]).toBe('AlB')
  })

  // Initials that short leave nothing to walk into, so the address is asked next - and
  // when that is two letters as well, the list comes back empty and the caller has to
  // supply the last rung itself.
  it('drops through to the address, and past it when that is short too', () => {
    expect(aliasCandidates('A', 'B', 'aberdeen@example.com')[0]).toBe('aberdeen')
    expect(aliasCandidates('A', 'B', 'ab@example.com')).toEqual([])
  })

  // A name that reads like an office is worse than a long one, so the answer to a
  // reserved word is the same as to a short one: take more of the last name.
  it('walks past a reserved word rather than numbering it', () => {
    const candidates = aliasCandidates('Roo', 'Twright', 'roo@example.com')
    expect(candidates).not.toContain('RooT')
    expect(candidates[0]).toBe('RooTw')
  })

  it('falls back to the email when the name yields no letters', () => {
    expect(aliasCandidates('张', '三', 'zhangsan@example.com')).toEqual(['zhangsan'])
  })

  it('returns nothing when neither name nor address can give one', () => {
    expect(aliasCandidates('张', '三', null)).toEqual([])
  })

  it('offers longer forms after the shortest, so a clash has somewhere to go', () => {
    const candidates = aliasCandidates('Bernd', 'Hueckstaedt', 'b@example.com')
    expect(candidates.slice(0, 3)).toEqual(['BerndH', 'BerndHu', 'BerndHue'])
  })

  it('keeps every proposal inside the bounds the schema enforces', () => {
    for (const candidate of aliasCandidates('Maximilian', 'Schwarzenegger', 'm@example.com')) {
      expect(candidate.length).toBeGreaterThanOrEqual(3)
      expect(candidate.length).toBeLessThanOrEqual(20)
    }
  })
})
