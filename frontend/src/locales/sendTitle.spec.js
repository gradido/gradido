// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * ⛔ The e-mail word in the send page's title must not break at its hyphen. With a plain one
 * the browser may end a line after it, and on a phone it did: "Gradido und E-" over "Mail
 * senden" at 320px in German and Turkish, in Italian and Portuguese at 360px, in French at
 * 390px. U+2011, the non-breaking hyphen, looks the same and never breaks; the send page's own
 * tabs have carried it for a while.
 */
const here = dirname(fileURLToPath(import.meta.url))
const languages = readdirSync(here).filter((file) => file.endsWith('.json'))
const titleIn = (file) => JSON.parse(readFileSync(join(here, file), 'utf8')).pageTitle.send

describe('the send page title', () => {
  it('is read from every language file', () => {
    expect(languages).toHaveLength(10)
  })

  it.each(languages)('holds no hyphen a line may break at, in %s', (file) => {
    const title = titleIn(file)
    expect(title).toBeTruthy()
    expect(title).not.toContain('-')
  })

  it('keeps the German e-mail word together with the non-breaking hyphen', () => {
    // The other half: without it the test above would also pass for a title that lost the
    // word altogether.
    expect(titleIn('de.json')).toBe('Gradido und E‑Mail senden')
  })
})
