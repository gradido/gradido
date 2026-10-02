// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import i18n from '@/i18n'
import RedeemThanksPaper from './RedeemThanksPaper.vue'

/**
 * The sheet a thank-you arrives on. Rendered with the wallet's own vue-i18n and its own
 * language files: the sentence under the words has two placeholders, and only the language
 * file can say whether the sheet fills the ones it names.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
 * instance of it away as coming from another realm.
 */
const GRADIDO_ID = '76378cbb-5a5c-4e4b-9a3b-1f2d3c4b5a69'

const link = (overrides = {}) => ({
  __typename: 'TransactionLink',
  amount: '20',
  memo: 'Danke fürs Reparieren der Gartenbank — sie steht wieder wie neu.',
  senderUser: { gradidoID: GRADIDO_ID, alias: 'Oma-Emma' },
  ...overrides,
})

const paper = (linkData = link(), slots = {}) =>
  mount(RedeemThanksPaper, { props: { linkData }, slots, global: { plugins: [i18n] } })

const from = (wrapper) => wrapper.find('[data-test="redeem-thanks-paper-from"]')

const sfc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'RedeemThanksPaper.vue'),
  'utf8',
)
// The file explains in comments what it must not do; a search over the raw text would find
// its own explanation.
const live = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
const template = live(sfc.slice(sfc.indexOf('<template>'), sfc.indexOf('<script')))
const css = live(sfc.slice(sfc.indexOf('<style'), sfc.indexOf('</style>')))

describe('RedeemThanksPaper', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'de'
  })

  it('shows the words of the link', () => {
    expect(paper().find('[data-test="redeem-thanks-paper-message"]').text()).toBe(
      'Danke fürs Reparieren der Gartenbank — sie steht wieder wie neu.',
    )
  })

  // The whole sentence, read as the page shows it: the name, the amount, the unit -- and
  // nothing between the parts that nobody wrote.
  it('says who thanks with how much, in the language of the page', () => {
    expect(from(paper()).element.textContent).toBe('Oma-Emma dankt Dir mit 20 Gradido')

    i18n.global.locale.value = 'en'
    expect(from(paper()).element.textContent).toBe('Oma-Emma thanks you with 20 Gradido')
  })

  it('sets the name and the amount with its unit in bold, and nothing else', () => {
    expect(
      from(paper())
        .findAll('b')
        .map((bold) => bold.text()),
    ).toEqual(['Oma-Emma', '20 Gradido'])
  })

  // The server sends "12.5". The share text writes that amount with the decimal mark of its
  // language, and so does the sheet: whoever taps the link reads the figure they were sent
  // (useCopyLinks.spec.js holds the same two sentences for the text).
  it('writes an amount with decimals as the language of the page does', () => {
    const half = link({ amount: '12.5' })

    expect(from(paper(half)).element.textContent).toBe('Oma-Emma dankt Dir mit 12,5 Gradido')

    i18n.global.locale.value = 'en'
    expect(from(paper(half)).element.textContent).toBe('Oma-Emma thanks you with 12.5 Gradido')
  })

  it('keeps the amount and its unit together in bold, with one space between them', () => {
    const bold = from(paper(link({ amount: '12.5' }))).find('.redeem-thanks-paper-amount')

    expect(bold.element.textContent.trim()).toBe('12,5 Gradido')
  })

  describe('the sender', () => {
    // NU-021: the redeem page shows a sender to somebody who is not signed in, so it is the
    // user name -- and the fallback is the one the wallet has everywhere (`memberAlias`).
    it('stands under the user name', () => {
      expect(from(paper()).find('b').text()).toBe('Oma-Emma')
    })

    it('stands under the Gradido ID where there is no user name', () => {
      const wrapper = paper(link({ senderUser: { gradidoID: GRADIDO_ID, alias: null } }))

      expect(from(wrapper).find('b').text()).toBe(GRADIDO_ID)
    })

    it('stands under the Gradido ID where the stored name is too short to be one', () => {
      const wrapper = paper(link({ senderUser: { gradidoID: GRADIDO_ID, alias: 'ab' } }))

      expect(from(wrapper).find('b').text()).toBe(GRADIDO_ID)
    })

    it('never shows a real name, even where the link data carries one', () => {
      const wrapper = paper(
        link({
          senderUser: {
            gradidoID: GRADIDO_ID,
            alias: 'Oma-Emma',
            firstName: 'Wilhelmine',
            lastName: 'Musterfrau',
          },
        }),
      )

      expect(wrapper.text()).not.toContain('Wilhelmine')
      expect(wrapper.text()).not.toContain('Musterfrau')
      expect(from(wrapper).find('b').text()).toBe('Oma-Emma')
    })

    it('has the first letter of the name in the circle, as a capital', () => {
      expect(paper().find('.redeem-thanks-paper-initial').text()).toBe('O')
      expect(
        paper(link({ senderUser: { gradidoID: GRADIDO_ID, alias: 'emmawald' } }))
          .find('.redeem-thanks-paper-initial')
          .text(),
      ).toBe('E')
    })

    it('keeps the circle from being read out: the sentence beside it names the sender', () => {
      expect(paper().find('.redeem-thanks-paper-initial').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('the words somebody else wrote', () => {
    const MARKUP = '<img src=x onerror="alert(1)"><b>fett</b>'

    it('stand there as text and become no element', () => {
      const wrapper = paper(link({ memo: MARKUP }))
      const message = wrapper.find('[data-test="redeem-thanks-paper-message"]')

      expect(message.text()).toBe(MARKUP)
      expect(message.element.children).toHaveLength(0)
      expect(wrapper.find('img').exists()).toBe(false)
    })

    it('are the same for a name that reads like markup', () => {
      const wrapper = paper(link({ senderUser: { gradidoID: GRADIDO_ID, alias: '<i>x</i>' } }))

      expect(from(wrapper).find('b').text()).toBe('<i>x</i>')
      expect(wrapper.find('i').exists()).toBe(false)
    })

    it('are never handed to the page as markup', () => {
      expect(template).not.toMatch(/v-html|innerHTML/)
      expect(live(sfc)).not.toMatch(/innerHTML/)
    })
  })

  describe('the picture', () => {
    it('is not there for a plain link: the sheet holds the words alone', () => {
      const wrapper = paper()

      expect(wrapper.element.children).toHaveLength(1)
      expect(wrapper.element.firstElementChild.classList).toContain('redeem-thanks-paper-text')
    })

    it('stands above the words where the slot is filled', () => {
      const wrapper = paper(link(), { picture: '<img class="motif" src="/motif.svg" alt="" />' })

      expect(wrapper.element.children).toHaveLength(2)
      expect(wrapper.element.firstElementChild.classList).toContain('motif')
      expect(wrapper.element.lastElementChild.classList).toContain('redeem-thanks-paper-text')
    })
  })

  // jsdom lays nothing out and reads no stylesheet, so what a test can hold is the source.
  // The measure in the real bundle, in both themes, is part of the delivery.
  describe('paper stays light in dark mode', () => {
    it('writes every colour out', () => {
      expect(css).toMatch(/background:\s*#fffdf8;/)
      expect(css).not.toMatch(/var\(/)
      expect(css).not.toMatch(/dark-mode/)
      expect(css).not.toMatch(/currentcolor|inherit/i)
      // Each text sets its own colour: what the page hands down is near white in dark mode.
      for (const selector of [
        '.redeem-thanks-paper-message',
        '.redeem-thanks-paper-from',
        '.redeem-thanks-paper-initial',
      ]) {
        const [, body] = css.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`))
        expect(body).toMatch(/(^|[\s;])color:\s*#[0-9a-f]{6};/)
      }
    })

    // The dark sheet repaints cards, headings, links and rules, each with more weight than a
    // scoped rule of this file could muster (gradido-template-dark.scss).
    it('is built from nothing the dark sheet repaints', () => {
      expect(template).not.toMatch(/<(BCard|b-card|h[1-6]|a|hr|BLink|b-link)[\s>]/)
      expect(template).not.toMatch(/class="[^"]*\b(card|card-body|bg-white|h[1-6]|border)\b/)
    })
  })
})
