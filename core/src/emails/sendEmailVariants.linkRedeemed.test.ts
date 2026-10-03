// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, jest, mock } from 'bun:test'
import { GradidoUnit } from 'shared'
import { CONFIG } from '../config'
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
