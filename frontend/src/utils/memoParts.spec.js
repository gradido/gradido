// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { memoParts } from './memoParts'

describe('memoParts', () => {
  it('leaves a memo without addresses as one piece of text', () => {
    expect(memoParts('Danke für den Kaffee')).toEqual([
      { type: 'text', value: 'Danke für den Kaffee' },
    ])
  })

  // ⛔ The reason this file exists: markup in a memo is text like any other -- the sender
  // wrote it, and nothing here may turn it into an element.
  it('keeps markup as text, character for character', () => {
    const memo = 'hi <b>there</b> <img src="x" data-probe>'
    expect(memoParts(memo)).toEqual([{ type: 'text', value: memo }])
  })

  it('cuts out a web address, with the text around it intact', () => {
    expect(memoParts('see https://gradido.net/de/ for more')).toEqual([
      { type: 'text', value: 'see ' },
      { type: 'url', value: 'https://gradido.net/de/' },
      { type: 'text', value: ' for more' },
    ])
  })

  it('cuts out an e-mail address', () => {
    expect(memoParts('write to info@gradido.net please')).toEqual([
      { type: 'text', value: 'write to ' },
      { type: 'email', value: 'info@gradido.net' },
      { type: 'text', value: ' please' },
    ])
  })

  // The old code ran its e-mail pattern over the links it had just built, and cut an
  // address out of the middle of one.
  it('does not cut an address out of a web address that contains one', () => {
    expect(memoParts('https://example.org/?to=info@gradido.net')).toEqual([
      { type: 'url', value: 'https://example.org/?to=info@gradido.net' },
    ])
  })

  // The old pattern wrote the ending as `[A-Z|a-z]` and let a `|` through (coderabbit, #3884).
  it('makes no mail link of an address with a stray character in its ending', () => {
    expect(memoParts('user@example.c|m')).toEqual([{ type: 'text', value: 'user@example.c|m' }])
  })

  it('makes no link of anything but http, https and ftp', () => {
    expect(memoParts('javascript://alert')).toEqual([{ type: 'text', value: 'javascript://alert' }])
  })

  it('has nothing to show for no memo', () => {
    expect(memoParts('')).toEqual([])
    expect(memoParts(undefined)).toEqual([])
  })

  it('finds several addresses in one text, and one that follows another without room', () => {
    expect(memoParts('anna@example.org, bernd@example.org')).toEqual([
      { type: 'email', value: 'anna@example.org' },
      { type: 'text', value: ', ' },
      { type: 'email', value: 'bernd@example.org' },
    ])
    // A sign before the first letter is not part of the address: it starts where a word does.
    expect(memoParts('(-anna@example.org)')).toEqual([
      { type: 'text', value: '(-' },
      { type: 'email', value: 'anna@example.org' },
      { type: 'text', value: ')' },
    ])
  })

  /**
   * E-mail addresses are found run by run, not by trying the pattern at every sign (see
   * `cutAtEmails`). What is found has to be what the pattern finds -- the mail's copy of it in
   * `core` still looks for it that way, and a text is to read the same in both. Held against the
   * pattern itself, read from the source as `core` reads it: 20,000 made-up texts of the signs
   * the pattern knows and the ones around them, the same at every run.
   */
  describe('finds e-mail addresses where the pattern does', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'memoParts.js'),
      'utf8',
    )
    const [, body, flags] = source.match(/^const EMAIL_PATTERN = \/(.+)\/([a-z]*)\r?$/m) ?? []

    /** A text cut at the pattern's matches, as `matchAll` gives them. */
    const byThePattern = (text) => {
      const parts = []
      let last = 0
      for (const match of text.matchAll(new RegExp(body, flags))) {
        if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) })
        parts.push({ type: 'email', value: match[0] })
        last = match.index + match[0].length
      }
      if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })
      return parts
    }

    it('in texts made up of its signs', () => {
      // The fixture has to prove itself: no pattern read would compare with nothing.
      expect(body).toBeDefined()
      const SIGNS = [...'abZ7_..-%+@@ \näé€(),:/"<>|', '😀', '\u00a0']
      const WORDS = ['de', '.de', '.com', 'x@y.de', 'anna@example.org', '@b.de', 'a.b@c', '.c']
      let seed = 20261012
      const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0
        return seed / 4294967296
      }
      const pick = (list) => list[Math.floor(random() * list.length)]
      let withAddress = 0
      for (let n = 0; n < 20000; n += 1) {
        let text = ''
        const count = 1 + Math.floor(random() * 24)
        for (let i = 0; i < count; i += 1) text += random() < 0.75 ? pick(SIGNS) : pick(WORDS)
        const expected = byThePattern(text)
        expect(memoParts(text), JSON.stringify(text)).toEqual(expected)
        if (expected.some((part) => part.type === 'email')) withAddress += 1
      }
      expect(withAddress).toBeGreaterThan(2000)
    })

    // Where an address ends in the middle of a run of such signs, the pattern goes on from
    // there -- and so a second one may begin with a dot. Odd, and the same in both.
    it.each(['a@b.de.c@d.de', '.anna@b.de', '..@b.de', 'a@b.de2c@d.de', 'bär@x.de', 'a@b.de_x'])(
      'in %j',
      (text) => {
        expect(memoParts(text)).toEqual(byThePattern(text))
      },
    )
  })

  // Tried at every sign, the pattern took the square of such a run's length: 0.4 seconds for
  // 20,000 characters, and this one would take most of a minute.
  it.each([
    ['letters and dots', 'a.'.repeat(100000)],
    ['letters and dots before an @ that no address follows', `${'a.'.repeat(100000)}@`],
    ['an @ before letters and dots', `x@${'a.'.repeat(100000)}`],
  ])('reads a long run of %s in a moment', (name, text) => {
    const began = performance.now()
    expect(memoParts(text)).toEqual([{ type: 'text', value: text }])
    expect(performance.now() - began).toBeLessThan(1000)
  })
})
