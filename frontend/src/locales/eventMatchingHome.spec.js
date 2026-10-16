// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import i18n from '@/i18n'

/**
 * The invitation onto the map after an event link (KA-015, EventMatchingHomeInvitation):
 * `eventMatching.home.title` and `eventMatching.home.text`, with the whole sentence of the link
 * (`{sentence}`, "Ich liebe Kongress Frequency Healing") quoted in it.
 *
 * Its second half is the second half of the tile on the overview (`matching.invitation.text`),
 * word for word in every language -- "Du entscheidest, wie genau: „Ungefähr“ …" -- so the two
 * places that invite a member onto the map promise the same. Nothing else holds the two
 * together; a correction in one would otherwise leave the other saying the old words.
 *
 * Rendered with the wallet's own vue-i18n: the source is what the translations are, the
 * rendering is what arrives.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
 * instance of it away as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))
const languages = readdirSync(here)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))
const messagesOf = (lang) => JSON.parse(readFileSync(join(here, `${lang}.json`), 'utf8'))

// What follows the tile's first sentence ("Setz Dein Zuhause auf die Karte, dann …. ").
const tileTail = (lang) => {
  const tile = messagesOf(lang).matching.invitation.text
  return tile.slice(tile.indexOf('. ') + 2)
}

describe('eventMatching.home', () => {
  // The fixture proves itself: all ten languages of the wallet are read.
  it('is read in all ten languages', () => {
    expect(languages.sort()).toEqual(['de', 'el', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr'])
  })

  it.each(languages)('%s: has a title and a text in its own words', (lang) => {
    const { title, text } = messagesOf(lang).eventMatching.home
    expect(title.trim()).not.toBe('')
    expect(text.trim()).not.toBe('')
    if (lang !== 'en') {
      const english = messagesOf('en').eventMatching.home
      expect(title).not.toBe(english.title)
      expect(text).not.toBe(english.text)
    }
  })

  it.each(languages)('%s: names the sentence of the link once', (lang) => {
    const { text } = messagesOf(lang).eventMatching.home
    expect(text.split('{sentence}')).toHaveLength(2)
  })

  it.each(languages)(
    '%s: ends with the promise of the tile on the overview, word for word',
    (lang) => {
      const tail = tileTail(lang)
      // The fixture proves itself: the tile has a first sentence, and a promise after it.
      expect(tail.length).toBeGreaterThan(40)
      expect(messagesOf(lang).eventMatching.home.text.endsWith(` ${tail}`)).toBe(true)
    },
  )

  it.each(languages)(
    '%s: renders a long sentence with an article whole, and nothing left open',
    (lang) => {
      const sentence = `${messagesOf(lang).matching.type.interesse.prefix} den Phönix-Kongress 2026 & Co.`
      const shown = i18n.global.t('eventMatching.home.text', { sentence }, { locale: lang })
      expect(shown).toContain(sentence)
      expect(shown).not.toMatch(/\{[a-z]+\}/)
    },
  )
})
