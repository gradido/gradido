import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import CONFIG from './index'

describe('config/index', () => {
  describe('decay start block', () => {
    it('has the correct date set', () => {
      expect(CONFIG.DECAY_START_TIME).toEqual(new Date('2021-05-13T17:46:31.000Z'))
    })
  })

  /**
   * What a link preview says about this wallet ships with the BUILD, not with a server's
   * own `.env` -- see the note over `meta` in index.js.
   *
   * ⛔ The guard has to be the template, not this file. Taking the `process.env` read out
   * here does nothing on its own: as long as `frontend/.env.template` hands a name through,
   * `frontend/.env` carries the server's old value, and `process.env` wins over any default
   * written here. The two belong together, and only the template can be read from a test.
   */
  describe('the words a link preview shows', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const template = readFileSync(resolve(here, '../../.env.template'), 'utf8')
    const WORDS = [
      'META_TITLE_DE',
      'META_TITLE_EN',
      'META_DESCRIPTION_DE',
      'META_DESCRIPTION_EN',
      'META_KEYWORDS_DE',
      'META_KEYWORDS_EN',
    ]

    it('are not handed through from a server file', () => {
      for (const name of WORDS) {
        expect(template).not.toContain(`${name}=`)
      }
    })

    // The fixture proves itself: the template IS read and DOES carry the two names that
    // legitimately differ per server, so the assertion above is about absence and not
    // about an empty file.
    it('still lets a server say where it stands and who runs it', () => {
      expect(template).toContain('META_URL=')
      expect(template).toContain('META_AUTHOR=')
    })

    it('are the ones that were decided', () => {
      expect(CONFIG.META_TITLE_DE).toBe('Gradido – Helfen. Schenken. Danken.')
      expect(CONFIG.META_TITLE_EN).toBe('Gradido – Help. Give. Thank.')
      expect(CONFIG.META_DESCRIPTION_DE).toContain('helfen, beschenken und danken')
      expect(CONFIG.META_KEYWORDS_DE).toContain('Helfen, Schenken, Danken')
    })
  })
})
