// AI-GENERATED — not an architecture reference
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The words of support requests (SUA-008, SUA-009, SUA-011). The lint counts only keys that
// stand in the code as a literal and leaves `form.` and `pageTitle.` out, so this holds those in
// every language file -- and the support block in each as German has it.
const here = dirname(fileURLToPath(import.meta.url))
const languages = readdirSync(here).filter((file) => file.endsWith('.json'))
const read = (file) => JSON.parse(readFileSync(join(here, file), 'utf8'))

describe('the texts of support requests', () => {
  it('are read from every language file', () => {
    expect(languages).toHaveLength(10)
  })

  // The keys the page reads, as German has them; every language has each of them, with words.
  const keysOf = (block, prefix = '') =>
    Object.entries(block).flatMap(([key, value]) =>
      typeof value === 'object' ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`],
    )
  const valueOf = (block, key) => key.split('.').reduce((node, part) => node?.[part], block)
  const germanKeys = keysOf(read('de.json').support)

  it('are read from the German support block', () => {
    expect(germanKeys.length).toBeGreaterThan(20)
  })

  it.each(languages)('name the page and fill the support block in %s', (file) => {
    const texts = read(file)
    expect(texts.pageTitle.support).toBeTruthy()
    expect(keysOf(texts.support).sort()).toEqual([...germanKeys].sort())
    for (const key of germanKeys) {
      expect(valueOf(texts.support, key), key).toMatch(/\S/)
    }
  })

  it.each(languages)('keep the numbers and the group in their sentences in %s', (file) => {
    const { support } = read(file)
    expect(support.number).toContain('{number}')
    expect(support.readBy.group).toContain('{group}')
    expect(support.perDayReached).toContain('{max}')
    expect(support.messagesReached).toContain('{max}')
  })

  it.each(languages)(
    'name the button that folds a thread away, a word of its own beside "close", in %s',
    (file) => {
      const { form } = read(file)
      expect(form.collapse).toBeTruthy()
      expect(form.collapse).not.toBe(form.close)
    },
  )
})
