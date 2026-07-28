import { guessGender, normalizeName } from './nameGender'

describe('crea nameGender heuristic (dataset-backed)', () => {
  it('resolves common male first names', () => {
    for (const name of ['Thomas', 'Bernd', 'Michael', 'Jürgen', 'Günther']) {
      expect(guessGender(name)).toBe('male')
    }
  })

  it('resolves common female first names', () => {
    for (const name of ['Maria', 'Anna', 'Elfi', 'Nadine', 'Sonja']) {
      expect(guessGender(name)).toBe('female')
    }
  })

  it('prefers the German reading (Andrea is female in Germany)', () => {
    expect(guessGender('Andrea')).toBe('female')
  })

  it('returns null for genuinely ambiguous or unknown names', () => {
    expect(guessGender('Kim')).toBeNull()
    expect(guessGender('Xyzzy')).toBeNull()
    expect(guessGender('')).toBeNull()
    expect(guessGender(null)).toBeNull()
    expect(guessGender(undefined)).toBeNull()
  })

  it('uses the leading given name and normalises umlauts to ASCII', () => {
    expect(guessGender('Anna-Lena')).toBe('female')
    expect(guessGender('Guenther')).toBe('male') // ASCII spelling of Günther
    expect(normalizeName('Günther')).toBe('guenther')
    expect(normalizeName('José')).toBe('jose') // diacritics stripped to the base letter
  })
})
