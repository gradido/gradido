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

  // The title, description and keywords of a link preview are the product's own words, the
  // same on every server, so they are written into index.html and not read from any
  // configuration. Only META_URL and META_AUTHOR differ per server.
  describe('the words a link preview shows', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const page = readFileSync(resolve(here, '../../index.html'), 'utf8')

    it('are the ones that were decided', () => {
      expect(page).toContain('Gradido – Helfen. Schenken. Danken.')
      expect(page).toContain('Gradido – Help. Give. Thank.')
      expect(page).toContain('helfen, beschenken und danken')
      expect(page).toContain('Helfen, Schenken, Danken')
    })

    it('leave author and URL to the server', () => {
      expect(page).toContain('<%= VITE_META_AUTHOR %>')
      expect(page).toContain('<%= VITE_META_URL %>')
    })
  })
})
