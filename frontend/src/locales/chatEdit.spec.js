// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import i18n from '@/i18n'

/**
 * The words of a changed message (Bernd, 01.10.2026, E-060) in every language: the menu's entry
 * and its two lines, the word beside the time, the strip over the field, the tick, the lines where
 * a change did not go through, and what the status says. Held against the files and rendered with
 * the wallet's own vue-i18n: a key missing from a language falls back to English without a word,
 * and a placeholder lost in a translation leaves its braces in the sentence.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class (see
 * chatVideoInvite.spec.js).
 */
const here = dirname(fileURLToPath(import.meta.url))
const languages = readdirSync(here)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))
const textsIn = (lang) => JSON.parse(readFileSync(join(here, `${lang}.json`), 'utf8'))

const KEYS = {
  // The menu at one's own message: the entry, and what it changes -- the text, or a video
  // invitation's topic and time.
  edit: [],
  editHint: [],
  editVideoHint: [],
  // Beside the time of a message that was changed.
  edited: [],
  // The strip over the field, its ✕, the tick, the empty field.
  editing: [],
  editCancel: [],
  editSave: [],
  editPlaceholder: [],
  // A change that did not go through: for no reason the wallet names, because the other
  // community's server did not take it, because the message is still on its way there.
  editNotSaved: [],
  editNotConfirmed: ['{name}'],
  editPending: [],
  // For the ear: one's own change went through; somebody else changed a message.
  editSaved: [],
  editedBy: ['{name}'],
}

const firstLetter = (text) => [...text].find((character) => /\p{L}/u.test(character))
const isLowerCase = (letter) => letter === letter.toLowerCase() && letter !== letter.toUpperCase()

describe('the words of a changed message in every language', () => {
  it('is read from every language file', () => {
    expect(languages).toHaveLength(10)
  })

  it.each(languages)('has all thirteen texts, each with its placeholders once, in %s', (lang) => {
    const texts = textsIn(lang).chatThread
    for (const [key, placeholders] of Object.entries(KEYS)) {
      expect(texts[key], `${lang}: chatThread.${key}`).toBeTruthy()
      const found = texts[key].match(/\{[a-z]+\}/g) ?? []
      expect(found.sort(), `${lang}: chatThread.${key}`).toEqual([...placeholders].sort())
    }
  })

  // The group's sentence in the dialog of a changed invitation: it names nobody.
  it.each(languages)('has the group’s sentence about a changed invitation, in %s', (lang) => {
    const text = textsIn(lang).chatGroup.videoEditBody
    expect(text).toBeTruthy()
    expect(text).not.toMatch(/[{}]/)
    expect(text).not.toBe(textsIn(lang).chatThread.videoEditBody)
  })

  /**
   * The other half: the language asked for is the language that came back. "editPlaceholder" and
   * the short words are left to the test above -- two languages may well share one of them
   * ("Editar" is Spanish and Portuguese).
   */
  it('renders each language in its own words', () => {
    for (const key of [
      'editHint',
      'editVideoHint',
      'editing',
      'editCancel',
      'editSave',
      'editNotSaved',
      'editNotConfirmed',
      'editPending',
      'editedBy',
    ]) {
      const rendered = languages.map((lang) =>
        i18n.global.t(`chatThread.${key}`, { name: 'N' }, { locale: lang }),
      )
      expect(new Set(rendered).size, key).toBe(languages.length)
    }
  })

  it.each(languages)('leaves no braces in a rendered sentence, in %s', (lang) => {
    for (const key of Object.keys(KEYS)) {
      const text = i18n.global.t(`chatThread.${key}`, { name: 'Anna-Sonne' }, { locale: lang })
      expect(text, `${lang}: chatThread.${key}`).not.toMatch(/[{}]/)
      expect(text).not.toBe(`chatThread.${key}`)
    }
  })

  /**
   * The word beside the time stands in the middle of a line ("bearbeitet · 14:30"), and the two
   * lines under "Bearbeiten" go on from it as the lines under "Weiterleiten" and "Text kopieren"
   * do: they begin small, in every language -- but for a German line that begins with a noun
   * ("Thema und Termin ändern").
   */
  it.each(languages)(
    'begins the word beside the time and the menu’s lines small, in %s',
    (lang) => {
      const texts = textsIn(lang).chatThread
      const keys = ['edited', 'editHint', 'forwardHint', 'copyTextHint']
      if (lang !== 'de') keys.push('editVideoHint')
      for (const key of keys) {
        expect(isLowerCase(firstLetter(texts[key])), `${lang}: chatThread.${key}`).toBe(true)
      }
    },
  )

  /**
   * "Not changed" promises what "not sent" promises, in the same words: the text stays in the
   * field. The second sentence of the two is one and the same, in every language.
   */
  it.each(languages)('promises that the text stays as "not sent" does, in %s', (lang) => {
    const texts = textsIn(lang).chatThread
    const second = (text) => text.slice(text.indexOf('. ') + 2)

    expect(second(texts.editNotSaved)).toBe(second(texts.notSent))
    expect(second(texts.editNotSaved).length).toBeGreaterThan(5)
    expect(texts.editNotSaved).not.toBe(texts.notSent)
  })

  // The name of the other person is dropped in as it is: the sentence reads with any of them.
  it.each(languages)(
    'names the other person once where their community did not confirm, in %s',
    (lang) => {
      for (const name of ['Anna-Sonne', 'Frank-Tisch', 'x']) {
        const text = i18n.global.t('chatThread.editNotConfirmed', { name }, { locale: lang })
        expect(text.split(name).length - 1, text).toBe(1)
      }
    },
  )
})
