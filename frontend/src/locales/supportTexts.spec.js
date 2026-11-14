// AI-GENERATED — not an architecture reference
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The words of support requests (SUA-008, SUA-011). The lint counts only keys that stand in the
// code as a literal and leaves `form.` and `pageTitle.` out, so this holds those in every
// language file.
const here = dirname(fileURLToPath(import.meta.url))
const languages = readdirSync(here).filter((file) => file.endsWith('.json'))
const read = (file) => JSON.parse(readFileSync(join(here, file), 'utf8'))

describe('the texts of support requests', () => {
  it('are read from every language file', () => {
    expect(languages).toHaveLength(10)
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
