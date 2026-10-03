// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, jest, mock } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { GradidoUnit } from 'shared'
import { CONFIG } from '../config'
import { i18n } from '../locales/localization'
import * as sendEmailTranslatedApi from './sendEmailTranslated'
import { sendTransactionLinkRedeemedEmail } from './sendEmailVariants'

// The setup of sendEmailVariants.test.ts: a transport that takes every mail, so that the mail is
// rendered and can be read. A file of its own rather than more of that one: Bun 1.3 caches the
// transpiled form of a source file over 50 KB, and on the next run the cached test file no longer
// loads the picture the mails attach (templates/includes/chatbox-icon.png).
CONFIG.EMAIL = true
CONFIG.EMAIL_SENDER = 'info@gradido.net'
CONFIG.EMAIL_SMTP_HOST = 'localhost'
CONFIG.EMAIL_SMTP_PORT = 1025
CONFIG.EMAIL_TLS = false
CONFIG.EMAIL_TEST_MODUS = false

mock.module('nodemailer', () => {
  return {
    __esModule: true,
    createTransport: jest.fn(() => {
      return {
        sendMail: () => {
          return {
            messageId: 'message',
          }
        },
      }
    }),
  }
})

const sendEmailTranslatedSpy = jest.spyOn(sendEmailTranslatedApi, 'sendEmailTranslated')

/**
 * ⚠️ sendEmailTranslated sets the locale of the whole process to the language of its mail and
 * does not put it back. This file sends in ten languages; left alone, the process stays in the
 * last of them, and localization.test.ts -- which reads a phrase by that locale and expects
 * English -- fails wherever it happens to run after this file: never on a Mac, where it runs
 * first, and in the CI, where it runs later. So every test here hands the locale back as the
 * file found it, and the last one of the file holds that.
 */
const localeBefore = i18n.getLocale()
afterEach(() => {
  i18n.setLocale(localeBefore)
})

/**
 * The mail to whoever made a transaction link, once somebody accepted it -- measured at the
 * rendered mail (pug, email-templates, juice), in German: "… hat Deinen Dank angenommen", for
 * every link; one whole sentence where the person is new; and a button into the conversation
 * with them, where the two uuids name them.
 */
describe('the mail about an accepted link', () => {
  afterEach(() => {
    sendEmailTranslatedSpy.mockClear()
  })

  const LINE = 'Einfach so — weil es Dich gibt.'
  const accepted = {
    firstName: 'Emma',
    lastName: 'Wald',
    email: 'emma@wald.de',
    language: 'de',
    // Whoever accepted: the mail is about them.
    senderAlias: 'Sarah-B',
    senderCommunity: 'KI Playground',
    transactionMemo: `${LINE}\nLiebe Sarah, mit Eurem iPad hat alles angefangen.`,
    transactionAmount: GradidoUnit.fromNumber(20),
  }
  // With letters, in both cases: an address built from the wrong one of the two would show.
  const WITH = '3f9a1e2c-1111-4a2b-9c3d-0000000000ab'
  const COMMUNITY = 'AAAA1111-2222-4333-8444-5555666677cd'
  const PAIR = { senderUuid: WITH, senderCommunityUuid: COMMUNITY }
  // In the rendered attribute the `&` is `&amp;`, which the mail client reads as `&`.
  const CONVERSATION = `${CONFIG.COMMUNITY_URL}/contacts?with=${WITH}&amp;community=${COMMUNITY}`

  const sent = async (more: Record<string, unknown> = {}) => {
    const result: any = await sendTransactionLinkRedeemedEmail({ ...accepted, ...more })
    return result.originalMessage as { subject: string; html: string; text: string }
  }

  it('says that the thank-you was accepted: subject, heading and sentence', async () => {
    const mail = await sent()

    expect(mail.subject).toBe('Sarah-B hat Deinen Dank angenommen')
    expect(mail.html).toContain('>Sarah-B hat Deinen Dank angenommen</h2>')
    expect(mail.html).toContain('<p>Sarah-B (KI Playground) hat soeben Deinen Dank angenommen.</p>')
    // The words this mail had: a link that was redeemed.
    expect(mail.html).not.toContain('eingelöst')
    expect(mail.html).not.toContain('Gradido-Link')
    expect(mail.subject).not.toContain('eingelöst')
    expect(mail.html).not.toContain('neu bei Gradido')
  })

  /**
   * ⛔ One whole sentence of the catalogue. It used to be a half-sentence glued behind the first
   * one in the template, and the mail read "… eingelöst. — und ist neu bei Gradido."
   */
  it('says the arrival of a new member in the same sentence, with no full stop before the dash', async () => {
    const mail = await sent({ newMember: true })

    expect(mail.html).toContain(
      '<p>Sarah-B (KI Playground) hat soeben Deinen Dank angenommen — und ist neu bei Gradido. Schön, dass Du es gezeigt hast.</p>',
    )
    expect(mail.html).not.toContain('. —')
    // The sentence without the arrival does not stand beside it.
    expect(mail.html).not.toContain('angenommen.</p>')
    expect(mail.subject).toBe('Sarah-B hat Deinen Dank angenommen')
  })

  // The card is the one this mail always had; of a greeting it shows what the booking holds --
  // the memo, which begins with the greeting's line.
  it('keeps the card: the amount, the memo with its line breaks, the way to the details', async () => {
    const mail = await sent(PAIR)

    expect(mail.html).toContain('>Transaktionsdetails</h2>')
    expect(mail.html).toContain('Betrag: 20,00 GDD')
    expect(mail.html).toMatch(
      /<span class="human-text"[^>]*>Nachricht: Einfach so — weil es Dich gibt\.\nLiebe Sarah, mit Eurem iPad hat alles angefangen\.<\/span>/,
    )
    expect(mail.html).toContain('Details zur Transaktion findest Du in Deinem Gradido-Konto.')
    expect(mail.html).toContain('Bitte antworte nicht auf diese E-Mail.')
  })

  describe('the button into the conversation', () => {
    it('opens the contact page with the pair of whoever accepted', async () => {
      const mail = await sent(PAIR)

      expect(mail.html).toMatch(
        new RegExp(
          `<a class="button-5" href="${CONVERSATION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`,
        ),
      )
      expect(mail.html).toContain('<span>Zum Gespräch</span></a>')
      // One such button, and no way into the send form.
      expect(mail.html.split('class="button-5"')).toHaveLength(2)
      expect(mail.html).not.toContain('/send/')
      expect(sendEmailTranslatedSpy).toBeCalledWith({
        receiver: { to: 'Emma Wald <emma@wald.de>' },
        template: 'transactionLinkRedeemed',
        locals: expect.objectContaining(PAIR),
      })
    })

    // Inside the card, under the details, over the gold way into the account -- on a line of
    // its own, 25px over the gold button.
    it('stands in the card between the details and the way into the account', async () => {
      const { html } = await sent(PAIR)
      const at = (piece: string) => {
        const index = html.indexOf(piece)
        expect(index).toBeGreaterThan(-1)
        return index
      }

      const order = [
        at('<div class="content"'),
        at('Details zur Transaktion findest Du'),
        at('<div><a class="button-5"'),
        at('</a></div><a class="button-3"'),
        at('>Zum Konto</a>'),
        at('Bitte antworte nicht auf diese E-Mail.'),
      ]
      expect(order).toEqual([...order].sort((a, b) => a - b))
      const button = html.slice(at('<a class="button-5"'), at('<span>Zum Gespräch</span>'))
      // The stylesheet gives every button 25px above and below; this one has none below.
      expect(button).toContain('margin: 25px 0 0 0;')
      expect(button.match(/margin:/g)).toHaveLength(1)
    })

    it('is in the text of the mail as well, with its address', async () => {
      const mail = await sent(PAIR)

      expect(mail.text).toContain(
        `${CONFIG.COMMUNITY_URL}/contacts?with=${WITH}&community=${COMMUNITY}`,
      )
      expect(mail.text).toContain('Zum Gespräch')
    })

    it.each([
      ['nobody is named', {}],
      ['the member is not named', { senderCommunityUuid: COMMUNITY }],
      ['the community is not named', { senderUuid: WITH }],
      ['the community is null', { senderUuid: WITH, senderCommunityUuid: null }],
      ['the member is null', { senderUuid: null, senderCommunityUuid: COMMUNITY }],
      ['both are empty', { senderUuid: '', senderCommunityUuid: '' }],
    ])('is left out where %s, and the way into the account stays', async (_what, pair) => {
      const mail = await sent(pair)

      // The class as an element carries it: the stylesheet in the mail's head names it too.
      expect(mail.html).not.toContain('class="button-5"')
      expect(mail.html).not.toContain('/contacts?')
      expect(mail.html).not.toContain('Zum Gespräch')
      expect(mail.text).not.toContain('/contacts?')
      expect(mail.html).toContain(`href="${CONFIG.COMMUNITY_URL}/transactions"`)
      expect(mail.html).toContain('>Zum Konto</a>')
      expect(mail.html).toContain(
        '<p>Sarah-B (KI Playground) hat soeben Deinen Dank angenommen.</p>',
      )
    })
  })
})

/**
 * The same mail in each of the ten languages, rendered: the catalogue's own sentences with the
 * two names set in, nothing of the mail's old words, and the button under a label of its own.
 *
 * The sentences are read from the catalogue files, not written out a second time here: what is
 * held is that the template asks for these keys in every language, that both placeholders are
 * filled, and that no language falls back to English without anybody noticing.
 */
describe('the mail about an accepted link, in every language', () => {
  const LANGUAGES = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'el', 'tr']
  type Catalogue = {
    emails: {
      general: Record<string, string>
      transactionLinkRedeemed: Record<string, string>
    }
  }
  const catalogue = (language: string): Catalogue =>
    JSON.parse(readFileSync(join(__dirname, '..', 'locales', `${language}.json`), 'utf8'))
  const filled = (sentence: string) =>
    sentence.replace('{senderAlias}', 'Sarah-B').replace('{senderCommunity}', 'KI Playground')
  // Pug writes these three as entities in a text; the catalogues use the first of them.
  const inHtml = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const mailIn = async (language: string, more: Record<string, unknown> = {}) => {
    const result: any = await sendTransactionLinkRedeemedEmail({
      firstName: 'Emma',
      lastName: 'Wald',
      email: 'emma@wald.de',
      language,
      senderAlias: 'Sarah-B',
      senderCommunity: 'KI Playground',
      senderUuid: '3f9a1e2c-1111-4a2b-9c3d-0000000000ab',
      senderCommunityUuid: 'aaaa1111-2222-4333-8444-5555666677cd',
      transactionMemo: 'Einfach so — weil es Dich gibt.',
      transactionAmount: GradidoUnit.fromNumber(20),
      ...more,
    })
    return result.originalMessage as { subject: string; html: string; text: string }
  }

  it('has the five texts of this mail in every catalogue, and none of the two it had', () => {
    for (const language of LANGUAGES) {
      const { emails } = catalogue(language)
      expect(Object.keys(emails.transactionLinkRedeemed).sort()).toEqual([
        'hasAcceptedYourThanks',
        'hasAcceptedYourThanksNewMember',
        'memo',
        'subject',
        'title',
      ])
      expect(emails.general.toConversation, language).toBeTruthy()
    }
  })

  it.each(LANGUAGES)(
    'says the sentence of the catalogue, both names set in: %s',
    async (language) => {
      const texts = catalogue(language).emails.transactionLinkRedeemed
      const mail = await mailIn(language)

      expect(mail.subject).toBe(filled(texts.subject))
      expect(mail.html).toContain(`>${inHtml(filled(texts.title))}</h2>`)
      expect(mail.html).toContain(`<p>${inHtml(filled(texts.hasAcceptedYourThanks))}</p>`)
      // Both placeholders were there to be filled, and nothing of a key stands in the mail.
      expect(texts.hasAcceptedYourThanks).toContain('{senderAlias}')
      expect(texts.hasAcceptedYourThanks).toContain('{senderCommunity}')
      expect(mail.html).not.toContain('{sender')
      expect(mail.html).not.toContain('emails.')
    },
  )

  it.each(LANGUAGES)(
    'says the arrival of a new member in one sentence of its own: %s',
    async (language) => {
      const texts = catalogue(language).emails.transactionLinkRedeemed
      const mail = await mailIn(language, { newMember: true })

      expect(mail.html).toContain(`<p>${inHtml(filled(texts.hasAcceptedYourThanksNewMember))}</p>`)
      expect(mail.html).not.toContain(`<p>${inHtml(filled(texts.hasAcceptedYourThanks))}</p>`)
      // One piece of text: longer than the plain sentence, and no full stop stands before a dash.
      expect(texts.hasAcceptedYourThanksNewMember.length).toBeGreaterThan(
        texts.hasAcceptedYourThanks.length,
      )
      expect(texts.hasAcceptedYourThanksNewMember).not.toMatch(/\.\s*[—–-]\s/)
      expect(texts.hasAcceptedYourThanksNewMember).toContain('{senderAlias}')
      expect(texts.hasAcceptedYourThanksNewMember).toContain('{senderCommunity}')
    },
  )

  it.each(LANGUAGES)('names the button in its own words: %s', async (language) => {
    const label = catalogue(language).emails.general.toConversation
    const mail = await mailIn(language)

    expect(mail.html).toContain(`<span>${inHtml(label)}</span></a></div><a class="button-3"`)
    expect(mail.html.split('class="button-5"')).toHaveLength(2)
  })

  // A language that lost its words would read the English ones, and every assertion above
  // would still hold for it.
  it('gives every language words of its own', () => {
    const english = catalogue('en').emails
    for (const language of LANGUAGES.filter((code) => code !== 'en')) {
      const { transactionLinkRedeemed: texts, general } = catalogue(language).emails
      for (const key of [
        'subject',
        'title',
        'hasAcceptedYourThanks',
        'hasAcceptedYourThanksNewMember',
      ]) {
        expect(texts[key], `${language} ${key}`).not.toBe(english.transactionLinkRedeemed[key])
      }
      // French shares the word with English; every other label is its own.
      if (language !== 'fr') {
        expect(general.toConversation, language).not.toBe(english.general.toConversation)
      }
    }
  })

  /**
   * The button stands on one line on a phone of 320 px: there the card leaves it 216 px, and
   * "Zum Gespräch" takes 204 of them in the mail's font (measured in the rendered mail,
   * 03.10.2026). A label of more than thirteen letters did not fit in any of the ten -- "Para a
   * conversa" was over by 1.4 px --, so en, es, fr, it, nl and pt carry a shorter form. Not a
   * measure, which a test without a browser cannot take: a tripwire for the next edit.
   */
  it('keeps the label short enough for one line on a small phone', () => {
    for (const language of LANGUAGES) {
      const label = catalogue(language).emails.general.toConversation
      expect(Array.from(label).length, `${language}: ${label}`).toBeLessThanOrEqual(13)
    }
  })
})

// The last test of the file, after a mail in each of the ten languages has been sent.
describe('the locale of the process', () => {
  it('is what it was before this file sent its mails', () => {
    expect(i18n.getLocale()).toBe(localeBefore)
  })
})
