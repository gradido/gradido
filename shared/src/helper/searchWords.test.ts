// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'bun:test'

import { SEARCH_WORDS_AT_MOST, searchWords } from './searchWords'

describe('searchWords', () => {
  it('splits a text into its words, in their order', () => {
    expect(searchWords('michael e. müller')).toEqual(['michael', 'e.', 'müller'])
  })

  it('leaves one word whole, an address too', () => {
    expect(searchWords('michael.buechner@gmx.at')).toEqual(['michael.buechner@gmx.at'])
  })

  it.each([
    ['spaces at both ends', '  michael müller '],
    ['several spaces', 'michael    müller'],
    ['a tab', 'michael\tmüller'],
    ['a line break', 'michael\nmüller'],
    ['a no-break space, as a pasted name brings it', `michael${String.fromCharCode(0xa0)}müller`],
  ])('separates at %s', (_name, text) => {
    expect(searchWords(text)).toEqual(['michael', 'müller'])
  })

  it.each([
    ['nothing', ''],
    ['only white space', ' \t '],
  ])('finds no word in %s', (_name, text) => {
    expect(searchWords(text)).toEqual([])
  })

  it('stops at the most words a search needs, and keeps the first ones', () => {
    const words = Array.from({ length: SEARCH_WORDS_AT_MOST + 5 }, (_, index) => `word${index}`)
    const kept = searchWords(words.join(' '))
    expect(kept).toEqual(words.slice(0, SEARCH_WORDS_AT_MOST))
    expect(kept).toHaveLength(10)
  })
})
