// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
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
 * The two words of the ticks behind one's own message (Chat E-093), "Zugestellt" and "Gelesen", in
 * the wallet's ten languages: they are the ticks' name for the ear and under the pointer. What a
 * count of keys cannot hold: that each language says both in words of its own, that the two are
 * not the same word, and that nothing is left to fill in.
 */
const messages = { de, el, en, es, fr, it: itLocale, nl, pt, ru, tr }
const LANGUAGES = Object.keys(messages)

describe('the words of the ticks', () => {
  it('are there in ten languages', () => {
    expect(LANGUAGES).toHaveLength(10)
  })

  describe.each(LANGUAGES)('%s', (language) => {
    const { receiptDelivered, receiptRead } = messages[language].chatThread

    it('says delivered and read, not empty, and not the same', () => {
      expect(typeof receiptDelivered).toBe('string')
      expect(typeof receiptRead).toBe('string')
      expect(receiptDelivered.trim()).not.toBe('')
      expect(receiptRead.trim()).not.toBe('')
      expect(receiptRead).not.toBe(receiptDelivered)
    })

    it('leaves nothing to fill in', () => {
      expect(`${receiptDelivered}${receiptRead}`).not.toMatch(/[{}|@]/)
    })

    // A language that fell back to the English words would pass everything above.
    it('says them in words of its own', () => {
      if (language === 'en') return
      expect(receiptDelivered).not.toBe(en.chatThread.receiptDelivered)
      expect(receiptRead).not.toBe(en.chatThread.receiptRead)
    })
  })
})
