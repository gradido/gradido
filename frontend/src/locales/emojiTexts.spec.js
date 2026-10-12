// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import de from './de.json'
import el from './el.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'
import itLocale from './it.json'
import nl from './nl.json'
import pt from './pt.json'
import ru from './ru.json'
import tr from './tr.json'

/**
 * The words of the emoji choice (EmojiPicker) in the wallet's ten languages. What a count of keys
 * cannot hold: the keys of a keyboard are written as they are printed on it, in every language;
 * the sentence for the ear carries the emoji; and every language says it in words of its own --
 * a language that fell back to English would pass everything else.
 */
const messages = { de, el, en, es, fr, it: itLocale, nl, pt, ru, tr }
const LANGUAGES = Object.keys(messages)
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages })
const t = (key, locale, values = {}) => i18n.global.t(key, values, { locale })

describe('the words of the emoji choice', () => {
  it('are there in ten languages', () => {
    expect(LANGUAGES).toHaveLength(10)
  })

  describe.each(LANGUAGES)('%s', (language) => {
    it('has all five of its own', () => {
      for (const key of ['insert', 'choice', 'inserted', 'moreOnMac', 'moreOnWindows']) {
        expect(typeof messages[language].emoji?.[key], key).toBe('string')
        expect(messages[language].emoji[key].trim(), key).not.toBe('')
      }
    })

    it('names the Mac’s keys as they are printed on the keyboard', () => {
      expect(t('emoji.moreOnMac', language)).toContain('ctrl + cmd + ')
    })

    it('names Windows’ keys, and shows the full stop that is meant', () => {
      const words = t('emoji.moreOnWindows', language)
      expect(words).toContain('Windows')
      expect(words).toContain(' + ')
      expect(words.endsWith('(.)')).toBe(true)
    })

    it('says for the ear which emoji went in', () => {
      const words = t('emoji.inserted', language, { emoji: '🙏' })
      expect(words).toContain('🙏')
      // The emoji and a word about it -- not the emoji alone, which the press already was.
      expect(words.replace('🙏', '').trim().length).toBeGreaterThan(3)
    })
  })

  it.each(LANGUAGES.filter((language) => language !== 'en'))(
    '%s says the sentences in words of its own, not in English',
    (language) => {
      for (const key of ['insert', 'inserted', 'moreOnMac', 'moreOnWindows']) {
        expect(messages[language].emoji[key], key).not.toBe(en.emoji[key])
      }
    },
  )
})
