import {
  additionalAliasVariants,
  aliasCandidates,
  findFirstFreeAlias,
  transliterateForAlias,
} from './aliasFromName'

const of = (firstName: string, lastName: string, email: string) =>
  aliasCandidates({ firstName, lastName, email })

describe('transliterateForAlias', () => {
  it('writes german umlauts out instead of dropping their second letter', () => {
    expect(transliterateForAlias('Hückstädt')).toBe('Hueckstaedt')
    expect(transliterateForAlias('Weiß')).toBe('Weiss')
  })

  it('reads a decomposed umlaut as the umlaut it is, not as a stripped accent', () => {
    expect(transliterateForAlias('Mu\u0308ller')).toBe('Mueller')
  })

  it('capitalises only the first letter of what an umlaut becomes', () => {
    expect(transliterateForAlias('Über')).toBe('Ueber')
    expect(transliterateForAlias('Ü')).toBe('Ue')
  })

  it('keeps a name written in capitals in capitals', () => {
    expect(transliterateForAlias('MÜLLER')).toBe('MUELLER')
    expect(transliterateForAlias('HÜCKSTÄDT')).toBe('HUECKSTAEDT')
    expect(transliterateForAlias('ЩЕРБАКОВ')).toBe('SHCHERBAKOV')
    expect(transliterateForAlias('ΘΕΟΔΩΡΟΣ')).toBe('THEODOROS')
  })

  it('writes ß in capitals only between capitals', () => {
    expect(transliterateForAlias('GROß')).toBe('GROSS')
    expect(transliterateForAlias('STRAßE')).toBe('STRASSE')
    expect(transliterateForAlias('GROẞ')).toBe('GROSS')
    expect(transliterateForAlias('Weiß')).toBe('Weiss')
    expect(transliterateForAlias('Straße')).toBe('Strasse')
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

describe('aliasCandidates', () => {
  it('offers the first name plus one letter of the last, best first', () => {
    expect(of('Bernd', 'Hückstädt', 'b@example.com')[0]).toBe('BerndH')
  })

  it('never cuts a replacement in half, whether the umlaut arrives composed or not', () => {
    for (const lastName of ['Hückstädt'.normalize('NFC'), 'Hückstädt'.normalize('NFD')]) {
      expect(of('Bernd', lastName, 'b@example.com').slice(0, 3)).toEqual([
        'BerndH',
        'BerndHue',
        'BerndHuec',
      ])
    }
  })

  it('walks further into the last name when one letter is too short', () => {
    // `AlB` is two letters plus one and still under the minimum at `AB`, so a name
    // this short only becomes usable a letter later.
    expect(of('Al', 'Bo', 'al@example.com')[0]).toBe('AlB')
  })

  // Initials that short leave nothing to walk into, so the address is asked next - and
  // when that is two letters as well, nothing is left: the caller falls back on its own.
  it('drops through to the address, and has nothing when that is short too', () => {
    expect(of('A', 'B', 'aberdeen@example.com')).toEqual(['aberdeen'])
    expect(of('A', 'B', 'ab@example.com')).toEqual([])
  })

  // A name that reads like an office is worse than a long one, so the answer to a
  // reserved word is the same as to a short one: take more of the last name.
  it('walks past a reserved word rather than numbering it', () => {
    const candidates = of('Roo', 'Twright', 'roo@example.com')
    expect(candidates).not.toContain('RooT')
    expect(candidates[0]).toBe('RooTw')
  })

  it('falls back to the email when the name yields no letters', () => {
    expect(of('张', '三', 'zhangsan@example.com')).toEqual(['zhangsan'])
  })

  it('takes the address without its plus tag and the punctuation the alias cannot hold', () => {
    expect(of('张', '三', 'bernd.hueckstaedt+gradido@example.com')).toEqual(['berndhueckstaedt'])
  })

  it('has nothing to offer when neither name nor address can give a name', () => {
    expect(of('张', '三', '张三@example.com')).toEqual([])
  })

  it('offers longer forms after the shortest, so a clash has somewhere to go', () => {
    expect(of('Bernd', 'Hueckstaedt', 'b@example.com').slice(0, 3)).toEqual([
      'BerndH',
      'BerndHu',
      'BerndHue',
    ])
  })

  it('keeps every proposal inside the bounds the schema enforces', () => {
    for (const candidate of of('Maximilian', 'Schwarzenegger', 'm@example.com')) {
      expect(candidate.length).toBeGreaterThanOrEqual(3)
      expect(candidate.length).toBeLessThanOrEqual(20)
    }
  })
})

describe('findFirstFreeAlias', () => {
  it('takes the first candidate nobody holds', () => {
    expect(findFirstFreeAlias(['BerndH'], ['BerndH', 'BerndHu'])).toBe('BerndHu')
  })

  it('treats names as taken regardless of case, like the unique key', () => {
    expect(findFirstFreeAlias(['berndh'], ['BerndH', 'BerndHu'])).toBe('BerndHu')
  })

  it('keeps the spelling of the candidate it returns', () => {
    expect(findFirstFreeAlias(['berndh'], ['BerndH', 'BerndHue'])).toBe('BerndHue')
  })

  // Numbering is not its business: the caller asks about the numbered forms in a second round.
  it('returns null when every candidate is taken', () => {
    expect(findFirstFreeAlias(['berndh', 'BerndHue'], ['BerndH', 'BerndHue'])).toBeNull()
    expect(findFirstFreeAlias([], [])).toBeNull()
  })
})

describe('additionalAliasVariants', () => {
  it('numbers each candidate from 1 to 99, in the order of the candidates', () => {
    const variants = additionalAliasVariants(['BerndH', 'BerndHue'])

    expect(variants).toHaveLength(2 * 99)
    expect(variants.slice(0, 2)).toEqual(['BerndH1', 'BerndH2'])
    expect(variants[98]).toBe('BerndH99')
    expect(variants[99]).toBe('BerndHue1')
  })

  // The plain names were asked about before; asking again would only make the list longer.
  it('holds none of the plain names', () => {
    expect(additionalAliasVariants(['BerndH'])).not.toContain('BerndH')
  })

  // The digits never push a name past ALIAS_MAX_CHARS: they take the place of its last letters.
  it('cuts a long candidate short for its number', () => {
    const variants = additionalAliasVariants(['MaximilianSchwarzene'])

    expect(variants).toContain('MaximilianSchwarzen1')
    expect(variants).toContain('MaximilianSchwarze99')
    for (const variant of variants) {
      expect(variant.length).toBeLessThanOrEqual(20)
    }
  })
})
