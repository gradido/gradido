// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import ChatPreviewLine from './ChatPreviewLine.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => {
      if (key === 'chatPreview.by') return `${values.name}:`
      if (key === 'chatThread.you') return 'Du'
      if (key === 'chatThread.imageReady') return 'Bild'
      return key
    },
    n: (value) => String(value).replace('.', ','),
  }),
}))

vi.mock('@/i18n', () => ({
  default: { global: { t: (key) => key } },
}))

const here = dirname(fileURLToPath(import.meta.url))

const mountLine = (preview, unread = false) =>
  mount(ChatPreviewLine, {
    props: {
      preview: { mine: false, excerpt: '', hasImage: false, amount: null, ...preview },
      unread,
    },
  })

describe('ChatPreviewLine', () => {
  it("draws the other person's words alone", () => {
    expect(mountLine({ excerpt: 'Morgen um zehn?' }).text()).toBe('Morgen um zehn?')
  })

  // ⛔ A real space between the name and the words, in the DOM: Vue drops the space between two
  // elements, and a screen reader would hear "Du:Danke" as one word.
  it('puts a real space between who and what', () => {
    const line = mountLine({ mine: true, excerpt: 'Danke, bis morgen!' })
    expect(line.element.textContent.replace(/\s+/g, ' ').trim()).toBe('Du: Danke, bis morgen!')
    expect(line.find('[data-test="chat-preview-by"]').element.textContent).toMatch(/:\s$/)
  })

  it('shows the sign of a picture in front of its words, hidden from the ear', () => {
    const line = mountLine({ excerpt: '', hasImage: true })
    const sign = line.find('[data-test="chat-preview-picture"]')
    expect(sign.exists()).toBe(true)
    expect(sign.attributes('aria-hidden')).toBe('true')
    expect(line.text()).toBe('Bild')
  })

  // A booking never carries a picture; were the field ever set on one, the line still shows none.
  it('shows no sign of a picture for a booking', () => {
    const line = mountLine({ mine: true, excerpt: 'Danke', amount: '20.0000', hasImage: true })
    expect(line.find('[data-test="chat-preview-picture"]').exists()).toBe(false)
    expect(line.text().replace(/\s+/g, ' ')).toBe('Du: 20 GDD · Danke')
  })

  // Bernd, 24.10.2026: what somebody wrote in italics, as both booking lists set a memo -- and
  // only that: who wrote it, the Gradido and "Bild" stay upright.
  describe('in italics', () => {
    const italic = (line) =>
      line.findAll('.chat-preview-line-words').map((piece) => piece.element.textContent.trim())

    it("sets a message's words in italics, and not who wrote them", () => {
      const line = mountLine({ mine: true, excerpt: 'Danke, bis morgen!' })
      expect(italic(line)).toEqual(['Danke, bis morgen!'])
      expect(line.find('[data-test="chat-preview-by"]').classes()).not.toContain(
        'chat-preview-line-words',
      )
    })

    it("sets a booking's memo in italics, and not its Gradido", () => {
      const line = mountLine({ mine: true, excerpt: 'Danke', amount: '20.0000' })
      expect(italic(line)).toEqual(['Danke'])
      const label = line.find('[data-test="chat-preview-label"]')
      expect(label.element.textContent).toBe('20 GDD · ')
      expect(label.classes()).not.toContain('chat-preview-line-words')
    })

    it('sets nothing in italics where nobody wrote anything', () => {
      expect(italic(mountLine({ excerpt: '', hasImage: true }))).toEqual([])
      expect(italic(mountLine({ excerpt: '', amount: '5.0000' }))).toEqual([])
      expect(mountLine({ excerpt: '', amount: '5.0000' }).text()).toBe('5 GDD')
    })

    it('is italics in the stylesheet', () => {
      const styles = readFileSync(resolve(here, './ChatPreviewLine.vue'), 'utf8')
        .split('<style scoped>')[1]
        .replace(/\/\*[\s\S]*?\*\//g, '')
      const rule = styles.match(/\.chat-preview-line-words\s*\{([^}]*)\}/)[1]
      expect(rule).toMatch(/font-style:\s*italic/)
    })
  })

  it('stands in the quiet colour of the lines around it, dark and bold while it waits unread', () => {
    expect(mountLine({ excerpt: 'Hallo' }).classes()).toEqual(
      expect.arrayContaining(['small', 'd-block', 'text-muted']),
    )
    const unread = mountLine({ excerpt: 'Hallo' }, true).classes()
    expect(unread).toContain('fw-semibold')
    expect(unread).not.toContain('text-muted')
  })

  // One line, cut off where it ends -- and the words never become the width the row asks for.
  it('keeps to one line, and asks no width of the row', () => {
    const styles = readFileSync(resolve(here, './ChatPreviewLine.vue'), 'utf8')
      .split('<style scoped>')[1]
      .replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = styles.match(/\.chat-preview-line\s*\{([^}]*)\}/)[1]
    expect(rule).toMatch(/white-space:\s*nowrap/)
    expect(rule).toMatch(/text-overflow:\s*ellipsis/)
    expect(rule).toMatch(/overflow:\s*hidden/)
    expect(rule).toMatch(/contain:\s*inline-size/)
  })
})
