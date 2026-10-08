// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import i18n from '@/i18n'
import RedeemThanksPaper from '@/components/LinkInformations/RedeemThanksPaper.vue'
import { canWriteByHand } from '@/utils/handwriting'
import {
  isOneLine,
  memoBeginsWithLine,
  THANK_YOU_LINE_MAX_CHARS,
} from '../../../shared/src/data/ThankYouGreeting.logic'

/**
 * The words of the thank-you greeting (`thank-you-greeting.*`), in all ten languages. Rendered
 * with the wallet's own vue-i18n: the source is what the translations are, the rendering is
 * what arrives.
 *
 * - ⛔ The twelve lines go into a booking and stay there, in the language the sender chose
 *   them in (E-018): each is one line of 5 to 80 characters -- held against the server's own
 *   rule -- and none speaks of redeeming or paying.
 * - The days a greeting waits are a number, and Russian has three forms for it.
 * - Every sentence that names whom the greeting is for has a sister without the name: the
 *   wallet knows no gender, so there is no pronoun to fall back on.
 * - "FÜR {NAME}" stands in capitals by the rules of the language: Turkish "için" is "İÇİN".
 * - ⛔ Three sentences stand on PAPER, on the back of the printed sheet: once printed they
 *   cannot be changed, so they are held with the care of a text that goes into a booking.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
 * instance of it away as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))
const languages = readdirSync(here)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.replace('.json', ''))
const fileOf = (lang) => JSON.parse(readFileSync(join(here, `${lang}.json`), 'utf8'))
const greetingIn = (lang) => fileOf(lang)['thank-you-greeting'] ?? {}

const flat = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) =>
    typeof value === 'string' ? [[`${prefix}${key}`, value]] : flat(value, `${prefix}${key}.`),
  )

const LINES = [
  'help',
  'talk',
  'time',
  'effort',
  'just-so',
  'encouragement',
  'appreciation',
  'joy',
  'welcome',
  'birthday',
  'recovery',
  'farewell',
]
const MOTIFS = ['heart-leaves', 'giving-hands', 'bouquet', 'glowing-swirl', 'morning-light']

const KEYS = [
  'done.another',
  'done.edit-hint',
  'done.find-again',
  'done.link-hint',
  'done.link-hint-photo',
  'done.sentence-lead',
  'done.title',
  'done.title-for',
  'done.waits-until',
  'entry.plain',
  'entry.text',
  'entry.write',
  'for',
  'group.for-something',
  'group.just-so',
  'group.occasion',
  ...LINES.map((line) => `line.${line}`),
  'list.for',
  ...MOTIFS.map((motif) => `motif.${motif}`),
  'name',
  'next',
  'paper.failed',
  'paper.hint',
  'paper.print',
  'paper.save',
  'paper.title',
  'photo-of',
  'picture.not-taken-over',
  'picture.other',
  'picture.own',
  'picture.question',
  'preview.finish',
  'preview.title',
  'preview.title-for',
  'preview.waits',
  'preview.waits-for',
  'received-title',
  'share.copied',
  'share.line1',
  'share.line1-for',
  'sheet.from',
  'sheet.scan',
  'sheet.waits',
  'step.picture',
  'step.preview',
  'step.words',
  'words.all-lines',
  'words.amount',
  'words.for-whom',
  'words.for-whom-hint',
  'words.line',
  'words.missing',
  'words.own-line',
  'words.own-words',
].sort()

// What each language calls redeeming and paying (as redeemThanks.spec.js has them). None of
// it belongs to a thank-you. The French "perçu" only as a word of its own: "Aperçu", the
// last look, has it inside.
const NOT_A_THANK_YOU = {
  de: /einl[öo]s|zahl/i,
  en: /redeem|pay/i,
  es: /canje|pago|pagar/i,
  fr: /encaiss|(?<!\p{L})per[çc]u|percev|paiement|payer/iu,
  it: /riscatt|pagament|pagare/i,
  nl: /inwissel|betal/i,
  pt: /resgat|pagament|pagar/i,
  ru: /активир|оплат|платеж|платёж/i,
  el: /εξαργ[υύ]ρ|πληρωμ/i,
  tr: /kullan|ödeme/i,
}

// With `count` as the page hands it on: the form to choose, where a language has several.
const render = (lang, key, named = {}, count) =>
  i18n.global.t(
    `thank-you-greeting.${key}`,
    named,
    count === undefined ? { locale: lang } : { locale: lang, plural: count },
  )

describe('thank-you-greeting in the language files', () => {
  it('reads all ten language files', () => {
    expect(languages).toHaveLength(10)
    expect(languages).toEqual(expect.arrayContaining(Object.keys(NOT_A_THANK_YOU)))
  })

  it.each(languages)('has every text and no other, in %s', (lang) => {
    expect(
      flat(greetingIn(lang))
        .map(([key]) => key)
        .sort(),
    ).toEqual(KEYS)
    expect(fileOf(lang).pageTitle['thank-you-greeting']).toBeTruthy()
  })

  // "QR" and a placeholder alone are the same word everywhere; a sentence is not.
  it.each(languages.filter((lang) => lang !== 'en'))(
    'says every sentence in its own words, not in the English ones, in %s',
    (lang) => {
      const english = Object.fromEntries(flat(greetingIn('en')))
      const same = flat(greetingIn(lang))
        .filter(([key, value]) => value === english[key] && value.includes(' '))
        .map(([key]) => key)
      expect(same).toEqual([])
    },
  )

  describe('the twelve lines', () => {
    it.each(languages)('are one line of 5 to 80 characters each, in %s', (lang) => {
      for (const key of LINES) {
        const line = render(lang, `line.${key}`)

        expect(line, key).toBe(greetingIn(lang).line[key])
        expect(line.length, `${key}: ${line}`).toBeGreaterThanOrEqual(5)
        expect(line.length, `${key}: ${line}`).toBeLessThanOrEqual(THANK_YOU_LINE_MAX_CHARS)
        // The server's own rule for a line, and what it stores is the line trimmed.
        expect(isOneLine(line), `${key}: ${line}`).toBe(true)
        expect(line.trim(), key).toBe(line)
        expect(line, key).not.toMatch(/[{}|]/)
        // Alone it is a memo the server takes; with words after it, too.
        expect(memoBeginsWithLine(line, line)).toBe(true)
        expect(memoBeginsWithLine(`${line}\nx`, line)).toBe(true)
      }
    })

    it.each(languages)('are twelve different lines, in %s', (lang) => {
      expect(new Set(LINES.map((key) => greetingIn(lang).line[key])).size).toBe(12)
    })

    // The typeface has no Greek; in every other language of the wallet a suggested line is
    // set in it.
    it.each(languages)('can be set in the handwriting, except the Greek ones, in %s', (lang) => {
      for (const key of LINES) {
        expect(canWriteByHand(greetingIn(lang).line[key]), `${lang} ${key}`).toBe(lang !== 'el')
      }
    })
  })

  it.each(languages)('speaks of a thank-you, not of redeeming or paying, in %s', (lang) => {
    for (const [key, value] of flat(greetingIn(lang))) {
      expect(`${key}: ${value}`).not.toMatch(NOT_A_THANK_YOU[lang])
    }
  })

  // What the old redeem page said, to prove the patterns above can find something.
  it.each(languages)('would find the old words of the redeem page, in %s', (lang) => {
    const old = fileOf(lang).gdd_per_link
    expect([old.redeemed, old['no-redeem'], old['redeemed-at']].join(' ')).toMatch(
      NOT_A_THANK_YOU[lang],
    )
  })

  it('writes Du, Dein, Dir and Dich with a capital in German', () => {
    for (const [key, value] of flat(greetingIn('de'))) {
      expect(`${key}: ${value}`).not.toMatch(/(^|[^\p{L}])(du|dein\p{L}*|dir|dich|euch|euer)\b/u)
    }
  })

  describe('the days a greeting waits', () => {
    it.each(languages)('are written as one sentence with and without a name, in %s', (lang) => {
      for (const days of [1, 2, 5, 7, 14, 21, 30]) {
        const named = render(lang, 'preview.waits-for', { days, name: 'Sarah' }, days)
        const nameless = render(lang, 'preview.waits', { days }, days)

        for (const sentence of [named, nameless]) {
          expect(sentence).toContain(String(days))
          expect(sentence).not.toMatch(/\||\{|\}/)
          expect(sentence).toMatch(/\.$/)
        }
        expect(named).toContain('Sarah')
        expect(nameless).not.toContain('Sarah')
      }
    })

    it('are in the form Russian has for each number', () => {
      const waits = (days) => render('ru', 'preview.waits', { days }, days).split('.')[0]
      const waitsFor = (days) =>
        render('ru', 'preview.waits-for', { days, name: 'Sarah' }, days).split('.')[0]

      for (const sentence of [waits, waitsFor]) {
        expect([1, 21, 31].map(sentence)).toEqual(
          [1, 21, 31].map((days) => `Ваша открытка ждёт ${days} день`),
        )
        expect([2, 3, 4, 22].map(sentence)).toEqual(
          [2, 3, 4, 22].map((days) => `Ваша открытка ждёт ${days} дня`),
        )
        expect([5, 11, 14, 20, 30].map(sentence)).toEqual(
          [5, 11, 14, 20, 30].map((days) => `Ваша открытка ждёт ${days} дней`),
        )
      }
    })
  })

  // The wallet knows no gender: the name stands there, or the sentence does without.
  describe('the sentences that name whom the greeting is for', () => {
    it.each(languages)('carry the name, and their sisters do without, in %s', (lang) => {
      for (const [named, nameless] of [
        ['preview.title-for', 'preview.title'],
        ['done.title-for', 'done.title'],
        ['share.line1-for', 'share.line1'],
        ['list.for', 'name'],
      ]) {
        expect(render(lang, named, { name: 'Sarah' }), named).toContain('Sarah')
        expect(render(lang, named, { name: 'Sarah' }), named).not.toMatch(/[{}]/)
        expect(render(lang, nameless), nameless).not.toMatch(/[{}]|Sarah/)
        // Not the named sentence with a hole where the name was.
        expect(render(lang, nameless), nameless).not.toMatch(/^[\s,:—-]/)
      }
    })

    it.each(languages)(
      'begin the text that goes out with a line ending in a colon, in %s',
      (lang) => {
        expect(render(lang, 'share.line1-for', { name: 'Sarah' })).toMatch(/:$/)
        expect(render(lang, 'share.line1')).toMatch(/:$/)
      },
    )
  })

  it.each(languages)(
    'says where the greeting is found again, with the two names, in %s',
    (lang) => {
      const transactions = i18n.global.t('navigation.transactions', {}, { locale: lang })
      const links = i18n.global.t('gdd_per_link.links_sum', {}, { locale: lang })
      const sentence = render(lang, 'done.find-again', { transactions, links })

      expect(sentence).toContain(transactions)
      expect(sentence).toContain(links)
      expect(sentence).not.toMatch(/[{}]/)
    },
  )

  /**
   * The texts of a photo of one's own (ZE-019): the tile, how another photo is chosen, whose
   * photo it is, and the sentence on "Fertig" that says who sees it.
   */
  describe('a photo of one’s own', () => {
    // The tile stands in a row of tiles 135 pixels wide on a small phone: short, and one line.
    it.each(languages)(
      'names the tile and the way to another photo in few words, in %s',
      (lang) => {
        for (const key of ['picture.own', 'picture.other']) {
          const words = render(lang, key)

          expect(words, key).not.toMatch(/[{}|.]/)
          expect(words.length, `${key}: ${words}`).toBeLessThanOrEqual(20)
          expect(words.split(/\s+/).length, `${key}: ${words}`).toBeLessThanOrEqual(3)
        }
        expect(render(lang, 'picture.own')).not.toBe(render(lang, 'picture.other'))
      },
    )

    /**
     * A duplicated greeting whose photo did not come along (ZE-030) says so over the tiles: what
     * happened, and what to do -- choose the photo again, or take one of the pictures below.
     */
    it.each(languages)('says in two sentences that a photo did not come along, in %s', (lang) => {
      const said = render(lang, 'picture.not-taken-over')

      expect(said).toBe(greetingIn(lang).picture['not-taken-over'])
      expect(said).not.toMatch(/[{}|]/)
      expect(said).toMatch(/\.$/)
      expect(said.split(/\.\s+/)).toHaveLength(2)
      expect(said).not.toMatch(NOT_A_THANK_YOU[lang])
    })

    it('says it in German as it was decided', () => {
      expect(render('de', 'picture.not-taken-over')).toBe(
        'Das Foto ließ sich nicht übernehmen. Wähle es neu aus oder nimm ein Motiv.',
      )
    })

    // The name as it is written, in the nominative: no language bends it.
    it.each(languages)('says whose photo it is, with the name as it stands, in %s', (lang) => {
      const words = render(lang, 'photo-of', { name: 'Oma-Emma' })

      expect(words).toContain('Oma-Emma')
      expect(words).not.toMatch(/[{}|]/)
      expect(words).not.toMatch(/\.$/)
      expect(words.replace('Oma-Emma', '').trim().length).toBeGreaterThan(2)
    })

    it.each(languages)(
      'says on "Fertig" that whoever has the link sees the photo, in two sentences, in %s',
      (lang) => {
        const withPhoto = render(lang, 'done.link-hint-photo')
        const without = render(lang, 'done.link-hint')

        expect(withPhoto).not.toMatch(/[{}|]/)
        expect(withPhoto).toMatch(/\.$/)
        expect(withPhoto.split(/\.\s/)).toHaveLength(2)
        // The second sentence -- send it only to whom it is meant for -- is the one it was.
        expect(withPhoto.split(/\.\s/)[1]).toBe(without.split(/\.\s/)[1])
        // And the first says more than it did: it names the photo.
        expect(withPhoto.length).toBeGreaterThan(without.length)
      },
    )

    it('names the photo in German as Bernd wrote the sentence', () => {
      expect(render('de', 'done.link-hint-photo')).toBe(
        'Wer den Link hat, sieht Dein Foto und kann den Dank annehmen. Schick ihn nur dem Menschen, für den er gedacht ist.',
      )
      expect(render('de', 'picture.own')).toBe('Eigenes Foto')
      expect(render('de', 'photo-of', { name: 'Oma-Emma' })).toBe('Foto von Oma-Emma')
    })
  })

  /**
   * "Noch einen für jemand anderen" on the result (ZE-030): one more greeting of the same, for
   * the next person. The label of a button under everything else -- a few words, no sentence --,
   * and another one than "Duplizieren" in the menu of a link: that one takes everything over,
   * this one asks whom the next greeting is for.
   */
  describe('one more for somebody else, on the result', () => {
    it.each(languages)('is the label of a button, in %s', (lang) => {
      const label = render(lang, 'done.another')

      expect(label).toBe(greetingIn(lang).done.another)
      expect(label).not.toMatch(/[{}|.!?]/)
      expect(label.length, label).toBeLessThanOrEqual(34)
      // "one more", and "for somebody else": more than a word or two.
      expect(label.split(/\s+/).length, label).toBeGreaterThanOrEqual(4)
      expect(label).not.toBe(fileOf(lang).gdd_per_link.duplicate)
      expect(label).not.toMatch(NOT_A_THANK_YOU[lang])
    })

    it('reads in German as it was decided', () => {
      expect(render('de', 'done.another')).toBe('Noch einen für jemand anderen')
    })
  })

  it.each(languages)('says until when the greeting waits, as one sentence, in %s', (lang) => {
    const day = i18n.global.d(new Date('2026-10-16T12:00:00.000Z'), 'short', lang)
    const sentence = render(lang, 'done.waits-until', { date: day })

    expect(sentence).toContain(day)
    expect(sentence).not.toMatch(/\.\.|[{}]/)
    expect(sentence).toMatch(/\.$/)
  })

  /**
   * ⛔ What stands on the back of the printed sheet (utils/thankYouGreetingSheet.js): what waits,
   * how the code is read and the thank-you accepted and until when, and that it costs nothing.
   * Paper cannot be corrected.
   */
  describe('the three sentences on the back of the printed sheet', () => {
    // As Bernd confirmed them (04.10.2026).
    it('are, in German, word for word what was decided', () => {
      expect(render('de', 'sheet.waits', { amount: '20 Gradido' })).toBe(
        'Dein Dank wartet: 20 Gradido',
      )
      expect(render('de', 'sheet.scan', { date: '18.10.2026' })).toBe(
        'Halte die Kamera Deines Handys auf den Code und nimm ihn an — bis zum 18.10.2026.',
      )
    })

    // ⛔ Bernd, with the first printed card in hand (04.10.2026): who thanks stands on the back,
    // over the code -- "Oma Emma sagt dir Danke" was his wording; on paper "Dir" has its capital.
    it('name who thanks, in German as it was decided', () => {
      expect(render('de', 'sheet.from', { name: 'Oma-Emma' })).toBe('Oma-Emma sagt Dir Danke')
    })

    // A caption over the code, not a sentence in a text: it begins with the name as it is
    // written, says in a few words that this person thanks, and ends without a full stop.
    it.each(languages)('name who thanks, beginning with the name, in %s', (lang) => {
      const from = render(lang, 'sheet.from', { name: 'Oma-Emma' })

      expect(from.startsWith('Oma-Emma ')).toBe(true)
      expect(from).not.toMatch(/[{}|.!?:]/)
      // One word in Portuguese ("agradece-te"), four at most.
      const rest = from.replace('Oma-Emma ', '').split(/\s+/)
      expect(rest.length).toBeGreaterThanOrEqual(1)
      expect(rest.length).toBeLessThanOrEqual(4)
      expect(rest.join(' ').length).toBeGreaterThanOrEqual(8)
      // A user name may hold what a template would read as its own: it arrives as it was written.
      expect(render(lang, 'sheet.from', { name: 'A|b {c}' })).toContain('A|b {c}')
    })

    it.each(languages)('say what waits and end in the amount, after a colon, in %s', (lang) => {
      const waits = render(lang, 'sheet.waits', { amount: '12,5 Gradido' })

      expect(waits).toMatch(/\p{L}\s?: 12,5 Gradido$/u)
      expect(waits).not.toMatch(/[{}|]/)
      // More than the amount and its colon: it says that something waits.
      expect(waits.replace(': 12,5 Gradido', '').trim().split(/\s+/).length).toBeGreaterThan(1)
    })

    // With days as the wallet writes them: a first, an eighth, an eleventh, a last of the year.
    it.each(languages)(
      'say how the thank-you is accepted and until when, as one sentence, in %s',
      (lang) => {
        for (const day of ['2026-10-01', '2026-10-08', '2026-10-11', '2026-10-18', '2026-12-31']) {
          const date = i18n.global.d(new Date(`${day}T12:00:00.000Z`), 'short', lang)
          const scan = render(lang, 'sheet.scan', { date })

          expect(scan).toContain(date)
          expect(scan).not.toMatch(/\.\.|[{}|]/)
          expect(scan).toMatch(/\.$/)
          // One sentence: no full stop but the last one, and those of the date.
          expect(scan.replace(date, '').slice(0, -1)).not.toMatch(/[.!?]/)
        }
      },
    )

    // ⛔ Bernd, with the first printed card in hand (04.10.2026): the back does not say what the
    // card costs -- "Kostenfrei. Keine Verpflichtung." sounds like business on a card that is
    // handed over in person. The sentence is gone from every language.
    it.each(languages)('do not say what the card costs, in %s', (lang) => {
      expect(i18n.global.te('thank-you-greeting.sheet.free', lang)).toBe(false)
      expect(Object.keys(i18n.global.getLocaleMessage(lang)['thank-you-greeting'].sheet)).toEqual([
        'from',
        'scan',
        'waits',
      ])
    })

    // The whole Russian file speaks formally; a printed sentence must not be the exception.
    it('speak formally in Russian, and with a small "вы"', () => {
      const sentences = ['sheet.from', 'sheet.waits', 'sheet.scan', 'paper.failed'].map((key) =>
        render('ru', key, { name: 'Эмма', amount: '20 Gradido', date: '18.10.2026' }),
      )

      for (const sentence of sentences) {
        expect(sentence).not.toMatch(
          /(?<!\p{L})(ты|тебя|тебе|тобой|твой|твоя|твоё|твои)(?!\p{L})/iu,
        )
        // A capital only where a sentence begins.
        expect(sentence).not.toMatch(
          /(?<!^)(?<![.!?] )(?<!\p{L})(Вы|Вас|Вам|Вами|Ваш\p{L}{0,2})(?!\p{L})/u,
        )
      }
      expect(sentences.join(' ')).toMatch(/(?<!\p{L})(вас|наведите|примите|попробуйте)(?!\p{L})/iu)
    })
  })

  /**
   * On "Fertig" and in the menu of a greeting in the list: the greeting on paper. Two ways, a
   * word over them, and the sentence that says what becomes of the sheet.
   */
  describe('the greeting on paper', () => {
    it('reads in German as it was decided', () => {
      expect(render('de', 'paper.title')).toBe('Oder auf Papier')
      expect(render('de', 'paper.print')).toBe('Karte drucken')
      expect(render('de', 'paper.save')).toBe('Karte als Bild sichern')
      expect(render('de', 'paper.hint')).toBe(
        'Ein A4-Blatt, einseitig bedruckt. Falte es zweimal, die bedruckte Seite nach außen: Dein Bild liegt dann vorn, Deine Worte stehen innen, und daneben ist Platz für Deine Handschrift.',
      )
    })

    // Two entries of a menu and a word over a group: short, and no sentences.
    it.each(languages)('names the two ways and their group in few words, in %s', (lang) => {
      const words = ['paper.title', 'paper.print', 'paper.save'].map((key) => render(lang, key))

      for (const text of words) {
        expect(text).not.toMatch(/[{}|.!?:]/)
        expect(text.length, text).toBeLessThanOrEqual(32)
        expect(text.split(/\s+/).length, text).toBeLessThanOrEqual(5)
      }
      expect(new Set(words).size).toBe(3)
    })

    // ⚠️ A claim about the sheet (thankYouGreetingSheet.spec.js holds it against the panels):
    // the paper and how it is printed, then how it is folded and what lies where.
    it.each(languages)('says what the sheet is and what becomes of it, in %s', (lang) => {
      const hint = render(lang, 'paper.hint')

      expect(hint).toContain('A4')
      expect(hint).not.toMatch(/[{}|]/)
      expect(hint).toMatch(/\.$/)
      // The paper first, in a sentence of its own; then the folding, up to a colon or a
      // semicolon, and what lies where.
      const [paper, ...rest] = hint.split('. ')
      expect(paper).toContain('A4')
      expect(rest).toHaveLength(1)
      expect(rest[0]).toMatch(/[:;] \p{L}/u)
    })
  })

  it.each(languages)(
    'says in one sentence each that a card could not be made, and what to do, in %s',
    (lang) => {
      const failed = render(lang, 'paper.failed')

      expect(failed).not.toMatch(/[{}|]/)
      expect(failed).toMatch(/[.!]$/)
      expect(failed.split(/[.!]\s/)).toHaveLength(2)
    },
  )

  // On the sheet, through the sheet itself: the capitals are made there.
  describe('"FÜR {NAME}" on the sheet', () => {
    const forWhom = (lang, name) => {
      i18n.global.locale.value = lang
      const wrapper = mount(RedeemThanksPaper, {
        props: {
          linkData: {
            amount: '20',
            memo: 'Danke!',
            senderUser: { alias: 'Oma-Emma', gradidoID: 'uuid' },
            greeting: { motif: null, line: null, recipientName: name },
          },
        },
        global: { plugins: [i18n] },
      })
      return wrapper.find('[data-test="redeem-thanks-paper-for"]').text()
    }

    beforeEach(() => {
      i18n.global.locale.value = 'de'
    })

    it.each(languages)('carries the name, all in capitals, in %s', (lang) => {
      const shown = forWhom(lang, 'Sarah')

      expect(shown).toContain('SARAH')
      expect(shown).toBe(shown.toLocaleUpperCase(lang))
      expect(shown).not.toMatch(/[{}]/)
    })

    // A dotless capital I would read "ıçın" back: Turkish has two i, and the capital of the
    // dotted one keeps its dot.
    it('writes the Turkish "için" as "İÇİN"', () => {
      expect(forWhom('tr', 'Sarah')).toBe('SARAH İÇİN')
      expect(forWhom('tr', 'Sarah')).not.toContain('IÇIN')
    })

    it('writes Greek capitals without their accents', () => {
      expect(forWhom('el', 'Σοφία')).toBe('ΓΙΑ: ΣΟΦΙΑ')
    })

    it('writes the German sharp s and umlauts as capitals', () => {
      expect(forWhom('de', 'Jörg Weiß')).toBe('FÜR JÖRG WEISS')
    })
  })
})
