// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, jest, mock } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { GradidoUnit } from 'shared'
import { CONFIG } from '../config'
import * as sendEmailTranslatedApi from './sendEmailTranslated'
import { sendTransactionReactionReceivedEmail } from './sendEmailVariants'

// The setup of sendEmailVariants.test.ts: a transport that takes every mail, so that the mail is
// rendered and can be read. A file of its own, as sendEmailVariants.linkRedeemed.test.ts is.
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

// Two bytes, and four: a mail client has to show both as the sentence has them.
const HEART = '❤'
const HANDS = '🙏'

/**
 * The mail to whoever sent a transfer, once its recipient reacted to it for the first time (W1,
 * "Dein Dank ist angekommen") -- measured at the rendered mail (pug, email-templates, juice), in
 * German: the subject and the heading without a name and without the emoji, the sentence with
 * both, the card with the amount and the memo, and a button into the conversation with the
 * recipient where the two uuids name them.
 */
describe('the mail about a first reaction', () => {
  afterEach(() => {
    sendEmailTranslatedSpy.mockClear()
  })

  const reacted = {
    firstName: 'Emma',
    lastName: 'Wald',
    email: 'emma@wald.de',
    language: 'de',
    // Whoever reacted: the mail is about them.
    recipientAlias: 'Sarah-B',
    recipientCommunity: 'KI Playground',
    emoji: HANDS,
    transactionMemo: 'Danke fürs Reparieren der Gartenbank — sie steht wieder wie neu.',
    transactionAmount: GradidoUnit.fromNumber(12.5),
  }
  // With letters, in both cases: an address built from the wrong one of the two would show.
  const WITH = '3f9a1e2c-1111-4a2b-9c3d-0000000000ab'
  const COMMUNITY = 'AAAA1111-2222-4333-8444-5555666677cd'
  const PAIR = { recipientUuid: WITH, recipientCommunityUuid: COMMUNITY }
  // In the rendered attribute the `&` is `&amp;`, which the mail client reads as `&`.
  const CONVERSATION = `${CONFIG.COMMUNITY_URL}/contacts?with=${WITH}&amp;community=${COMMUNITY}`

  const sent = async (more: Record<string, unknown> = {}) => {
    const result: any = await sendTransactionReactionReceivedEmail({ ...reacted, ...more })
    return result.originalMessage as { subject: string; html: string; text: string }
  }

  it('says that the thank-you arrived: the same subject and heading for every such mail', async () => {
    const mail = await sent()

    expect(mail.subject).toBe('Dein Dank ist angekommen')
    expect(mail.html).toContain('>Dein Dank ist angekommen</h2>')
    // Neither carries the name or the emoji: those stand in the sentence.
    expect(mail.subject).not.toContain('Sarah-B')
    expect(mail.subject).not.toContain(HANDS)
    expect(mail.html).not.toContain(`${HANDS}</h2>`)
    expect(sendEmailTranslatedSpy).toBeCalledWith({
      receiver: { to: 'Emma Wald <emma@wald.de>' },
      template: 'transactionReactionReceived',
      locals: expect.objectContaining({
        recipientAlias: 'Sarah-B',
        recipientCommunity: 'KI Playground',
        emoji: HANDS,
        transactionAmount: '12,50',
        transactionMemo: reacted.transactionMemo,
      }),
    })
  })

  it.each([
    ['of four bytes', HANDS],
    ['of two bytes', HEART],
  ])('says who was glad, and shows the emoji %s in the sentence', async (_bytes, emoji) => {
    const mail = await sent({ emoji })

    expect(mail.html).toContain(
      `<p>Sarah-B (KI Playground) hat sich über Deinen Dank gefreut: ${emoji}</p>`,
    )
    expect(mail.text).toContain(
      `Sarah-B (KI Playground) hat sich über Deinen Dank gefreut: ${emoji}`,
    )
    // Once, in the sentence -- and nowhere else in the html but the stylesheet-free body.
    expect(mail.html.split(emoji)).toHaveLength(2)
  })

  // The card as the mail about an accepted link has it: which thank-you is meant.
  it('keeps the card: the amount, the memo with its line breaks, the way to the details', async () => {
    const mail = await sent({ transactionMemo: 'Danke für die Bank.\nSie steht wieder wie neu.' })

    expect(mail.html).toContain('>Transaktionsdetails</h2>')
    expect(mail.html).toContain('Betrag: 12,50 GDD')
    expect(mail.html).toMatch(
      /<span class="human-text"[^>]*>Nachricht: Danke für die Bank\.\nSie steht wieder wie neu\.<\/span>/,
    )
    expect(mail.html).toContain('Details zur Transaktion findest Du in Deinem Gradido-Konto.')
    expect(mail.html).toContain('Bitte antworte nicht auf diese E-Mail.')
  })

  // No value in another currency anywhere, and no "payment" (E-018): the thank-you register.
  it('says nothing of a payment, and names no other currency', async () => {
    const mail = await sent()

    for (const word of ['Zahlung', 'EUR', '€', 'Euro', 'bezahlt']) {
      expect(mail.html).not.toContain(word)
      expect(mail.subject).not.toContain(word)
    }
  })

  it('leaves the memo line out where the transfer has no memo', async () => {
    const mail = await sent({ transactionMemo: '' })

    expect(mail.html).not.toContain('Nachricht:')
    expect(mail.html).not.toContain('class="human-text"')
    expect(mail.html).toContain('Betrag: 12,50 GDD')
    expect(mail.html).toContain('Details zur Transaktion findest Du in Deinem Gradido-Konto.')
  })

  describe('the button into the conversation', () => {
    it('opens the contact page with the pair of whoever reacted', async () => {
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
    })

    // Inside the card, under the details, over the gold way into the account -- on a line of
    // its own, 25px over the gold button, as the mail about an accepted link has it.
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

    // Whatever the two hold stays ONE value of the address each: it ends no value, begins no
    // second one, and no fragment. In the html the "&" between the two values is an entity.
    it('writes each of the two as one value of the address, whatever it holds', async () => {
      const mail = await sent({
        recipientUuid: 'x&community=other#top "q"',
        recipientCommunityUuid: 'c d&with=someone',
      })
      const address = `${CONFIG.COMMUNITY_URL}/contacts?with=x%26community%3Dother%23top%20%22q%22&community=c%20d%26with%3Dsomeone`

      expect(mail.html).toContain(`<a class="button-5" href="${address.replace('&', '&amp;')}"`)
      expect(mail.text).toContain(address)
      for (const part of [mail.html, mail.text]) {
        expect(part).not.toContain('community=other')
        expect(part).not.toContain('with=someone')
      }
    })

    it.each([
      ['nobody is named', {}],
      ['the member is not named', { recipientCommunityUuid: COMMUNITY }],
      ['the community is not named', { recipientUuid: WITH }],
      ['the community is null', { recipientUuid: WITH, recipientCommunityUuid: null }],
      ['the member is null', { recipientUuid: null, recipientCommunityUuid: COMMUNITY }],
      ['both are empty', { recipientUuid: '', recipientCommunityUuid: '' }],
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
        `<p>Sarah-B (KI Playground) hat sich über Deinen Dank gefreut: ${HANDS}</p>`,
      )
    })
  })
})

/**
 * The same mail in each of the ten languages, rendered: the catalogue's own sentences with the
 * two names and the emoji set in, the subject without either, and the button under a label of
 * its own.
 *
 * The sentences are read from the catalogue files, not written out a second time here: what is
 * held is that the template asks for these keys in every language, that every placeholder is
 * filled, and that no language falls back to English without anybody noticing.
 */
describe('the mail about a first reaction, in every language', () => {
  const LANGUAGES = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'el', 'tr']
  type Catalogue = {
    emails: {
      general: Record<string, string>
      transactionReactionReceived: Record<string, string>
    }
  }
  const catalogue = (language: string): Catalogue =>
    JSON.parse(readFileSync(join(__dirname, '..', 'locales', `${language}.json`), 'utf8'))
  const filled = (sentence: string) =>
    sentence
      .replace('{recipientAlias}', 'Sarah-B')
      .replace('{recipientCommunity}', 'KI Playground')
      .replace('{emoji}', HANDS)
  // Pug writes these three as entities in a text; the catalogues use the first of them.
  const inHtml = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const mailIn = async (language: string) => {
    const result: any = await sendTransactionReactionReceivedEmail({
      firstName: 'Emma',
      lastName: 'Wald',
      email: 'emma@wald.de',
      language,
      recipientAlias: 'Sarah-B',
      recipientCommunity: 'KI Playground',
      emoji: HANDS,
      recipientUuid: '3f9a1e2c-1111-4a2b-9c3d-0000000000ab',
      recipientCommunityUuid: 'aaaa1111-2222-4333-8444-5555666677cd',
      transactionMemo: 'Danke fürs Reparieren der Gartenbank.',
      transactionAmount: GradidoUnit.fromNumber(12.5),
    })
    return result.originalMessage as { subject: string; html: string; text: string }
  }

  it('has the four texts of this mail in every catalogue, and no key on stock', () => {
    for (const language of LANGUAGES) {
      const { emails } = catalogue(language)
      expect(Object.keys(emails.transactionReactionReceived).sort()).toEqual([
        'hasEnjoyedYourThanks',
        'memo',
        'subject',
        'title',
      ])
      expect(emails.general.toConversation, language).toBeTruthy()
    }
  })

  it.each(LANGUAGES)(
    'says the sentence of the catalogue, both names and the emoji set in: %s',
    async (language) => {
      const texts = catalogue(language).emails.transactionReactionReceived
      const mail = await mailIn(language)

      expect(mail.subject).toBe(texts.subject)
      expect(mail.html).toContain(`>${inHtml(texts.title)}</h2>`)
      expect(mail.html).toContain(`<p>${inHtml(filled(texts.hasEnjoyedYourThanks))}</p>`)
      // All three placeholders were there to be filled, and nothing of a key stands in the mail.
      expect(texts.hasEnjoyedYourThanks).toContain('{recipientAlias}')
      expect(texts.hasEnjoyedYourThanks).toContain('{recipientCommunity}')
      expect(texts.hasEnjoyedYourThanks).toContain('{emoji}')
      expect(texts.memo).toContain('{transactionMemo}')
      expect(mail.html).not.toContain('{recipient')
      expect(mail.html).not.toContain('{emoji')
      expect(mail.html).not.toContain('emails.')
      // The subject and the heading carry neither the name nor the emoji, in no language.
      for (const text of [texts.subject, texts.title]) {
        expect(text).not.toContain('{')
      }
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
      const { transactionReactionReceived: texts } = catalogue(language).emails
      for (const key of ['subject', 'title', 'hasEnjoyedYourThanks']) {
        expect(texts[key], `${language} ${key}`).not.toBe(english.transactionReactionReceived[key])
      }
    }
  })

  // The thank-you register in every language: no word for a payment, no other currency.
  it('names no payment and no other currency, in no language', async () => {
    for (const language of LANGUAGES) {
      const texts = Object.values(catalogue(language).emails.transactionReactionReceived).join(' ')
      expect(texts, language).not.toMatch(/€|EUR\b|Euro/)
    }
  })
})
