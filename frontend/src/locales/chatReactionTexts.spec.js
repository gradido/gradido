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
 * The words of the reactions to chat messages (Bernd, 11.10.2026) in the wallet's ten languages,
 * rendered by the real vue-i18n. What a count of keys cannot hold: the sentences that name an
 * emoji carry it; setting a reaction and taking it back are told apart; and every language says
 * them in words of its own -- a language that fell back to English would pass everything else.
 */
const messages = { de, el, en, es, fr, it: itLocale, nl, pt, ru, tr }
const LANGUAGES = Object.keys(messages)
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages })
const t = (key, locale, values = {}) => i18n.global.t(key, values, { locale })
const words = (key, locale, values) => t(`chatThread.${key}`, locale, values)

const KEYS = [
  'react',
  'reactWith',
  'reactTakeBack',
  'reactMore',
  'reacted',
  'reactionTakenBack',
  'reactionFailed',
  'reactionsLead',
  'reactionMine',
]
/** The sentences that name the emoji they are about. */
const WITH_EMOJI = ['reactWith', 'reactTakeBack', 'reacted']

describe('the words of the reactions', () => {
  it('are there in ten languages', () => {
    expect(LANGUAGES).toHaveLength(10)
  })

  describe.each(LANGUAGES)('%s', (language) => {
    it('has all nine of its own', () => {
      for (const key of KEYS) {
        expect(typeof messages[language].chatThread?.[key], key).toBe('string')
        expect(messages[language].chatThread[key].trim(), key).not.toBe('')
      }
    })

    it('names the emoji where a sentence is about one, with words around it', () => {
      for (const key of WITH_EMOJI) {
        const said = words(key, language, { emoji: '🙏' })
        expect(said, key).toContain('🙏')
        expect(said, key).not.toContain('{')
        expect(said.replace('🙏', '').trim().length, key).toBeGreaterThan(3)
      }
    })

    // ⛔ The two hints of one button, for the pointer that rests on it: which of them is read
    // says whether a press sets the reaction or takes it back.
    it('tells setting a reaction from taking it back, and from having set it', () => {
      const said = WITH_EMOJI.map((key) => words(key, language, { emoji: '🙏' }))
      expect(new Set(said).size).toBe(3)
      expect(t('chatThread.reacted', language, { emoji: '🙏' })).not.toBe(
        t('chatThread.reactionTakenBack', language),
      )
    })

    it('says the short ones in a word or two, without a place for an emoji', () => {
      for (const key of [
        'react',
        'reactMore',
        'reactionTakenBack',
        'reactionsLead',
        'reactionMine',
      ]) {
        expect(messages[language].chatThread[key], key).not.toContain('{')
      }
      // The lead is read out before the emoji: it ends in a colon, a pause for the ear.
      expect(t('chatThread.reactionsLead', language).trim().endsWith(':')).toBe(true)
    })

    it('ends the sentence about a failure as a sentence', () => {
      expect(t('chatThread.reactionFailed', language).trim()).toMatch(/[.!]$/)
    })
  })

  it.each(LANGUAGES.filter((language) => language !== 'en'))(
    '%s says them in words of its own, not in English',
    (language) => {
      for (const key of KEYS) {
        expect(messages[language].chatThread[key], key).not.toBe(en.chatThread[key])
      }
    },
  )
})
