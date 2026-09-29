// AI-GENERATED — not an architecture reference
import { afterEach, beforeAll, describe, expect, it, jest, mock } from 'bun:test'
import { CONFIG } from '../config'
import * as sendEmailTranslatedApi from './sendEmailTranslated'
import { sendChatGroupAddedEmail, sendChatGroupMessageEmail } from './sendEmailVariants'

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
 * The two mails of a chat group (P5, E-049), measured at the rendered mail: the way in is the
 * group itself (`/contacts?group=`), and the group's name is a member's own writing -- escaped
 * once, never read as markup.
 */
describe('the mails of a chat group', () => {
  afterEach(() => {
    sendEmailTranslatedSpy.mockClear()
  })

  const recipient = {
    firstName: 'Peter',
    lastName: 'Lustig',
    email: 'peter@lustig.de',
    language: 'en',
  }
  const groupUuid = '5e1f3a2b-7777-4c3d-9e8f-000000000042'
  const groupLink = `${CONFIG.COMMUNITY_URL}/contacts?group=${groupUuid}`

  describe('sendChatGroupAddedEmail', () => {
    let sent: any

    beforeAll(async () => {
      sent = await sendChatGroupAddedEmail({
        ...recipient,
        adderAlias: 'bibi',
        groupTitle: 'Gradido-Café Berlin',
        groupUuid,
        memberCount: 5,
      })
    })

    it('renders its own template for the member taken in', () => {
      expect(sendEmailTranslatedSpy).toBeCalledWith({
        receiver: { to: 'Peter Lustig <peter@lustig.de>' },
        template: 'chatGroupAdded',
        locals: expect.objectContaining({
          adderAlias: 'bibi',
          groupTitle: 'Gradido-Café Berlin',
          groupUuid,
          memberCount: 5,
        }),
      })
      expect(sent.originalMessage.subject).toBe('You are now in the group “Gradido-Café Berlin”')
    })

    it('says who took them in, how many are in it, and that the members see each other', () => {
      const html = sent.originalMessage.html
      expect(html).toContain('bibi has added you to the group “Gradido-Café Berlin”')
      expect(html).toContain('5 members write to each other in the group.')
      expect(html).toContain('All members see your username.')
    })

    it('leads into the group, where it can be muted or left', () => {
      const html = sent.originalMessage.html
      expect(html).toContain(`href="${groupLink}"`)
      expect(html).toContain('Open group')
      expect(html).toContain('You can mute or leave the group in your Gradido account at any time.')
    })

    it('speaks the language of the member taken in', async () => {
      const german: any = await sendChatGroupAddedEmail({
        ...recipient,
        language: 'de',
        adderAlias: 'bibi',
        groupTitle: 'Gradido-Café Berlin',
        groupUuid,
        memberCount: 5,
      })
      expect(german.originalMessage.subject).toBe(
        'Du bist jetzt in der Gruppe „Gradido-Café Berlin“',
      )
      expect(german.originalMessage.html).toContain('Gruppe öffnen')
    })

    it("keeps markup in the group's name as text, escaped once", async () => {
      const marked: any = await sendChatGroupAddedEmail({
        ...recipient,
        adderAlias: 'bibi',
        groupTitle: "Oma's <b>Garten</b>",
        groupUuid,
        memberCount: 2,
      })
      const html = marked.originalMessage.html
      expect(html).toContain("Oma's &lt;b&gt;Garten&lt;/b&gt;")
      expect(html).not.toContain('<b>Garten</b>')
      expect(html).not.toMatch(/&amp;(#|amp;|quot;|lt;|gt;)/)
    })
  })

  describe('sendChatGroupMessageEmail', () => {
    const announcement = {
      ...recipient,
      senderAlias: 'bibi',
      groupTitle: 'Gradido-Café Berlin',
      groupUuid,
      memo: 'Saturday at **two** in the neighbourhood house.',
    }
    let sent: any

    beforeAll(async () => {
      sent = await sendChatGroupMessageEmail(announcement)
    })

    it('renders its own template for a member of the group', () => {
      expect(sendEmailTranslatedSpy).toBeCalledWith({
        receiver: { to: 'Peter Lustig <peter@lustig.de>' },
        template: 'chatGroupMessage',
        locals: expect.objectContaining({
          senderAlias: 'bibi',
          groupTitle: 'Gradido-Café Berlin',
          groupUuid,
          hasImage: false,
        }),
      })
      expect(sent.originalMessage.subject).toBe('Announcement in “Gradido-Café Berlin” from bibi')
    })

    it('carries the text, bold as in the thread, and says it is an announcement', () => {
      const html = sent.originalMessage.html
      expect(html).toContain('bibi writes in “Gradido-Café Berlin”')
      expect(html).toContain(
        'bibi has sent a message to all members of the group as an announcement.',
      )
      expect(html).toMatch(/Saturday at <strong[^>]*>two<\/strong> in the neighbourhood house\./)
    })

    it('leads the reply into the group, and says where it is muted', () => {
      const html = sent.originalMessage.html
      expect(html).toContain(`href="${groupLink}"`)
      expect(html).toContain(
        'No more announcements by email? Tap the bell in the group in your Gradido account.',
      )
      expect(html).not.toContain('/contacts?with=')
    })

    it('says there is a picture only where there is one, and shows none', async () => {
      expect(sent.originalMessage.html).not.toContain('The message contains a picture')
      const withPicture: any = await sendChatGroupMessageEmail({
        ...announcement,
        hasImage: true,
      })
      const html = withPicture.originalMessage.html
      expect(html).toContain('The message contains a picture')
      expect(html).not.toMatch(/<img[^>]*data:image\/jpeg/)
    })
  })
})
