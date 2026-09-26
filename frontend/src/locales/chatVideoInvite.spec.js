// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import i18n from '@/i18n'
import { chatTextParts } from '@/utils/chatTextParts'

/**
 * The invitation to a video call (V2) is an ordinary chat message, written in the sender's
 * language: `chatThread.videoInvite`, with who runs the server (`{operator}`) and the room's
 * address (`{url}`). Nothing on the way checks what a translation does to it, so this does:
 *
 * - The address stands at the very END, one space before it and nothing after -- the thread's
 *   link finder (`chatTextParts`) takes it whole there. A word or a full stop after it would be
 *   cut into the link or left dangling.
 * - Who runs the server is a name as the server's list writes it, dropped in as it is:
 *   "Weimarnetz e. V.", "meerfarbig GmbH & Co. KG", or a host where the list names nobody. A
 *   construction that ends a sentence with it gives "e. V.." -- it did in Russian, first.
 *
 * Rendered with the wallet's own vue-i18n and its own link finder, not with a pattern held
 * against the source: the source is what the translations are, the rendering is what arrives.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
 * instance of it away as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))
const languages = readdirSync(here)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))
const chatThreadIn = (lang) =>
  JSON.parse(readFileSync(join(here, `${lang}.json`), 'utf8')).chatThread ?? {}

const KEYS = {
  videoCall: ['{name}'],
  videoAskTitle: ['{name}'],
  videoAskBody: ['{name}'],
  videoAskFirst: ['{name}'],
  videoStart: [],
  videoInvite: ['{operator}', '{url}'],
  videoNoServer: [],
  videoNotSent: [],
  videoOpen: [],
}

/** Operators as the server's list writes them (V1, ChatVideoServers.default.ts), and a host. */
const OPERATORS = [
  'Freifunk München (Freie Netze München e. V.)',
  'Weimarnetz e. V.',
  'meerfarbig GmbH & Co. KG',
  'Chaos Computer Club Düsseldorf / Chaosdorf e. V.',
  'meet.ffmuc.net',
]
const URL_OF_A_ROOM = 'https://meet.ffmuc.net/k7m2x9q4t8wz'

describe('the video call in every language', () => {
  it('is read from every language file', () => {
    expect(languages).toHaveLength(10)
  })

  it.each(languages)('has all nine texts, each with its placeholders once, in %s', (lang) => {
    const texts = chatThreadIn(lang)
    for (const [key, placeholders] of Object.entries(KEYS)) {
      expect(texts[key], `${lang}: chatThread.${key}`).toBeTruthy()
      const found = texts[key].match(/\{[a-z]+\}/g) ?? []
      expect(found.sort(), `${lang}: chatThread.${key}`).toEqual([...placeholders].sort())
    }
  })

  it.each(languages)('ends the invitation with the address, one space before it, in %s', (lang) => {
    expect(chatThreadIn(lang).videoInvite).toMatch(/\S \{url\}$/)
  })

  it.each(languages)(
    'hands the link finder the address whole, as the last piece, in %s',
    (lang) => {
      for (const operator of OPERATORS) {
        const text = i18n.global.t(
          'chatThread.videoInvite',
          { operator, url: URL_OF_A_ROOM },
          { locale: lang },
        )
        expect(text.endsWith(` ${URL_OF_A_ROOM}`), text).toBe(true)
        expect(text).toContain(operator)
        const parts = chatTextParts(text)
        expect(parts.at(-1)).toEqual({ type: 'url', value: URL_OF_A_ROOM })
        expect(parts.filter((part) => part.type === 'url')).toHaveLength(1)
      }
    },
  )

  it.each(languages)('puts no second full stop after an operator ending in one, in %s', (lang) => {
    const text = i18n.global.t(
      'chatThread.videoInvite',
      { operator: 'Weimarnetz e. V.', url: URL_OF_A_ROOM },
      { locale: lang },
    )
    expect(text).not.toMatch(/\.\s*\./)
  })

  // The other half: the language asked for is the language that came back -- a lookup that fell
  // back to English would pass every test above for every language.
  it('renders each language in its own words', () => {
    const rendered = languages.map((lang) =>
      i18n.global.t(
        'chatThread.videoInvite',
        { operator: 'X', url: URL_OF_A_ROOM },
        { locale: lang },
      ),
    )
    expect(new Set(rendered).size).toBe(languages.length)
  })
})
