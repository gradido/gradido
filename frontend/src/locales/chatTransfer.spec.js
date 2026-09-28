// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * A transfer in the conversation (ChatThread, Bernd, 28.09.2026): "mit dem selben Wortlaut wie
 * die E-Mail". The one who received it reads the mail's own title -- the wording the core mail
 * `transactionReceived` carries in the same language, word for word; the one who sent it reads
 * the same fact from their side. Nothing on the way holds the two files together, so this does:
 * the mail's title is read from the core package's language file, as the core tests read the
 * wallet's patterns.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class.
 */
const here = dirname(fileURLToPath(import.meta.url))
const languages = readdirSync(here)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))
const wallet = (lang) => JSON.parse(readFileSync(join(here, `${lang}.json`), 'utf8')).chatThread
const mail = (lang) =>
  JSON.parse(readFileSync(join(here, '../../../core/src/locales', `${lang}.json`), 'utf8')).emails
    .transactionReceived

describe('a transfer in the conversation, in every language', () => {
  it('is worded in all ten', () => {
    expect(languages).toHaveLength(10)
  })

  it.each(languages)('says the transfer from both sides, each placeholder once, in %s', (lang) => {
    for (const key of ['transferReceived', 'transferSent']) {
      const text = wallet(lang)[key]
      expect(typeof text, key).toBe('string')
      for (const placeholder of ['{name}', '{amount}']) {
        expect(text.split(placeholder), `${key} ${placeholder}`).toHaveLength(2)
      }
    }
  })

  it.each(languages)('words the received transfer as the mail’s title does, in %s', (lang) => {
    const title = mail(lang)
      .title.replace('{senderAlias}', '{name}')
      .replace('{transactionAmount}', '{amount}')
    expect(wallet(lang).transferReceived).toBe(title)
  })
})
