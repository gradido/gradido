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
 * The switch for the chat window's size (E-077) has no word beside it: its name is all a screen
 * reader gets, and the tooltip all a mouse gets. The name says what a press does and follows the
 * state -- so the two names must be there in each of the wallet's ten languages, in that
 * language's own words, and must not read alike.
 *
 * The component's spec stands a `t` in that echoes the key: it proves that a name is handed over,
 * not that any language has one.
 */
const LOCALES = { de, en, es, fr, nl, it: itLocale, pt, ru, el, tr }
const LANGUAGES = Object.keys(LOCALES)

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: LOCALES })
const say = (locale, key) => i18n.global.t(key, {}, { locale })

const NAMES = ['chatWindow.enlarge', 'chatWindow.reduce']

describe("the names of the chat window's size switch, in ten languages", () => {
  it('covers the ten languages of the wallet', () => {
    expect(LANGUAGES).toHaveLength(10)
  })

  it.each(LANGUAGES)('%s has both names, as words of its own', (locale) => {
    for (const key of NAMES) {
      const name = say(locale, key)
      // A missing key comes back as the key itself.
      expect(name, key).not.toBe(key)
      expect(name.trim(), key).toBe(name)
      expect(name.length, key).toBeGreaterThan(3)
      // Nothing to fill in: the name stands as it is written.
      expect(name, key).not.toMatch(/[{}|]/)
    }
  })

  it.each(LANGUAGES)('%s names the two directions differently', (locale) => {
    expect(say(locale, 'chatWindow.enlarge')).not.toBe(say(locale, 'chatWindow.reduce'))
  })

  // A language that silently speaks English would pass everything above.
  it.each(LANGUAGES.filter((locale) => locale !== 'en'))('%s does not speak English', (locale) => {
    for (const key of NAMES) {
      expect(LOCALES[locale].chatWindow?.[key.split('.')[1]], key).toBeTruthy()
      expect(say(locale, key), key).not.toBe(say('en', key))
    }
  })

  // The two names in German, as Bernd reads them.
  it('says it in German', () => {
    expect(say('de', 'chatWindow.enlarge')).toBe('Fenster vergrößern')
    expect(say('de', 'chatWindow.reduce')).toBe('Fenster verkleinern')
  })
})
