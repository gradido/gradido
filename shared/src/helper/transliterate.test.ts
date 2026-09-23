// AI-GENERATED — not an architecture reference
import { foldGermanLetters, transliterateToLatin } from './transliterate'

describe('foldGermanLetters', () => {
  it('spells out umlauts and ß', () => {
    expect(foldGermanLetters('Müller')).toBe('Mueller')
    expect(foldGermanLetters('Weiß')).toBe('Weiss')
  })

  it('keeps the case of the word around the letter', () => {
    expect(foldGermanLetters('Äpfel')).toBe('Aepfel')
    expect(foldGermanLetters('MÜLLER')).toBe('MUELLER')
    expect(foldGermanLetters('GROß')).toBe('GROSS')
  })

  it('reads a decomposed umlaut as the umlaut it is', () => {
    expect(foldGermanLetters('Müller')).toBe('Mueller')
    expect(foldGermanLetters('MÜLLER')).toBe('MUELLER')
  })

  it('leaves every other letter alone', () => {
    expect(foldGermanLetters('Fauré')).toBe('Fauré')
  })
})

describe('transliterateToLatin', () => {
  it('writes greek and cyrillic in latin letters', () => {
    expect(transliterateToLatin('Αλέξανδρος')).toBe('Alexandros')
    expect(transliterateToLatin('Щербаков')).toBe('Shcherbakov')
  })

  it('passes through what is not a letter, and scripts it has no table for', () => {
    expect(transliterateToLatin('Jürgen-Søren 2')).toBe('Juergen-Soren 2')
    expect(transliterateToLatin('张三')).toBe('张三')
  })
})
