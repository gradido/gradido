// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, jest, mock } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import addressparser from 'nodemailer/lib/addressparser'
import { CONFIG } from '../config'
import * as sendEmailTranslatedApi from './sendEmailTranslated'
import { sendNewSupportTicketEmail } from './sendEmailVariants'

// The setup of sendEmailVariants.test.ts: a transport that takes every mail, so that the mail is
// rendered and can be read. A file of its own, as sendEmailVariants.supportAnswer.test.ts is.
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

const LANGUAGES = ['de', 'el', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr']
type Catalogue = { emails: Record<string, Record<string, string>> }
const catalogue = (language: string): Catalogue =>
  JSON.parse(readFileSync(join(__dirname, '..', 'locales', `${language}.json`), 'utf8'))
// Pug writes these three as entities in a text
const inHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * The mail to a moderator about a support request (Support-Anfragen K5) -- measured at the
 * rendered mail (pug, email-templates, juice): who asked or handed on, the number, the group,
 * where it stands; never a word of the request, and no link into the admin.
 */
describe('the mail to the moderation about a support request', () => {
  afterEach(() => {
    sendEmailTranslatedSpy.mockClear()
  })

  const filed = {
    firstName: 'Peter',
    lastName: 'Lustig',
    email: 'peter@lustig.de',
    language: 'de',
    actorAlias: 'BBB',
    supportTicketNumber: 42,
    groupName: 'Garten',
    reassigned: false,
  }

  const sent = async (more: Record<string, unknown> = {}) => {
    const result: any = await sendNewSupportTicketEmail({ ...filed, ...more })
    return result.originalMessage as { subject: string; html: string; text: string }
  }

  it('is a new support request, in subject and heading', async () => {
    const mail = await sent()

    expect(mail.subject).toBe('Neue Support-Anfrage')
    expect(mail.html).toContain('>Neue Support-Anfrage</h2>')
    expect(sendEmailTranslatedSpy).toBeCalledWith({
      receiver: { to: '"Peter Lustig" <peter@lustig.de>' },
      template: 'newSupportTicket',
      locals: expect.objectContaining({
        actorAlias: 'BBB',
        supportTicketNumber: 42,
        groupName: 'Garten',
        reassigned: false,
      }),
    })
  })

  it('says who asked, the number, the group and where the request stands', async () => {
    const mail = await sent()
    expect(mail.html).toContain('<p>Hallo Peter Lustig,</p>')
    expect(mail.html).toContain('<p>BBB hat eine Anfrage gestellt (Nr. 42).</p>')
    expect(mail.html).toContain('<p>Gruppe: Garten</p>')
    expect(mail.html).toContain('<p>Du findest sie im Admin-Bereich unter „Support“.</p>')
    expect(mail.html).not.toContain('weitergereicht')
  })

  it('names a member without a username as a member, and a request without a group as such', async () => {
    const mail = await sent({ actorAlias: null, groupName: null })
    expect(mail.html).toContain('<p>Ein Mitglied hat eine Anfrage gestellt (Nr. 42).</p>')
    expect(mail.html).toContain('<p>Ohne Gruppe</p>')
    expect(mail.html).not.toContain('Gruppe:')
    expect(mail.html).not.toContain('null')
  })

  it('says who handed the request on, and without a username that it was handed on', async () => {
    const handedOn = await sent({ reassigned: true, actorAlias: 'MeisterBob' })
    expect(handedOn.html).toContain('<p>MeisterBob hat die Anfrage Nr. 42 weitergereicht.</p>')
    expect(handedOn.html).not.toContain('hat eine Anfrage gestellt')
    expect(handedOn.html).toContain('<p>Gruppe: Garten</p>')
    const anonymous = await sent({ reassigned: true, actorAlias: null })
    expect(anonymous.html).toContain('<p>Die Anfrage Nr. 42 ist weitergereicht worden.</p>')
  })

  it('leads to the account, not into the admin, and asks not to reply', async () => {
    const mail = await sent()
    expect(mail.html).toContain(`href="${CONFIG.COMMUNITY_URL}/transactions"`)
    expect(mail.html).toContain('Zum Konto')
    expect(mail.html).not.toContain('/admin')
    expect(mail.html).toContain('Bitte antworte nicht auf diese E-Mail.')
  })

  it('writes the username and the group as words, never as markup', async () => {
    const mail = await sent({ actorAlias: '<b>Eve</b>', groupName: 'Chor & <i>Garten</i>' })
    expect(mail.html).toContain('&lt;b&gt;Eve&lt;/b&gt; hat eine Anfrage gestellt (Nr. 42).')
    expect(mail.html).toContain('Gruppe: Chor &amp; &lt;i&gt;Garten&lt;/i&gt;')
    expect(mail.html).not.toContain('<b>Eve</b>')
    expect(mail.html).not.toContain('<i>Garten</i>')
  })

  it('goes to the registered address only, whatever the name holds', async () => {
    const firstName = 'Eve <eve@example.net>, "Peter" \\'
    await sent({ firstName })
    const { to } = sendEmailTranslatedSpy.mock.calls[0][0].receiver
    expect(addressparser(to)).toEqual([
      { name: 'Eve <eve@example.net>, "Peter" \\ Lustig', address: 'peter@lustig.de' },
    ])
  })

  it('has the nine texts of this mail in every catalogue', () => {
    for (const language of LANGUAGES) {
      const { emails } = catalogue(language)
      expect(Object.keys(emails.newSupportTicket).sort(), language).toEqual([
        'filed',
        'filedByMember',
        'group',
        'noGroup',
        'reassigned',
        'reassignedBySomebody',
        'subject',
        'title',
        'whereToFind',
      ])
    }
  })

  it.each(LANGUAGES)('speaks the language of the moderator: %s', async (language) => {
    const texts = catalogue(language).emails.newSupportTicket
    const mail = await sent({ language })
    expect(mail.subject).toBe(texts.subject)
    expect(mail.html).toContain(
      inHtml(texts.filed.replace('{actorAlias}', 'BBB').replace('{supportTicketNumber}', '42')),
    )
    expect(mail.html).toContain(inHtml(texts.group.replace('{groupName}', 'Garten')))
    expect(mail.html).toContain(inHtml(texts.whereToFind))
    const handedOn = await sent({ language, reassigned: true, actorAlias: null, groupName: null })
    expect(handedOn.html).toContain(
      inHtml(texts.reassignedBySomebody.replace('{supportTicketNumber}', '42')),
    )
    expect(handedOn.html).toContain(inHtml(texts.noGroup))
  })
})
