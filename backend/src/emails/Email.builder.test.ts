/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Decimal } from 'decimal.js-light'

import { logger, i18n as localization } from '@test/testSetup'

import { CONFIG } from '@/config'

import { sendEmailTranslated } from './sendEmailTranslated'
import { User } from '@entity/User'
import { UserContact } from '@entity/UserContact'
import { Contribution } from '@entity/Contribution'
import { EmailBuilder, EmailType } from './Email.builder'

jest.mock('./sendEmailTranslated', () => {
  const originalModule = jest.requireActual('./sendEmailTranslated')
  return {
    __esModule: true,
    sendEmailTranslated: jest.fn((a) => originalModule.sendEmailTranslated(a)),
  }
})

describe('sendEmailVariants', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any
  const recipientUser = new User()
  recipientUser.firstName = 'Peter'
  recipientUser.lastName = 'Lustig'
  recipientUser.language = 'en'
  const recipientUserContact = new UserContact()
  recipientUserContact.email = 'peter@lustig.de'
  recipientUser.emailContact = recipientUserContact

  const senderUser = new User()
  senderUser.firstName = 'Bibi'
  senderUser.lastName = 'Bloxberg'
  const senderUserContact = new UserContact()
  senderUserContact.email = 'bibi@bloxberg.de'

  const contribution = new Contribution()
  contribution.memo = 'My contribution.'
  contribution.amount = new Decimal(23.54)

  const emailBuilder = new EmailBuilder()

  describe('sendAddedContributionMessageEmail', () => {
    beforeAll(async () => {
      result = await emailBuilder
        .setSender(senderUser)
        .setRecipient(recipientUser)
        .setContribution(contribution)
        .setType(EmailType.ADDED_CONTRIBUTION_MESSAGE)
        .sendEmail()
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslated).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'addedContributionMessage',
          locals: {
            firstName: 'Peter',
            lastName: 'Lustig',
            locale: 'en',
            senderFirstName: 'Bibi',
            senderLastName: 'Bloxberg',
            contributionMemo: 'My contribution.',
            overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          },
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        expect(result).toMatchObject({
          envelope: {
            from: 'info@gradido.net',
            to: ['peter@lustig.de'],
          },
          message: expect.any(String),
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido (emails.general.doNotAnswer) <info@gradido.net>',
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
    })
  })

  describe('sendAccountActivationEmail', () => {
    beforeAll(async () => {
      result = await emailBuilder
        .setRecipient(recipientUser)
        .setSender(senderUser)
        .setActivationLink('http://localhost/checkEmail/6627633878930542284')
        .setTimeDurationObject({ hours: 23, minutes: 30 })
        .setType(EmailType.ACCOUNT_ACTIVATION)
        .sendEmail()
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslated).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'accountActivation',
          locals: {
            firstName: 'Peter',
            lastName: 'Lustig',
            locale: 'en',
            activationLink: 'http://localhost/checkEmail/6627633878930542284',
            timeDurationObject: { hours: 23, minutes: 30 },
            resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          },
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        expect(result).toMatchObject({
          envelope: {
            from: 'info@gradido.net',
            to: ['peter@lustig.de'],
          },
          message: expect.any(String),
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido (emails.general.doNotAnswer) <info@gradido.net>',
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
      result = await emailBuilder
        .setRecipient(recipientUser)
        .setType(EmailType.ACCOUNT_MULTI_REGISTRATION)
        .sendEmail()
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslated).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'accountMultiRegistration',
          locals: {
            firstName: 'Peter',
            lastName: 'Lustig',
            locale: 'en',
            resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          },
        })
      })

      describe('result', () => {
        it('is the expected object', () => {
          expect(result).toMatchObject({
            envelope: {
              from: 'info@gradido.net',
              to: ['peter@lustig.de'],
            },
            message: expect.any(String),
            originalMessage: expect.objectContaining({
              to: 'Peter Lustig <peter@lustig.de>',
              from: 'Gradido (emails.general.doNotAnswer) <info@gradido.net>',
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
      })
    })
  })

  describe('sendContributionConfirmedEmail', () => {
    beforeAll(async () => {
      result = await emailBuilder
        .setRecipient(recipientUser)
        .setSender(senderUser)
        .setContribution(contribution)
        .setType(EmailType.CONTRIBUTION_CONFIRMED)
        .sendEmail()
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslated).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'contributionConfirmed',
          locals: {
            firstName: 'Peter',
            lastName: 'Lustig',
            locale: 'en',
            senderFirstName: 'Bibi',
            senderLastName: 'Bloxberg',
            contributionMemo: 'My contribution.',
            contributionAmount: '23.54',
            overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          },
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        expect(result).toMatchObject({
          envelope: {
            from: 'info@gradido.net',
            to: ['peter@lustig.de'],
          },
          message: expect.any(String),
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido (emails.general.doNotAnswer) <info@gradido.net>',
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

  describe('sendContributionDeniedEmail', () => {
    beforeAll(async () => {
      result = await emailBuilder
        .setRecipient(recipientUser)
        .setSender(senderUser)
        .setContribution(contribution)
        .setType(EmailType.CONTRIBUTION_DENIED)
        .sendEmail()
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslated).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'contributionDenied',
          locals: {
            firstName: 'Peter',
            lastName: 'Lustig',
            locale: 'en',
            senderFirstName: 'Bibi',
            senderLastName: 'Bloxberg',
            contributionMemo: 'My contribution.',
            overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          },
        })
      })
    })

    describe('result', () => {
      it('has expected result', () => {
        expect(result).toMatchObject({
          envelope: {
            from: 'info@gradido.net',
            to: ['peter@lustig.de'],
          },
          message: expect.any(String),
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido (emails.general.doNotAnswer) <info@gradido.net>',
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
      result = await emailBuilder
        .setRecipient(recipientUser)
        .setSender(senderUser)
        .setContribution(contribution)
        .setType(EmailType.CONTRIBUTION_DELETED)
        .sendEmail()
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslated).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'contributionDeleted',
          locals: {
            firstName: 'Peter',
            lastName: 'Lustig',
            locale: 'en',
            senderFirstName: 'Bibi',
            senderLastName: 'Bloxberg',
            contributionMemo: 'My contribution.',
            overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          },
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        expect(result).toMatchObject({
          envelope: {
            from: 'info@gradido.net',
            to: ['peter@lustig.de'],
          },
          message: expect.any(String),
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido (emails.general.doNotAnswer) <info@gradido.net>',
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
      result = await emailBuilder
        .setRecipient(recipientUser)
        .setResetLink('http://localhost/reset-password/3762660021544901417')
        .setTimeDurationObject({ hours: 23, minutes: 30 })
        .setType(EmailType.RESET_PASSWORD)
        .sendEmail()
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslated).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'resetPassword',
          locals: {
            firstName: 'Peter',
            lastName: 'Lustig',
            locale: 'en',
            resetLink: 'http://localhost/reset-password/3762660021544901417',
            timeDurationObject: { hours: 23, minutes: 30 },
            resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          },
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        expect(result).toMatchObject({
          envelope: {
            from: 'info@gradido.net',
            to: ['peter@lustig.de'],
          },
          message: expect.any(String),
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido (emails.general.doNotAnswer) <info@gradido.net>',
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
      result = await emailBuilder
        .setRecipient(recipientUser)
        .setSender(senderUser)
        .setTransaction(new Decimal(17.65), 'You deserve it! 🙏🏼')
        .setType(EmailType.TRANSACTION_LINK_REDEEMED)
        .sendEmail()
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslated).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'transactionLinkRedeemed',
          locals: {
            firstName: 'Peter',
            lastName: 'Lustig',
            locale: 'en',
            senderFirstName: 'Bibi',
            senderLastName: 'Bloxberg',
            senderEmail: 'bibi@bloxberg.de',
            transactionMemo: 'You deserve it! 🙏🏼',
            transactionAmount: '17.65',
            overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          },
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        expect(result).toMatchObject({
          envelope: {
            from: 'info@gradido.net',
            to: ['peter@lustig.de'],
          },
          message: expect.any(String),
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido (emails.general.doNotAnswer) <info@gradido.net>',
            attachments: expect.any(Array),
            subject: 'Bibi Bloxberg has redeemed your Gradido link',
            html: expect.any(String),
            text: expect.stringContaining('BIBI BLOXBERG HAS REDEEMED YOUR GRADIDO LINK'),
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
      result = await emailBuilder
        .setRecipient(recipientUser)
        .setSender(senderUser)
        .setTransactionAmount(new Decimal(37.4))
        .setType(EmailType.TRANSACTION_RECEIVED)
        .sendEmail()
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslated).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'transactionReceived',
          locals: {
            firstName: 'Peter',
            lastName: 'Lustig',
            locale: 'en',
            senderFirstName: 'Bibi',
            senderLastName: 'Bloxberg',
            senderEmail: 'bibi@bloxberg.de',
            transactionAmount: '37.40',
            overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
            supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
            communityURL: CONFIG.COMMUNITY_URL,
          },
        })
      })
    })

    describe('result', () => {
      it('is the expected object', () => {
        expect(result).toMatchObject({
          envelope: {
            from: 'info@gradido.net',
            to: ['peter@lustig.de'],
          },
          message: expect.any(String),
          originalMessage: expect.objectContaining({
            to: 'Peter Lustig <peter@lustig.de>',
            from: 'Gradido (emails.general.doNotAnswer) <info@gradido.net>',
            attachments: expect.any(Array),
            subject: 'Bibi Bloxberg has sent you 37.40 Gradido',
            html: expect.any(String),
            text: expect.stringContaining('BIBI BLOXBERG HAS SENT YOU 37.40 GRADIDO'),
          }),
        })
      })

      it('has the correct html as snapshot', () => {
        expect(result.originalMessage.html).toMatchSnapshot()
      })
    })
  })
})
