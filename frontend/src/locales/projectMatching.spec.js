// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * The texts of the page on which a host builds a link (Projekt-Matching). Its field is filled
 * with a word (`eventMatching.builder.sentenceDefault`), and the line under the field says that
 * this word may stay (`sentenceHint`). Two values in ten files that have to name the same word,
 * and nothing else holds them together.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
 * instance of it away as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))
const languages = readdirSync(here)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))
const builderOf = (lang) =>
  JSON.parse(readFileSync(join(here, `${lang}.json`), 'utf8')).eventMatching.builder

describe('eventMatching.builder', () => {
  // The fixture proves itself: all ten languages of the wallet are read.
  it('is read in all ten languages', () => {
    expect(languages.sort()).toEqual(['de', 'el', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr'])
  })

  it.each(languages)('names the suggested word in the line under the field (%s)', (lang) => {
    const { sentenceDefault, sentenceHint } = builderOf(lang)

    // Inside its quotation marks, as each file writes them: "Deines Projektes" and "Projenin"
    // alone would satisfy a plain search for the word.
    expect(sentenceDefault).not.toBe('')
    expect(sentenceHint).toMatch(new RegExp(`[„“«]\\s?${sentenceDefault}\\s?[“”»]`))
  })
})
