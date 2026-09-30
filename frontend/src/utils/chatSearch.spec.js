// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import {
  CHAT_SEARCH_MIN,
  chatSearchHolds,
  chatSearchNeedle,
  chatSearchPieces,
  chatSearchRanges,
} from './chatSearch'

const cut = (text, typed) =>
  chatSearchRanges(text, chatSearchNeedle(typed)).map(([start, end]) => text.slice(start, end))

describe('chatSearchNeedle', () => {
  it('folds case and accents and trims', () => {
    expect(chatSearchNeedle('  Café ')).toBe('cafe')
    expect(chatSearchNeedle('GRÜSSE')).toBe('grusse')
  })

  // A single letter stands in nearly every message.
  it(`searches nothing below ${CHAT_SEARCH_MIN} letters`, () => {
    expect(chatSearchNeedle('a')).toBe('')
    expect(chatSearchNeedle(' é ')).toBe('')
    expect(chatSearchNeedle('')).toBe('')
    expect(chatSearchNeedle(null)).toBe('')
    expect(chatSearchNeedle('ab')).toBe('ab')
  })
})

describe('chatSearchRanges', () => {
  it('finds without regard to case', () => {
    expect(cut('Das ist ein toller Ruheplatz', 'RUHE')).toEqual(['Ruhe'])
  })

  it('finds without regard to accents, either way round', () => {
    expect(cut('Treffen im Café am Markt', 'cafe')).toEqual(['Café'])
    expect(cut('Treffen im Cafe am Markt', 'café')).toEqual(['Cafe'])
    expect(cut('Liebe Grüße, Bernd', 'gruße')).toEqual(['Grüße'])
    expect(cut('Liebe Grüße, Bernd', 'Grüße')).toEqual(['Grüße'])
  })

  // A letter stands for itself otherwise: no spelling rules.
  it('does not take "ss" for "ß" nor "ue" for "ü"', () => {
    expect(cut('Liebe Grüße', 'grusse')).toEqual([])
    expect(cut('Liebe Grüße', 'grueße')).toEqual([])
  })

  it('finds every place, one after another, never overlapping', () => {
    expect(cut('Anna, Anna und Hannah', 'ann')).toEqual(['Ann', 'Ann', 'ann'])
    expect(cut('aaaa', 'aa')).toEqual(['aa', 'aa'])
  })

  // The places are the text's own: an emoji before a hit is two code units, a decomposed
  // character is two -- the hit must still be cut where it stands.
  it("gives the text's own places, past emoji and decomposed letters", () => {
    expect(cut('🌳🌳 Baum am Weg', 'baum')).toEqual(['Baum'])
    const decomposed = 'Café und Tee'
    expect(cut(decomposed, 'café')).toEqual(['Café'])
    expect(cut(decomposed, 'tee')).toEqual(['Tee'])
  })

  it('finds nothing where there is nothing to search', () => {
    expect(chatSearchRanges('', 'ab')).toEqual([])
    expect(chatSearchRanges('abc', '')).toEqual([])
    expect(cut('Hallo Welt', 'mond')).toEqual([])
  })
})

describe('chatSearchPieces', () => {
  it('cuts the text at the hits and keeps every letter', () => {
    const pieces = chatSearchPieces('Der Ruheplatz am Waldrand', chatSearchNeedle('ruhe'))
    expect(pieces).toEqual([
      { text: 'Der ', hit: false },
      { text: 'Ruhe', hit: true },
      { text: 'platz am Waldrand', hit: false },
    ])
    expect(pieces.map((piece) => piece.text).join('')).toBe('Der Ruheplatz am Waldrand')
  })

  it('hands back the whole text where the needle is not in it', () => {
    expect(chatSearchPieces('Hallo', 'mond')).toEqual([{ text: 'Hallo', hit: false }])
  })

  it('begins and ends with a hit where the text does', () => {
    expect(chatSearchPieces('Bank am Waldrand, Bank', 'bank')).toEqual([
      { text: 'Bank', hit: true },
      { text: ' am Waldrand, ', hit: false },
      { text: 'Bank', hit: true },
    ])
  })
})

describe('chatSearchHolds', () => {
  it('looks at the subject and at the words', () => {
    expect(chatSearchHolds({ subject: 'Wichtig', body: 'Hallo' }, 'wichtig')).toBe(true)
    expect(chatSearchHolds({ subject: null, body: 'Ein toller Ruheplatz' }, 'ruhe')).toBe(true)
    expect(chatSearchHolds({ subject: 'Wichtig', body: 'Hallo' }, 'mond')).toBe(false)
  })

  it('holds nothing for no needle or no words', () => {
    expect(chatSearchHolds({ subject: 'Wichtig', body: 'Hallo' }, '')).toBe(false)
    expect(chatSearchHolds({}, 'hallo')).toBe(false)
  })
})
