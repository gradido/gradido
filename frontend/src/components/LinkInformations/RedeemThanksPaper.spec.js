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
const script = sfc
  .slice(sfc.indexOf('<script'), sfc.indexOf('</script>'))
  .replace(/^\s*\/\/.*$/gm, '')
// Every style block of the file.
const css = live(sfc.slice(sfc.indexOf('<style'), sfc.lastIndexOf('</style>')))

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

  // A thank-you greeting: the same sheet with its motif, whom it is for, and its first line in
  // handwriting above the words.
  describe('a thank-you greeting', () => {
    const LINE = 'Einfach so — weil es Dich gibt.'
    const WORDS = 'Liebe Sarah, mit Eurem iPad hat alles angefangen.\nEure Oma'
    const greeting = (overrides = {}, linkOverrides = {}) =>
      link({
        memo: `${LINE}\n${WORDS}`,
        greeting: { motif: 'morning-light', line: LINE, recipientName: 'Sarah', ...overrides },
        ...linkOverrides,
      })

    const motif = (wrapper) => wrapper.find('[data-test="redeem-thanks-paper-motif"]')
    const forWhom = (wrapper) => wrapper.find('[data-test="redeem-thanks-paper-for"]')
    const line = (wrapper) => wrapper.find('[data-test="redeem-thanks-paper-line"]')
    const message = (wrapper) => wrapper.find('[data-test="redeem-thanks-paper-message"]')

    describe('the motif', () => {
      it('stands above the words, as an image with the name of the motif', () => {
        const wrapper = paper(greeting())

        expect(wrapper.element.children).toHaveLength(2)
        expect(wrapper.element.firstElementChild.classList).toContain('redeem-thanks-paper-picture')
        expect(motif(wrapper).element.tagName).toBe('IMG')
        expect(motif(wrapper).attributes('src')).toBe('/img/thank-you-greeting/morning-light.svg')
        expect(motif(wrapper).attributes('alt')).toBe('Morgenlicht')

        i18n.global.locale.value = 'en'
        expect(motif(paper(greeting())).attributes('alt')).toBe('Morning light')
      })

      it('is each of the five, under its own name', () => {
        for (const [key, name] of [
          ['heart-leaves', 'Herz und Blätter'],
          ['giving-hands', 'Gebende Hände'],
          ['bouquet', 'Blumenstrauß'],
          ['glowing-swirl', 'Leuchtender Kringel'],
          ['morning-light', 'Morgenlicht'],
        ]) {
          const wrapper = paper(greeting({ motif: key }))

          expect(motif(wrapper).attributes('src')).toBe(`/img/thank-you-greeting/${key}.svg`)
          expect(motif(wrapper).attributes('alt')).toBe(name)
        }
      })

      // The room stands before the picture has come: the image says its size.
      it('says its size, 360 by 250', () => {
        const wrapper = paper(greeting())

        expect(motif(wrapper).attributes('width')).toBe('360')
        expect(motif(wrapper).attributes('height')).toBe('250')
      })

      it('is left out for a motif this wallet does not know, and for none', () => {
        for (const key of ['sunset', null, '']) {
          const wrapper = paper(greeting({ motif: key }))

          expect(wrapper.find('img').exists()).toBe(false)
          expect(wrapper.find('.redeem-thanks-paper-picture').exists()).toBe(false)
          // The rest of the greeting is there all the same.
          expect(forWhom(wrapper).text()).toBe('FÜR SARAH')
          expect(line(wrapper).text()).toBe(LINE)
        }
      })

      it('gives way to a picture handed in from outside', () => {
        const wrapper = paper(greeting(), { picture: '<img class="photo" src="/p.jpg" alt="" />' })

        expect(wrapper.element.firstElementChild.classList).toContain('photo')
        expect(motif(wrapper).exists()).toBe(false)
      })
    })

    describe('whom it is for', () => {
      it('stands in capitals', () => {
        expect(forWhom(paper(greeting())).text()).toBe('FÜR SARAH')

        i18n.global.locale.value = 'en'
        expect(forWhom(paper(greeting())).text()).toBe('FOR SARAH')
      })

      it('is left out where the greeting names nobody', () => {
        for (const recipientName of [null, undefined, '']) {
          expect(forWhom(paper(greeting({ recipientName }))).exists()).toBe(false)
        }
      })
    })

    describe('the first line', () => {
      it('stands in handwriting', () => {
        const wrapper = paper(greeting())

        expect(line(wrapper).text()).toBe(LINE)
        expect(line(wrapper).classes()).toContain('is-by-hand')
      })

      // The font has no Greek. The line decides, whatever the language of the page.
      it('stands in the page’s font, all of it, where it has a letter the handwriting lacks', () => {
        const greek = 'Σε ευχαριστώ για τη βοήθειά σου!'
        const wrapper = paper(greeting({ line: greek }, { memo: `${greek}\n${WORDS}` }))

        expect(line(wrapper).text()).toBe(greek)
        expect(line(wrapper).classes()).not.toContain('is-by-hand')

        const mixed = 'Danke, Σοφία!'
        expect(line(paper(greeting({ line: mixed }, { memo: mixed }))).classes()).not.toContain(
          'is-by-hand',
        )
      })

      it('stays in handwriting for a Russian line on a German page', () => {
        const russian = 'Спасибо за помощь!'
        const wrapper = paper(greeting({ line: russian }, { memo: russian }))

        expect(line(wrapper).classes()).toContain('is-by-hand')
      })

      it('is left out where the greeting has none', () => {
        const wrapper = paper(greeting({ line: null }, { memo: WORDS }))

        expect(line(wrapper).exists()).toBe(false)
        expect(message(wrapper).element.textContent.trim()).toBe(WORDS)
        expect(message(wrapper).classes()).not.toContain('is-under-line')
      })
    })

    describe('the words', () => {
      it('are the memo without the line', () => {
        const wrapper = paper(greeting())

        expect(message(wrapper).element.textContent.trim()).toBe(WORDS)
        expect(message(wrapper).classes()).toContain('is-under-line')
        // The line stands once on the sheet, not twice.
        expect(wrapper.text().split(LINE)).toHaveLength(2)
      })

      it('leave no empty block where the greeting is its line alone', () => {
        const wrapper = paper(greeting({}, { memo: LINE }))

        expect(line(wrapper).text()).toBe(LINE)
        expect(message(wrapper).exists()).toBe(false)
      })

      // No wallet writes such a greeting and the server takes none. Should one arrive: nothing
      // twice, nothing lost.
      it('are the whole memo, with no line above, where the memo does not begin with the line', () => {
        const memo = `Liebe Sarah!\n${LINE}`
        const wrapper = paper(greeting({}, { memo }))

        expect(line(wrapper).exists()).toBe(false)
        expect(message(wrapper).element.textContent.trim()).toBe(memo)
        expect(wrapper.text().split(LINE)).toHaveLength(2)
      })
    })

    it('keeps the order: picture, whom it is for, the line, the words, the sender', () => {
      const wrapper = paper(greeting())
      const text = wrapper.find('.redeem-thanks-paper-text')

      expect([...text.element.children].map((child) => child.className.split(' ')[0])).toEqual([
        'redeem-thanks-paper-for',
        'redeem-thanks-paper-line',
        'redeem-thanks-paper-message',
        'redeem-thanks-paper-rule',
        'redeem-thanks-paper-sender',
      ])
      expect(text.classes()).toContain('is-greeting')
      expect(from(wrapper).element.textContent).toBe('Oma-Emma dankt Dir mit 20 Gradido')
    })

    it('shows what somebody else wrote as text, never as markup', () => {
      const MARKUP = '<img src=x onerror="alert(1)">'
      const wrapper = paper(
        greeting(
          { line: MARKUP, recipientName: MARKUP, motif: null },
          { memo: `${MARKUP}\n<b>x</b>` },
        ),
      )

      expect(line(wrapper).text()).toBe(MARKUP)
      expect(line(wrapper).element.children).toHaveLength(0)
      expect(forWhom(wrapper).element.children).toHaveLength(0)
      expect(message(wrapper).element.children).toHaveLength(0)
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.find('b b').exists()).toBe(false)
    })
  })

  // "Dein Dank ist da." shows the greeting that was just accepted in short (ZE-017 F5): the
  // picture, whom it is for and the line. The words were read a moment ago, and who thanked
  // with how much is what the page says itself, right above.
  describe('the short sheet', () => {
    const LINE = 'Einfach so — weil es Dich gibt.'
    const greeted = link({
      memo: `${LINE}\nLiebe Sarah, mit Eurem iPad hat alles angefangen.`,
      greeting: { motif: 'morning-light', line: LINE, recipientName: 'Sarah' },
    })
    const short = (linkData = greeted) =>
      mount(RedeemThanksPaper, {
        props: { linkData, short: true },
        global: { plugins: [i18n] },
      })

    it('keeps the picture, whom it is for and the line', () => {
      const wrapper = short()

      expect(wrapper.find('[data-test="redeem-thanks-paper-motif"]').attributes('src')).toBe(
        '/img/thank-you-greeting/morning-light.svg',
      )
      expect(wrapper.find('[data-test="redeem-thanks-paper-for"]').text()).toBe('FÜR SARAH')
      expect(wrapper.find('[data-test="redeem-thanks-paper-line"]').text()).toBe(LINE)
    })

    it('leaves out the words, the rule and the line of the sender', () => {
      const wrapper = short()

      expect(wrapper.find('[data-test="redeem-thanks-paper-message"]').exists()).toBe(false)
      expect(wrapper.find('.redeem-thanks-paper-rule').exists()).toBe(false)
      expect(wrapper.find('.redeem-thanks-paper-sender').exists()).toBe(false)
      expect(from(wrapper).exists()).toBe(false)
      expect(wrapper.text()).toBe(`FÜR SARAH${LINE}`)
    })

    it('leaves out the words of a memo that does not begin with the line as well', () => {
      const wrapper = short(link({ ...greeted, memo: 'Ganz andere Worte.' }))

      expect(wrapper.text()).not.toContain('Ganz andere Worte.')
    })

    // Not asked for: every sheet the wallet showed before is the whole one.
    it('is not what a sheet is unless asked', () => {
      const wrapper = paper(greeted)

      expect(wrapper.find('[data-test="redeem-thanks-paper-message"]').text()).toBe(
        'Liebe Sarah, mit Eurem iPad hat alles angefangen.',
      )
      expect(from(wrapper).element.textContent).toBe('Oma-Emma dankt Dir mit 20 Gradido')
      expect(wrapper.find('.redeem-thanks-paper-rule').exists()).toBe(true)
    })
  })

  describe('a plain link', () => {
    it('is the sheet it was: no picture, nobody named, no line, the memo whole', () => {
      for (const data of [link(), link({ greeting: null })]) {
        const wrapper = paper(data)

        expect(wrapper.element.children).toHaveLength(1)
        expect(wrapper.find('.redeem-thanks-paper-text').classes()).not.toContain('is-greeting')
        expect(wrapper.find('[data-test="redeem-thanks-paper-for"]').exists()).toBe(false)
        expect(wrapper.find('[data-test="redeem-thanks-paper-line"]').exists()).toBe(false)
        expect(wrapper.find('[data-test="redeem-thanks-paper-message"]').classes()).toEqual([
          'redeem-thanks-paper-message',
        ])
        expect(wrapper.find('[data-test="redeem-thanks-paper-message"]').text()).toBe(data.memo)
      }
    })
  })

  // The handwriting ships with the wallet, declared once for the sheet and for the bubble a
  // greeting has in the conversation (assets/fonts/caveat/caveat.css; handwriting.spec.js
  // holds the declaration itself).
  describe('the handwriting', () => {
    // From the script, so that the bundle holds the rule once however many components set a
    // line in it: a style block here would be a second face of the same name.
    it('is the one declaration the wallet has, taken in from the script', () => {
      expect(script).toMatch(/^import '@\/assets\/fonts\/caveat\/caveat\.css'$/m)
      expect(css).not.toMatch(/@font-face/)
      expect(sfc.match(/<style/g)).toHaveLength(1)
    })

    it('is named only by the line that is set in it', () => {
      expect(css.match(/font-family:\s*Caveat,/g)).toHaveLength(1)
      const [, byHand] = css.match(/\.redeem-thanks-paper-line\.is-by-hand\s*\{([^}]*)\}/)
      expect(byHand).toMatch(/font-family:\s*Caveat, 'Open Sans', sans-serif;/)
    })

    // The line that is not handwriting names no family at all: it is the page's.
    it('leaves the line without it in the font of the page', () => {
      const [, plain] = css.match(/\.redeem-thanks-paper-line\s*\{([^}]*)\}/)
      expect(plain).not.toMatch(/font-family/)
      expect(plain).toMatch(/font-style:\s*italic;/)
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
        '.redeem-thanks-paper-for',
        '.redeem-thanks-paper-line',
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
