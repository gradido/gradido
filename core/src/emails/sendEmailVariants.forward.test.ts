// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, jest, mock } from 'bun:test'
import { CONFIG } from '../config'
import * as sendEmailTranslatedApi from './sendEmailTranslated'
import { sendCustomEmail } from './sendEmailVariants'

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
 * The mail about a forwarded message (E-059), measured at the rendered mail: a line over the text
 * says it was forwarded, with the name of whoever wrote the words first, and what the sender wrote
 * to go with it stands under the text -- one mail for both.
 */
describe('the mail about a forwarded message', () => {
  afterEach(() => {
    sendEmailTranslatedSpy.mockClear()
  })

  const message = {
    firstName: 'Peter',
    lastName: 'Lustig',
    email: 'peter@lustig.de',
    language: 'en',
    senderAlias: 'bibi',
    subject: '',
    memo: 'The flea market is on **Sunday** from eleven.',
    senderUuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    senderCommunityUuid: '11111111-1111-4111-8111-111111111111',
  }

  it('says who wrote the words first, over the text, and hands the values to the template', async () => {
    const sent: any = await sendCustomEmail({
      ...message,
      forwarded: true,
      forwardedFromAlias: 'Anna-Sonne',
    })
    expect(sendEmailTranslatedSpy).toBeCalledWith({
      receiver: { to: 'Peter Lustig <peter@lustig.de>' },
      template: 'customEmail',
      locals: expect.objectContaining({
        forwarded: true,
        forwardedFromAlias: 'Anna-Sonne',
        forwardWords: null,
      }),
    })
    const html = sent.originalMessage.html
    expect(html).toContain('↪ Forwarded from Anna-Sonne')
    expect(html.indexOf('↪ Forwarded from Anna-Sonne')).toBeLessThan(html.indexOf('flea market'))
    expect(html).toMatch(/on <strong[^>]*>Sunday<\/strong> from eleven\./)
  })

  it('says only that it was forwarded where the sender forwards words of their own', async () => {
    const sent: any = await sendCustomEmail({
      ...message,
      forwarded: true,
      forwardedFromAlias: null,
    })
    const html = sent.originalMessage.html
    expect(html).toContain('↪ Forwarded')
    expect(html).not.toContain('Forwarded from')
  })

  it("carries the sender's own words under the text", async () => {
    const sent: any = await sendCustomEmail({
      ...message,
      forwarded: true,
      forwardedFromAlias: 'Anna-Sonne',
      forwardWords: 'Who is coming along?',
    })
    const html = sent.originalMessage.html
    expect(html).toContain('bibi adds:')
    expect(html).toContain('Who is coming along?')
    expect(html.indexOf('flea market')).toBeLessThan(html.indexOf('bibi adds:'))
  })

  it('keeps markup in the name and in the words as text, escaped once', async () => {
    const sent: any = await sendCustomEmail({
      ...message,
      forwarded: true,
      forwardedFromAlias: "Oma's <b>Garten</b>",
      forwardWords: '<i>wer</i> kommt?',
    })
    const html = sent.originalMessage.html
    expect(html).toContain("Oma's &lt;b&gt;Garten&lt;/b&gt;")
    expect(html).toContain('&lt;i&gt;wer&lt;/i&gt; kommt?')
    expect(html).not.toContain('<b>Garten</b>')
    expect(html).not.toMatch(/&amp;(#|amp;|quot;|lt;|gt;)/)
  })

  it('says nothing of forwarding in the mail about any other message', async () => {
    const sent: any = await sendCustomEmail(message)
    const html = sent.originalMessage.html
    expect(html).not.toContain('Forwarded')
    expect(html).not.toContain('adds:')
    expect(sendEmailTranslatedSpy).toBeCalledWith(
      expect.objectContaining({
        locals: expect.objectContaining({
          forwarded: false,
          forwardedFromAlias: null,
          forwardWords: null,
        }),
      }),
    )
  })

  it('speaks the language of the recipient', async () => {
    const sent: any = await sendCustomEmail({
      ...message,
      language: 'de',
      forwarded: true,
      forwardedFromAlias: 'Anna-Sonne',
      forwardWords: 'Wer kommt mit?',
    })
    const html = sent.originalMessage.html
    expect(html).toContain('↪ Weitergeleitet von Anna-Sonne')
    expect(html).toContain('bibi schreibt dazu:')
  })
})
