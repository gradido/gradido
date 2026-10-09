// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { createI18n } from 'vue-i18n'
import de from './de.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'
import nl from './nl.json'
// Not `it`: that is the test function here.
import itLocale from './it.json'
import pt from './pt.json'
import ru from './ru.json'
import el from './el.json'
import tr from './tr.json'

/**
 * The marks beside a person say whom they are about (Bernd, 09.10.2026) -- the pin, the camera,
 * the bell and the heart --, and the list of the find map names a shown contact. In the wallet's
 * ten languages.
 *
 * The component specs stand a `$t` in that echoes the key, so they prove that a name is handed
 * over and not that any of the ten sentences carries it. Here the sentences are rendered the way
 * the wallet renders them, with a real user name, and held to what such a name must not get
 * wrong: a placeholder left standing, a person not named, a language that silently speaks
 * English, two states of one mark that read alike.
 */
const LOCALES = { de, en, es, fr, nl, it: itLocale, pt, ru, el, tr }
const LANGUAGES = Object.keys(LOCALES)

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: LOCALES })
const say = (locale, key, named) => i18n.global.t(key, named ?? {}, { locale })

// A user name as the wallet allows it: ASCII, with a hyphen, and one that begins with a digit.
const NAMES = ['Anna-Sonne', '7oaks']

/** The marks that name a person, each with the words it had before it named anybody. */
const PERSON_MARKS = [
  'contacts.showOnMap',
  'chatThread.videoCall',
  'chatThread.muteOn',
  'contacts.heart.add',
  'contacts.heart.remove',
]

describe('the marks beside a person, in ten languages', () => {
  it.each(LANGUAGES)('names the person in every mark (%s)', (locale) => {
    for (const key of PERSON_MARKS) {
      for (const name of NAMES) {
        const text = say(locale, key, { name })
        expect(text, `${locale} ${key}`).toContain(name)
        expect(text.split(name), `${locale} ${key}: the name once`).toHaveLength(2)
        expect(text, `${locale} ${key}: a placeholder left standing`).not.toMatch(/[{}]/)
        // More than the bare name: the mark says what a tap does.
        expect(text.replace(name, '').trim().length, `${locale} ${key}`).toBeGreaterThan(3)
      }
    }
  })

  it.each(LANGUAGES)('tells the two states of the heart apart (%s)', (locale) => {
    const add = say(locale, 'contacts.heart.add', { name: 'Anna-Sonne' })
    const remove = say(locale, 'contacts.heart.remove', { name: 'Anna-Sonne' })

    expect(add).not.toBe(remove)
  })

  it.each(LANGUAGES)(
    'tells the two states of the bell apart, both about the person (%s)',
    (locale) => {
      const on = say(locale, 'chatThread.muteOn', { name: 'Anna-Sonne' })
      const off = say(locale, 'chatThread.muteOff', { name: 'Anna-Sonne' })

      expect(on).not.toBe(off)
      expect(off).toContain('Anna-Sonne')
    },
  )

  // A group's title is free text: any script, with spaces.
  it.each(LANGUAGES)('names the group in its bell, in both states (%s)', (locale) => {
    for (const key of ['chatGroup.muteOn', 'chatGroup.muteOff']) {
      const text = say(locale, key, { name: 'Gradido-Café Берлин' })
      expect(text, `${locale} ${key}`).toContain('Gradido-Café Берлин')
      expect(text, `${locale} ${key}`).not.toMatch(/[{}]/)
    }
    expect(say(locale, 'chatGroup.muteOn', { name: 'Café' })).not.toBe(
      say(locale, 'chatThread.muteOn', { name: 'Café' }),
    )
  })

  it.each(LANGUAGES.filter((locale) => locale !== 'en'))(
    'does not silently speak English (%s)',
    (locale) => {
      for (const key of [...PERSON_MARKS, 'chatGroup.muteOn']) {
        expect(say(locale, key, { name: 'Anna-Sonne' }), `${locale} ${key}`).not.toBe(
          say('en', key, { name: 'Anna-Sonne' }),
        )
      }
    },
  )
})

describe('a shown contact in the list of the find map, in ten languages', () => {
  it.each(LANGUAGES)('has a heading and the words "from your home" (%s)', (locale) => {
    for (const key of ['matching.list.contactHeading', 'matching.list.fromHome']) {
      const text = say(locale, key)
      expect(text.trim().length, `${locale} ${key}`).toBeGreaterThan(2)
      expect(text, `${locale} ${key}`).not.toMatch(/[{}]/)
      // No key shown in place of a sentence.
      expect(text, `${locale} ${key}`).not.toBe(key)
    }
    // The heading is no other heading of the list.
    expect(say(locale, 'matching.list.contactHeading')).not.toBe(
      say(locale, 'matching.list.matchesHeading'),
    )
  })

  it.each(LANGUAGES.filter((locale) => locale !== 'en'))(
    'does not silently speak English there (%s)',
    (locale) => {
      for (const key of ['matching.list.contactHeading', 'matching.list.fromHome']) {
        expect(say(locale, key), `${locale} ${key}`).not.toBe(say('en', key))
      }
    },
  )

  // The line that names where the search stands was written for places and for "your home". On
  // such a visit it carries a user name -- which cannot take an ending, and must not read as a
  // place that needs one (Turkish: "{place} çevresinde" asks a genitive of a person).
  it.each(LANGUAGES)(
    'names the centre of the search with a user name, a place and the home alike (%s)',
    (locale) => {
      const home = say(locale, 'matching.map.centreHome')
      for (const place of ['Anna-Sonne', 'Künzelsau', home]) {
        const near = say(locale, 'matching.list.centeredOn', { place })
        const wide = say(locale, 'matching.list.centeredOnFern', { place, km: 500 })
        expect(near, locale).toContain(place)
        expect(wide, locale).toContain(place)
        expect(wide, locale).toContain('500')
        expect(near + wide, locale).not.toMatch(/[{}]/)
      }
    },
  )

  it('names the centre with a colon in Turkish, so that a name needs no ending', () => {
    expect(say('tr', 'matching.list.centeredOn', { place: 'Anna-Sonne' })).toBe(
      'Arama merkezi: Anna-Sonne',
    )
    expect(
      say('tr', 'matching.list.centeredOn', { place: say('tr', 'matching.map.centreHome') }),
    ).toBe('Arama merkezi: evin')
  })

  // "evinden" is "from your home" and "from their home" alike, under somebody else's name.
  it('says whose home it is in Turkish', () => {
    expect(say('tr', 'matching.list.fromHome')).toBe('senin evinden')
  })
})
