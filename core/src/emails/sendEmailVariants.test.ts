import { afterEach, beforeAll, describe, expect, it, jest, mock } from 'bun:test'
import { GradidoUnit } from 'shared'
import { CONFIG } from '../config'
import * as sendEmailTranslatedApi from './sendEmailTranslated'
import {
  sendAccountActivationEmail,
  sendAccountMultiRegistrationEmail,
  sendAddedContributionMessageEmail,
  sendAssistedRegistrationConfirmEmail,
  sendContributionChangedByModeratorEmail,
  sendContributionConfirmedEmail,
  sendContributionDeletedEmail,
  sendContributionDeniedEmail,
  sendCreationRightRequestSupportEmail,
  sendEmailChangeSupportEmail,
  sendResetPasswordEmail,
  sendTransactionLinkRedeemedEmail,
  sendTransactionReceivedEmail,
} from './sendEmailVariants'

const testMailServerHost = 'localhost'
const testMailServerPort = 1025
const testMailTLS = false

CONFIG.EMAIL = true
CONFIG.EMAIL_SENDER = 'info@gradido.net'
CONFIG.EMAIL_SMTP_HOST = testMailServerHost
CONFIG.EMAIL_SMTP_PORT = testMailServerPort
CONFIG.EMAIL_TLS = testMailTLS
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

describe('sendEmailVariants', () => {
  let result: any
  const contributionFrontendLink =
    'https://gradido.net/contributions/own-contributions/1#contributionListItem-1'

  afterEach(() => {
    sendEmailTranslatedSpy.mockClear()
  })

  describe('sendAddedContributionMessageEmail', () => {
    beforeAll(async () => {
      result = await sendAddedContributionMessageEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        senderAlias: 'bibi',
        contributionMemo: 'My contribution.',
        contributionFrontendLink,
        message: 'My message.',
      })
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslatedSpy).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'addedContributionMessage',
          locals: expect.objectContaining({
            firstName: 'Peter',
            lastName: 'Lustig',
            language: 'en',
            senderAlias: 'bibi',
            contributionMemo: 'My contribution.',
            contributionFrontendLink,
            message: 'My message.',
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
          }),
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        // bun testrunner bug, toMatchObject mess with 'result'
        const resultClone = JSON.parse(JSON.stringify(result))
        expect(resultClone).toMatchObject({
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido <info@gradido.net>',
            attachments: expect.any(Array),
            subject: 'Message about your common good contribution',
            html: expect.any(String),
            text: expect.stringContaining('MESSAGE ABOUT YOUR COMMON GOOD CONTRIBUTION'),
          }),
        })
      })

      it('has the correct html as snapshot', () => {
        expect(result.originalMessage.html).toMatchSnapshot()
      })

      /**
       * ⛔ Measured at the RENDERED mail, not at the locals handed to the renderer. The
       * locals only prove the switch travels; whether the template branches on it is a
       * question about pug, and only the html can answer it.
       *
       * Why it exists: this mail is right at the moment it is sent and wrong at the moment
       * it is read whenever the contribution is confirmed straight after the comment — a
       * first creation does exactly that (Bernd, 06.09.). The button then leads to a door
       * that does not open.
       */
      it('offers the reply button, and the heading that promises it', () => {
        const html = result.originalMessage.html
        expect(html).toContain('Read and reply to message')
        expect(html).toContain('You can reply directly at your contribution.')
        expect(html).toContain(contributionFrontendLink)
        expect(html).not.toContain('This contribution is complete')
      })
    })

    describe('for a contribution that is about to be closed', () => {
      let closed: any

      beforeAll(async () => {
        closed = await sendAddedContributionMessageEmail({
          firstName: 'Peter',
          lastName: 'Lustig',
          email: 'peter@lustig.de',
          language: 'en',
          senderAlias: 'bibi',
          contributionMemo: 'My contribution.',
          contributionFrontendLink,
          message: 'My message.',
          answerable: false,
        })
      })

      it('takes the button and both promises out, and says why', () => {
        const html = closed.originalMessage.html
        expect(html).toContain('This contribution is complete')
        expect(html).not.toContain('You can reply directly at your contribution.')
        // ⛔ The heading promises answering too, and it is the same promise.
        expect(html).not.toContain('Read and reply to message')
        expect(html).toContain('Read message')
        // The link to the thread goes with the button: nothing left to press.
        expect(html).not.toContain(contributionFrontendLink)
        // What the mail is FOR is untouched — the message itself still stands in it.
        expect(html).toContain('My message.')
      })
    })
  })

  describe('sendAccountActivationEmail', () => {
    beforeAll(async () => {
      result = await sendAccountActivationEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        activationLink: 'http://localhost/checkEmail/6627633878930542284',
        timeDurationObject: { hours: 23, minutes: 30 },
      })
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslatedSpy).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'accountActivation',
          locals: expect.objectContaining({
            firstName: 'Peter',
            lastName: 'Lustig',
            language: 'en',
            activationLink: 'http://localhost/checkEmail/6627633878930542284',
            timeDurationObject: { hours: 23, minutes: 30 },
            resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          }),
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        // bun testrunner bug, toMatchObject mess with 'result'
        const resultClone = JSON.parse(JSON.stringify(result))
        expect(resultClone).toMatchObject({
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido <info@gradido.net>',
            attachments: expect.any(Array),
            subject: 'Email Verification',
            html: expect.any(String),
            text: expect.stringContaining('EMAIL VERIFICATION'),
          }),
        })
      })

      it('has the correct html as snapshot', () => {
        expect(result.originalMessage.html).toMatchSnapshot()
      })
    })
  })

  describe('sendAccountMultiRegistrationEmail', () => {
    beforeAll(async () => {
      result = await sendAccountMultiRegistrationEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
      })
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslatedSpy).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'accountMultiRegistration',
          locals: expect.objectContaining({
            firstName: 'Peter',
            lastName: 'Lustig',
            language: 'en',
            resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          }),
        })
      })

      describe('result', () => {
        it('is the expected object', () => {
          // bun testrunner bug, toMatchObject mess with 'result'
          const resultClone = JSON.parse(JSON.stringify(result))
          expect(resultClone).toMatchObject({
            originalMessage: expect.objectContaining({
              to: 'Peter Lustig <peter@lustig.de>',
              from: 'Gradido <info@gradido.net>',
              attachments: expect.any(Array),
              subject: 'Try To Register Again With Your Email',
              html: expect.any(String),
              text: expect.stringContaining('TRY TO REGISTER AGAIN WITH YOUR EMAIL'),
            }),
          })
        })

        it('has the correct html as snapshot', () => {
          expect(result.originalMessage.html).toMatchSnapshot()
        })

        // The doorbell branch (EM-013). Substance assertions rather than a snapshot on
        // purpose: these tests only run in the CI, so a new snapshot could never be
        // written from a locally verified render.
        it('renders no helper branch without a helper link', () => {
          expect(result.originalMessage.html).not.toContain('register-assist')
        })
      })
    })

    describe('with a helper link (the attempt carried a redeem code)', () => {
      let helperResult: any
      beforeAll(async () => {
        helperResult = await sendAccountMultiRegistrationEmail({
          firstName: 'Peter',
          lastName: 'Lustig',
          email: 'peter@lustig.de',
          language: 'en',
          helperLink: 'http://localhost/register-assist/1234567890',
        })
      })

      it('offers the helper branch with its link', () => {
        expect(helperResult.originalMessage.html).toContain(
          'http://localhost/register-assist/1234567890',
        )
        expect(helperResult.originalMessage.html).toContain(
          'I am helping someone set up an account',
        )
      })
    })
  })

  describe('sendAssistedRegistrationConfirmEmail', () => {
    beforeAll(async () => {
      result = await sendAssistedRegistrationConfirmEmail({
        firstName: 'Guest',
        lastName: 'Person',
        email: 'guest@example.org',
        language: 'en',
        confirmLink: 'http://localhost/confirm-email/9876543210',
        timeDurationObject: { hours: 24, minutes: 0 },
      })
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslatedSpy).toBeCalledWith({
          receiver: {
            to: 'Guest Person <guest@example.org>',
          },
          template: 'assistedRegistrationConfirm',
          locals: expect.objectContaining({
            firstName: 'Guest',
            lastName: 'Person',
            language: 'en',
            confirmLink: 'http://localhost/confirm-email/9876543210',
          }),
        })
      })

      describe('result', () => {
        it('is the expected object', () => {
          const resultClone = JSON.parse(JSON.stringify(result))
          expect(resultClone).toMatchObject({
            originalMessage: expect.objectContaining({
              to: 'Guest Person <guest@example.org>',
              from: 'Gradido <info@gradido.net>',
              subject: 'Confirm your e-mail address',
              html: expect.any(String),
            }),
          })
        })

        // Confirm-only: the mail must carry ITS link — and no password page at all.
        // forgot-password also guards the requestNewLink include staying out: its
        // button led there, and that page flips the opt-in row to RESET, disarming
        // this very confirm link.
        it('carries the confirm link and no password page link', () => {
          expect(result.originalMessage.html).toContain('http://localhost/confirm-email/9876543210')
          expect(result.originalMessage.html).not.toContain('reset-password')
          expect(result.originalMessage.html).not.toContain('forgot-password')
        })
      })
    })
  })

  describe('sendEmailChangeSupportEmail', () => {
    // Substance assertions rather than snapshots, for the same reason as above: these
    // tests only run in the CI. The markers are phrases from en.json, so they couple
    // the template branch to the locale text instead of echoing the test's own input.
    const supportData = {
      firstName: 'Guest',
      lastName: 'Person',
      email: 'support@gradido.net',
      language: 'en',
      alias: 'guest',
      oldEmail: 'typo@example.org',
      newEmail: 'real@example.org',
      gdtEmail: 'real@example.org',
    }

    it('asks to merge on a normal change', async () => {
      const normal: any = await sendEmailChangeSupportEmail({
        ...supportData,
        gdtEmail: 'anchor@example.org',
        takeBack: false,
        typoCorrection: false,
      })
      expect(normal.originalMessage.html).toContain('merge the new address')
    })

    it('on an EM-013 typo correction says nothing is to merge — Klick-Tipp only needs the new address', async () => {
      const typo: any = await sendEmailChangeSupportEmail({
        ...supportData,
        takeBack: false,
        typoCorrection: true,
      })
      expect(typo.originalMessage.html).toContain('never confirmed')
      expect(typo.originalMessage.html).not.toContain('merge the new address')
    })

    it('keeps the take-back wording for a change back to an earlier address', async () => {
      const back: any = await sendEmailChangeSupportEmail({
        ...supportData,
        takeBack: true,
        typoCorrection: false,
      })
      expect(back.originalMessage.html).toContain('change back to an earlier address')
      expect(back.originalMessage.html).not.toContain('merge the new address')
    })
  })

  describe('sendCreationRightRequestSupportEmail', () => {
    // Substance assertions, same reason as the support mail above: CI only, so a snapshot
    // could never be written here. The markers are phrases from en.json.
    const requestData = {
      firstName: 'Pizzeria',
      lastName: 'Napoli',
      email: 'support@gradido.net',
      language: 'en',
      alias: 'napoli',
      gradidoId: '11111111-2222-4333-4444-55555555',
      memberEmail: 'napoli@example.org',
      requestedAt: new Date('2026-09-06T14:00:00.000Z'),
    }

    it('names the account, its address and both moments where the holder declared it', async () => {
      const mail: any = await sendCreationRightRequestSupportEmail({
        ...requestData,
        declaredAt: new Date('2026-09-01T09:30:00.000Z'),
      })
      expect(sendEmailTranslatedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          receiver: { to: 'support@gradido.net' },
          template: 'creationRightRequestSupport',
        }),
      )
      const html = mail.originalMessage.html
      expect(html).toContain('asks for the creation right back')
      expect(html).toContain('napoli')
      expect(html).toContain('11111111-2222-4333-4444-55555555')
      expect(html).toContain('napoli@example.org')
      expect(html).toContain('2026-09-01T09:30:00.000Z')
      expect(html).toContain('2026-09-06T14:00:00.000Z')
      expect(html).toContain('switch &quot;May create&quot; on')
      expect(html).not.toContain('switched off by an administrator')
    })

    it('says so where an administrator switched creation off instead', async () => {
      const mail: any = await sendCreationRightRequestSupportEmail({
        ...requestData,
        declaredAt: null,
      })
      const html = mail.originalMessage.html
      expect(html).toContain('switched off by an administrator')
      expect(html).not.toContain('Declared a project account by its holder')
    })
  })

  describe('sendContributionConfirmedEmail', () => {
    beforeAll(async () => {
      result = await sendContributionConfirmedEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        senderAlias: 'bibi',
        contributionMemo: 'My contribution.',
        contributionAmount: GradidoUnit.fromNumber(23.54),
        contributionFrontendLink,
      })
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslatedSpy).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'contributionConfirmed',
          locals: expect.objectContaining({
            firstName: 'Peter',
            lastName: 'Lustig',
            language: 'en',
            senderAlias: 'bibi',
            contributionMemo: 'My contribution.',
            contributionAmount: '23.54',
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            contributionFrontendLink,
          }),
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        // bun testrunner bug, toMatchObject mess with 'result'
        const resultClone = JSON.parse(JSON.stringify(result))
        expect(resultClone).toMatchObject({
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido <info@gradido.net>',
            attachments: expect.any(Array),
            subject: 'Your contribution to the common good was confirmed',
            html: expect.any(String),
            text: expect.stringContaining('YOUR CONTRIBUTION TO THE COMMON GOOD WAS CONFIRMED'),
          }),
        })
      })

      it('has the correct html as snapshot', () => {
        expect(result.originalMessage.html).toMatchSnapshot()
      })
    })
  })

  describe('sendContributionChangedByModeratorEmail', () => {
    beforeAll(async () => {
      result = await sendContributionChangedByModeratorEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        senderAlias: 'bibi',
        contributionMemo: 'My contribution.',
        contributionMemoUpdated: 'This is a better contribution memo.',
        contributionFrontendLink,
      })
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslatedSpy).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'contributionChangedByModerator',
          locals: expect.objectContaining({
            firstName: 'Peter',
            lastName: 'Lustig',
            language: 'en',
            senderAlias: 'bibi',
            contributionMemo: 'My contribution.',
            contributionMemoUpdated: 'This is a better contribution memo.',
            contributionFrontendLink,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
          }),
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        // bun testrunner bug, toMatchObject mess with 'result'
        const resultClone = JSON.parse(JSON.stringify(result))
        expect(resultClone).toMatchObject({
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido <info@gradido.net>',
            attachments: expect.any(Array),
            subject: 'Your common good contribution has been changed',
            html: expect.any(String),
            text: expect.stringContaining('YOUR COMMON GOOD CONTRIBUTION HAS BEEN CHANGED'),
          }),
        })
      })

      it('has the correct html as snapshot', () => {
        expect(result.originalMessage.html).toMatchSnapshot()
      })
    })
  })

  describe('sendContributionDeniedEmail', () => {
    beforeAll(async () => {
      result = await sendContributionDeniedEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        senderAlias: 'bibi',
        contributionMemo: 'My contribution.',
        contributionFrontendLink,
      })
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslatedSpy).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'contributionDenied',
          locals: expect.objectContaining({
            firstName: 'Peter',
            lastName: 'Lustig',
            language: 'en',
            senderAlias: 'bibi',
            contributionMemo: 'My contribution.',
            contributionFrontendLink,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
          }),
        })
      })
    })

    describe('result', () => {
      it('has expected result', () => {
        // bun testrunner bug, toMatchObject mess with 'result'
        const resultClone = JSON.parse(JSON.stringify(result))
        expect(resultClone).toMatchObject({
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido <info@gradido.net>',
            attachments: expect.any(Array),
            subject: 'Your common good contribution was rejected',
            html: expect.any(String),
            text: expect.stringContaining('YOUR COMMON GOOD CONTRIBUTION WAS REJECTED'),
          }),
        })
      })

      it('has the correct html as snapshot', () => {
        expect(result.originalMessage.html).toMatchSnapshot()
      })
    })
  })

  describe('sendContributionDeletedEmail', () => {
    beforeAll(async () => {
      result = await sendContributionDeletedEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        senderAlias: 'bibi',
        contributionMemo: 'My contribution.',
        contributionFrontendLink,
      })
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslatedSpy).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'contributionDeleted',
          locals: expect.objectContaining({
            firstName: 'Peter',
            lastName: 'Lustig',
            language: 'en',
            senderAlias: 'bibi',
            contributionMemo: 'My contribution.',
            contributionFrontendLink,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
          }),
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        // bun testrunner bug, toMatchObject mess with 'result'
        const resultClone = JSON.parse(JSON.stringify(result))
        expect(resultClone).toMatchObject({
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido <info@gradido.net>',
            attachments: expect.any(Array),
            subject: 'Your common good contribution was deleted',
            html: expect.any(String),
            text: expect.stringContaining('YOUR COMMON GOOD CONTRIBUTION WAS DELETED'),
          }),
        })
      })

      it('has the correct html as snapshot', () => {
        expect(result.originalMessage.html).toMatchSnapshot()
      })
    })
  })

  describe('sendResetPasswordEmail', () => {
    beforeAll(async () => {
      result = await sendResetPasswordEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        resetLink: 'http://localhost/reset-password/3762660021544901417',
        timeDurationObject: { hours: 23, minutes: 30 },
      })
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslatedSpy).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'resetPassword',
          locals: expect.objectContaining({
            firstName: 'Peter',
            lastName: 'Lustig',
            language: 'en',
            resetLink: 'http://localhost/reset-password/3762660021544901417',
            timeDurationObject: { hours: 23, minutes: 30 },
            resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          }),
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        // bun testrunner bug, toMatchObject mess with 'result'
        const resultClone = JSON.parse(JSON.stringify(result))
        expect(resultClone).toMatchObject({
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido <info@gradido.net>',
            attachments: expect.any(Array),
            subject: 'Reset password',
            html: expect.any(String),
            text: expect.stringContaining('RESET PASSWORD'),
          }),
        })
      })

      it('has the correct html as snapshot', () => {
        expect(result.originalMessage.html).toMatchSnapshot()
      })
    })
  })

  describe('sendTransactionLinkRedeemedEmail', () => {
    beforeAll(async () => {
      result = await sendTransactionLinkRedeemedEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        senderAlias: 'bibi',
        senderCommunity: 'Bloxberg',
        transactionMemo: 'You deserve it! 🙏🏼',
        transactionAmount: GradidoUnit.fromNumber(17.65),
      })
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslatedSpy).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'transactionLinkRedeemed',
          locals: expect.objectContaining({
            firstName: 'Peter',
            lastName: 'Lustig',
            language: 'en',
            senderAlias: 'bibi',
            senderCommunity: 'Bloxberg',
            transactionMemo: 'You deserve it! 🙏🏼',
            transactionAmount: '17.65',
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          }),
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        // bun testrunner bug, toMatchObject mess with 'result'
        const resultClone = JSON.parse(JSON.stringify(result))
        expect(resultClone).toMatchObject({
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido <info@gradido.net>',
            attachments: expect.any(Array),
            subject: 'bibi has redeemed your Gradido link',
            html: expect.any(String),
            text: expect.stringContaining('BIBI HAS REDEEMED YOUR GRADIDO LINK'),
          }),
        })
      })

      it('has the correct html as snapshot', () => {
        expect(result.originalMessage.html).toMatchSnapshot()
      })
    })
  })

  describe('sendTransactionReceivedEmail', () => {
    beforeAll(async () => {
      result = await sendTransactionReceivedEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        memo: 'Du bist schon lustiger ;)',
        senderAlias: 'bibi',
        senderUuid: '3f9a1e2c-1111-4a2b-9c3d-000000000001',
        senderCommunityUuid: 'aaaa1111-2222-4333-8444-555566667777',
        transactionAmount: GradidoUnit.fromNumber(37.4),
      })
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslatedSpy).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'transactionReceived',
          locals: expect.objectContaining({
            firstName: 'Peter',
            lastName: 'Lustig',
            language: 'en',
            memo: 'Du bist schon lustiger ;)',
            senderAlias: 'bibi',
            senderUuid: '3f9a1e2c-1111-4a2b-9c3d-000000000001',
            senderCommunityUuid: 'aaaa1111-2222-4333-8444-555566667777',
            transactionAmount: '37.40',
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          }),
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        // bun testrunner bug, toMatchObject mess with 'result'
        const resultClone = JSON.parse(JSON.stringify(result))
        expect(resultClone).toMatchObject({
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido <info@gradido.net>',
            attachments: expect.any(Array),
            subject: 'bibi has sent you 37.40 Gradido',
            html: expect.any(String),
            text: expect.stringContaining('BIBI HAS SENT YOU 37.40 GRADIDO'),
          }),
        })
      })

      it('has the correct html as snapshot', () => {
        expect(result.originalMessage.html).toMatchSnapshot()
      })
    })
  })
})
