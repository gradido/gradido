// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { greetingMemo, greetingParts, lineFromMemo } from './thankYouGreeting'

const LINE = 'Einfach so — weil es Dich gibt.'
const WORDS = 'Liebe Sarah, mit Eurem iPad hat alles angefangen.\n\nEure Oma'

describe('greetingMemo', () => {
  it('is the line, one line break, and the words', () => {
    expect(greetingMemo(LINE, WORDS)).toBe(`${LINE}\n${WORDS}`)
  })

  it('is the line alone, or the words alone, where the other is missing', () => {
    expect(greetingMemo(LINE, '')).toBe(LINE)
    expect(greetingMemo(LINE, '   \n ')).toBe(LINE)
    expect(greetingMemo('', WORDS)).toBe(WORDS)
    expect(greetingMemo(null, WORDS)).toBe(WORDS)
    expect(greetingMemo(undefined, undefined)).toBe('')
  })

  it('takes both trimmed, and keeps the line breaks inside the words', () => {
    expect(greetingMemo(`  ${LINE} `, `\n${WORDS}\n\n`)).toBe(`${LINE}\n${WORDS}`)
  })
})

describe('greetingParts', () => {
  it('cuts the line off the memo and leaves the words', () => {
    expect(greetingParts(`${LINE}\n${WORDS}`, LINE)).toEqual({ line: LINE, words: WORDS })
  })

  it('has no words where the memo is exactly the line', () => {
    expect(greetingParts(LINE, LINE)).toEqual({ line: LINE, words: '' })
  })

  it('has no line where the greeting has none, and the memo whole as the words', () => {
    for (const line of [null, undefined, '']) {
      expect(greetingParts(WORDS, line)).toEqual({ line: null, words: WORDS })
    }
  })

  // Nothing twice, nothing lost: such a memo stands whole, and the line is not set above it.
  it('shows the memo whole and no line where the memo does not begin with the line', () => {
    for (const memo of [
      WORDS,
      `${WORDS}\n${LINE}`,
      `${LINE} ${WORDS}`,
      `${LINE}${WORDS}`,
      `${LINE}\n\n${WORDS}`,
      `${LINE}\n`,
      ` ${LINE}\n${WORDS}`,
    ]) {
      expect(greetingParts(memo, LINE)).toEqual({ line: null, words: memo })
    }
  })

  it('takes a missing memo as an empty one', () => {
    expect(greetingParts(null, LINE)).toEqual({ line: null, words: '' })
    expect(greetingParts(undefined, null)).toEqual({ line: null, words: '' })
  })

  it('takes apart what greetingMemo put together', () => {
    for (const [line, words] of [
      [LINE, WORDS],
      [LINE, ''],
      ['Danke!', 'x'],
    ]) {
      expect(greetingParts(greetingMemo(line, words), line)).toEqual({ line, words })
    }
  })
})

describe('lineFromMemo', () => {
  const FIRST = 'Danke für Deine Hilfe!'

  it('is the whole message where it is one line of at most 80 characters', () => {
    expect(lineFromMemo(FIRST)).toBe(FIRST)
    expect(lineFromMemo('x'.repeat(80))).toBe('x'.repeat(80))
  })

  it('is nothing where that one line is longer', () => {
    expect(lineFromMemo('x'.repeat(81))).toBeNull()
  })

  it('is the first of two lines', () => {
    expect(lineFromMemo(`${FIRST}\nOhne Dich stünde die Bank noch schief.`)).toBe(FIRST)
    expect(lineFromMemo(`${FIRST}\nZwei\n\nund mehr`)).toBe(FIRST)
  })

  // The server asks for one line break between the line and the words, and something after it.
  it('is nothing with an empty line after the first, or nothing after the break', () => {
    expect(lineFromMemo(`${FIRST}\n\nOhne Dich`)).toBeNull()
    expect(lineFromMemo(`${FIRST}\n`)).toBeNull()
  })

  it('is nothing where there is only a line break, or nothing at all', () => {
    expect(lineFromMemo('\n')).toBeNull()
    expect(lineFromMemo('\nOhne Dich')).toBeNull()
    expect(lineFromMemo('')).toBeNull()
  })

  // ⛔ The server trims the line and holds the untrimmed memo against it: these would be refused.
  it('is nothing where the first line begins or ends with a space', () => {
    expect(lineFromMemo(` ${FIRST}`)).toBeNull()
    expect(lineFromMemo(`${FIRST} `)).toBeNull()
    expect(lineFromMemo(`${FIRST} \nBis bald`)).toBeNull()
    expect(lineFromMemo(` ${FIRST}\nBis bald`)).toBeNull()
  })

  it('is nothing where the first line holds a control character', () => {
    expect(lineFromMemo(`${FIRST}\r\nBis bald`)).toBeNull()
    expect(lineFromMemo('Danke\tfür alles\nBis bald')).toBeNull()
    expect(lineFromMemo('Danke\u2028für alles')).toBeNull()
  })

  it('takes a first line of 80 characters with words after it, and not one of 81', () => {
    expect(lineFromMemo(`${'x'.repeat(80)}\nWorte`)).toBe('x'.repeat(80))
    expect(lineFromMemo(`${'x'.repeat(81)}\nWorte`)).toBeNull()
  })
})
