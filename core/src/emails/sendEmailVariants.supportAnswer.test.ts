// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, jest, mock } from 'bun:test'
import addressparser from 'nodemailer/lib/addressparser'
import { CONFIG } from '../config'
import * as sendEmailTranslatedApi from './sendEmailTranslated'
import { sendAddedSupportTicketMessageEmail } from './sendEmailVariants'

// The setup of sendEmailVariants.test.ts: a transport that takes every mail, so that the mail is
// rendered and can be read. A file of its own, as sendEmailVariants.reactionReceived.test.ts is.
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
 * The mail to a member whose support request a moderator answered (Support-Anfragen K3) --
 * measured at the rendered mail (pug, email-templates, juice): who answered which request, the
 * answer as the moderator typed it, how to answer, and the sentence an answer that closed the
 * request adds.
 */
describe('the mail about an answer to a support request', () => {
  afterEach(() => {
    sendEmailTranslatedSpy.mockClear()
  })

  // two paragraphs, bold, an address, and markup typed as words
  const ANSWER =
    'Morgens **giessen**, bitte.\nMehr unter https://gradido.net/garten <b>nicht fett</b>'
  const answered = {
    firstName: 'Bibi',
    lastName: 'Bloxberg',
    email: 'bibi@bloxberg.de',
    language: 'de',
    moderatorAlias: 'peter',
    supportTicketNumber: 42,
    message: ANSWER,
    closed: false,
  }
  const MY_REQUESTS = `${CONFIG.COMMUNITY_URL}/support/my-requests`

  const sent = async (more: Record<string, unknown> = {}) => {
    const result: any = await sendAddedSupportTicketMessageEmail({ ...answered, ...more })
    return result.originalMessage as { subject: string; html: string; text: string }
  }

  it('is an answer to the support request, in subject and heading', async () => {
    const mail = await sent()

    expect(mail.subject).toBe('Antwort auf Deine Support-Anfrage')
    expect(mail.html).toContain('>Antwort auf Deine Support-Anfrage</h2>')
    expect(sendEmailTranslatedSpy).toBeCalledWith({
      receiver: { to: '"Bibi Bloxberg" <bibi@bloxberg.de>' },
      template: 'addedSupportTicketMessage',
      locals: expect.objectContaining({
        moderatorAlias: 'peter',
        supportTicketNumber: 42,
        message: ANSWER,
        closed: false,
      }),
    })
  })

  it('says who answered which request, by username and number', async () => {
    const mail = await sent()
    expect(mail.html).toContain('<p>Hallo Bibi Bloxberg,</p>')
    expect(mail.html).toContain('<p>peter hat auf Deine Anfrage Nr. 42 geantwortet.</p>')
  })

  it('names the support where the moderator has no username', async () => {
    const mail = await sent({ moderatorAlias: null })
    expect(mail.html).toContain('<p>Der Support hat auf Deine Anfrage Nr. 42 geantwortet.</p>')
    expect(mail.html).not.toContain('null')
  })

  it('carries the answer as it was typed: its break, bold, the address as a link, markup as words', async () => {
    const mail = await sent()
    expect(mail.html).toContain('<strong>giessen</strong>')
    expect(mail.html).toContain('<a href="https://gradido.net/garten"')
    expect(mail.html).toContain('&lt;b&gt;nicht fett&lt;/b&gt;')
    expect(mail.html).not.toContain('<b>nicht fett</b>')
    // the break stands in the text, kept by the white-space of .human-text
    expect(mail.html).toMatch(/bitte\.\nMehr unter/)
  })

  it('leads to "Meine Anfragen" to answer, and on to the account', async () => {
    const mail = await sent()
    expect(mail.html).toContain('Nachricht lesen und beantworten')
    expect(mail.html).toContain('Antworten kannst Du direkt bei Deiner Anfrage.')
    expect(mail.html).toContain(`href="${MY_REQUESTS}"`)
    expect(mail.html).toContain('Jetzt antworten')
    expect(mail.html).toContain(`href="${CONFIG.COMMUNITY_URL}/transactions"`)
    expect(mail.html).toContain('Bitte antworte nicht auf diese E-Mail.')
    // an answer that left the request open says nothing of closing
    expect(mail.html).not.toContain('geschlossen')
  })

  it('says that an answer closed the request and that writing again opens it, with the same button', async () => {
    const mail = await sent({ closed: true })
    expect(mail.html).toContain(
      'Die Anfrage ist damit geschlossen. Schreibst Du noch einmal, ist sie wieder offen.',
    )
    expect(mail.html).toContain(`href="${MY_REQUESTS}"`)
    expect(mail.html).toContain('Antworten kannst Du direkt bei Deiner Anfrage.')
  })

  it('goes to the registered address only, whatever the name holds', async () => {
    // a name is any string: unquoted, a comma and an angle bracket in it would start a recipient
    const firstName = 'Eve <eve@example.net>, "Bibi" \\'
    const mail = await sent({ firstName })
    const { to } = sendEmailTranslatedSpy.mock.calls[0][0].receiver
    expect(to).toBe('"Eve <eve@example.net>, \\"Bibi\\" \\\\ Bloxberg" <bibi@bloxberg.de>')
    // as nodemailer reads the header: one mailbox, the member's
    expect(addressparser(to)).toEqual([
      { name: 'Eve <eve@example.net>, "Bibi" \\ Bloxberg', address: 'bibi@bloxberg.de' },
    ])
    expect(addressparser(`${firstName} Bloxberg <bibi@bloxberg.de>`).length).toBeGreaterThan(1)
    expect(mail.html).toContain('Hallo Eve &lt;eve@example.net&gt;, &quot;Bibi&quot; \\ Bloxberg,')
  })

  it('speaks the language of the member', async () => {
    const mail = await sent({ language: 'ru', closed: true })
    expect(mail.subject).toBe('Ответ на ваше обращение в поддержку')
    expect(mail.html).toContain('Пользователь peter ответил на ваше обращение № 42.')
    expect(mail.html).toContain('Тем самым обращение закрыто.')
    const english = await sent({ language: 'en' })
    expect(english.subject).toBe('Reply to your support request')
    expect(english.html).toContain('peter has replied to your request no. 42.')
  })
})
