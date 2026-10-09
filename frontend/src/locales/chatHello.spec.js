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
import { chatHelloText } from '@/utils/chatHelloText'

/**
 * The first word from the map (E-065, E-068) in the wallet's ten languages: what stands in the
 * field of the profile window, and what the window says once it has gone out.
 *
 * The words are sent in the member's name to somebody they do not know yet, mostly unchanged --
 * so they are rendered here the way the wallet renders them, with real names, and held to what
 * such a message must not get wrong: a placeholder left standing, a form that guesses whether
 * the writer or the reader is a woman or a man, a language that silently speaks English.
 */
const LOCALES = { de, en, es, fr, nl, it: itLocale, pt, ru, el, tr }
const LANGUAGES = Object.keys(LOCALES)
const KEYS = [
  'found',
  'distanceKm',
  'distanceNear',
  'question',
  'sent',
  'sentMailed',
  'toConversation',
]

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: LOCALES })
const tIn = (locale) => (key, named) => i18n.global.t(key, named ?? {}, { locale })
const hello = (locale, over = {}) =>
  chatHelloText(tIn(locale), {
    name: 'Jens',
    signature: 'Maren',
    distance: { km: 9 },
    locale,
    ...over,
  })

const placeholders = (text) => (text.match(/\{[^}]*\}/g) ?? []).sort()

describe('the first word from the map, in ten languages', () => {
  it('speaks all ten', () => {
    expect(LANGUAGES).toHaveLength(10)
  })

  it.each(LANGUAGES)('%s has the seven texts, and nothing else under the name', (language) => {
    const texts = LOCALES[language].chatHello
    expect(Object.keys(texts).sort()).toEqual([...KEYS].sort())
    for (const key of KEYS) expect(texts[key].trim(), key).not.toBe('')
  })

  it.each(LANGUAGES)(
    '%s carries the name and the figure where the wallet puts them',
    (language) => {
      const texts = LOCALES[language].chatHello
      expect(placeholders(texts.found)).toEqual(['{name}'])
      expect(placeholders(texts.distanceKm)).toEqual(['{n}'])
      expect(placeholders(texts.sentMailed)).toEqual(['{name}'])
      for (const key of ['distanceNear', 'question', 'sent', 'toConversation']) {
        expect(placeholders(texts[key]), key).toEqual([])
      }
    },
  )

  it("says Bernd's sentence, word for word, in German", () => {
    expect(hello('de')).toBe(
      'Hallo Jens, ich habe Dich auf der Gradido-Karte gefunden. ' +
        'Wir wohnen etwa 9 km voneinander entfernt. Magst Du Hallo zurücksagen? Maren',
    )
    expect(hello('de', { distance: { near: true } })).toBe(
      'Hallo Jens, ich habe Dich auf der Gradido-Karte gefunden. ' +
        'Wir wohnen nicht weit voneinander. Magst Du Hallo zurücksagen? Maren',
    )
    expect(hello('de', { distance: null })).toBe(
      'Hallo Jens, ich habe Dich auf der Gradido-Karte gefunden. Magst Du Hallo zurücksagen? Maren',
    )
  })

  it('says it in English', () => {
    expect(hello('en')).toBe(
      'Hello Jens, I found you on the Gradido map. We live about 9 km apart. ' +
        'Would you like to say hello back? Maren',
    )
  })

  it.each(LANGUAGES)('%s: the words as they are sent leave nothing standing', (language) => {
    for (const distance of [{ km: 9 }, { near: true }, null]) {
      const words = hello(language, { distance })
      expect(words, 'a placeholder').not.toMatch(/[{}]/)
      expect(words, 'a key instead of a text').not.toContain('chatHello.')
      expect(words, 'two spaces').not.toMatch(/\s{2,}/)
      expect(words).toBe(words.trim())
      expect(words.startsWith(tIn(language)('chatHello.found', { name: 'Jens' }))).toBe(true)
      expect(words.endsWith(' Maren')).toBe(true)
      expect(words.split('Jens')).toHaveLength(2)
    }
    // The figure stands in the words that name it, and in no others.
    expect(hello(language)).toContain('9')
    expect(hello(language, { distance: { near: true } })).not.toMatch(/\d/)
    expect(hello(language, { distance: null })).not.toMatch(/\d/)
  })

  it.each(LANGUAGES)('%s ends with the question where nobody signs', (language) => {
    const words = hello(language, { signature: '' })
    // Greek asks with a semicolon.
    expect(words).toMatch(language === 'el' ? /;$/ : /\?$/)
  })

  // Both are written to somebody the wallet knows nothing about, by somebody it knows nothing
  // about: no form may depend on either being a woman or a man, and none may offer both.
  it.each(LANGUAGES)('%s guesses nobody a woman or a man', (language) => {
    for (const key of KEYS) {
      expect(LOCALES[language].chatHello[key], key).not.toMatch(/[()/]/)
    }
  })

  it('writes to a stranger politely in Russian, as the whole file does', () => {
    const informal = /(?<![а-яё])(ты|тебя|тебе|тобой|твой|твоя|твоё|твои)(?![а-яё])/i
    for (const key of KEYS) expect(ru.chatHello[key], key).not.toMatch(informal)
    expect(ru.chatHello.found).toContain('Вам')
    expect(ru.chatHello.question).toMatch(/^Хотите /)
  })

  it.each(LANGUAGES.filter((language) => language !== 'en'))(
    '%s says it in its own words, not in English',
    (language) => {
      for (const key of KEYS) {
        expect(LOCALES[language].chatHello[key], key).not.toBe(en.chatHello[key])
      }
    },
  )

  it.each(LANGUAGES)('%s greets as the first word from a group does', (language) => {
    // "Hallo {name}" (E-055): one greeting for both first words.
    expect(
      LOCALES[language].chatHello.found.startsWith(
        LOCALES[language].chatThread.firstContactGreeting,
      ),
    ).toBe(true)
  })

  it.each(LANGUAGES)("%s names the map as Gradido's", (language) => {
    expect(LOCALES[language].chatHello.found).toContain('Gradido')
  })

  it.each(LANGUAGES)('%s writes kilometres as the list of the map does', (language) => {
    // "etwa {n} km": the unit after the figure, as matching.list.kmEtwa writes it.
    const unit = LOCALES[language].matching.list.kmEtwa.split('{n}')[1].trim()
    expect(unit).not.toBe('')
    expect(LOCALES[language].chatHello.distanceKm).toContain(`{n} ${unit}`)
  })

  it.each(LANGUAGES)('%s says "sent" with the thread\'s own word, twice the same', (language) => {
    const texts = LOCALES[language].chatHello
    expect(texts.sent).toBe(`${LOCALES[language].chatThread.sent}.`)
    expect(texts.sentMailed.startsWith(`${texts.sent} `)).toBe(true)
    // After the name, in whatever case the language puts it, the sentence goes on or ends.
    expect(tIn(language)('chatHello.sentMailed', { name: 'Jens' })).toMatch(/Jens[ .]/)
  })
})
