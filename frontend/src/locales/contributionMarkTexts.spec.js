// AI-GENERATED — not an architecture reference
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The words of the mark at "Schöpfen" (Bernd, 16.11.2026): the sentence a screen reader hears
// after the menu's word, and the line of the phone's menu opener. The lint counts only keys that
// stand in the code as a literal, so this holds them in every language file.
const here = dirname(fileURLToPath(import.meta.url))
const languages = readdirSync(here).filter((file) => file.endsWith('.json'))
const read = (file) => JSON.parse(readFileSync(join(here, file), 'utf8'))

describe('the texts of the mark at "Schöpfen"', () => {
  it('are read from every language file', () => {
    expect(languages).toHaveLength(10)
  })

  // in the forms the chat's mark counts in, language by language (utils/pluralRules)
  it.each(languages)(
    'count the contributions with a question back as the chat counts, in %s',
    (file) => {
      const texts = read(file)
      const forms = (sentence) => sentence.split('|').length
      expect(forms(texts.contribution.badge)).toBe(forms(texts.chatThread.unreadBadge))
      expect(texts.contribution.badge).toContain('{n}')
    },
  )

  it.each(languages)('name the question back at the menu opener, in %s', (file) => {
    expect(read(file).contribution.dot).toMatch(/\S/)
  })
})
