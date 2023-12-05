/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Connection } from '@dbTools/typeorm'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { Decimal } from 'decimal.js-light'

import { testEnvironment } from '@test/helpers'
import { logger, i18n as localization } from '@test/testSetup'

import { CONFIG } from '@/config'

import { sendEmailTranslated } from './sendEmailTranslated'
import {
  sendAddedContributionMessageEmail,
  sendAccountActivationEmail,
  sendAccountMultiRegistrationEmail,
  sendContributionConfirmedEmail,
  sendContributionDeniedEmail,
  sendContributionDeletedEmail,
  sendResetPasswordEmail,
  sendTransactionLinkRedeemedEmail,
  sendTransactionReceivedEmail,
  sendContributionChangedByModeratorEmail,
} from './sendEmailVariants'

CONFIG.EMAIL_SENDER = 'info@gradido.net'

let con: Connection
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

beforeAll(async () => {
  testEnv = await testEnvironment(logger, localization)
  con = testEnv.con
})

afterAll(async () => {
  await con.close()
})

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

  describe('sendAddedContributionMessageEmail', () => {
    beforeAll(async () => {
      result = await sendAddedContributionMessageEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        senderFirstName: 'Bibi',
        senderLastName: 'Bloxberg',
        contributionMemo: 'My contribution.',
      })
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
      result = await sendAccountMultiRegistrationEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
      })
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
      result = await sendContributionConfirmedEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        senderFirstName: 'Bibi',
        senderLastName: 'Bloxberg',
        contributionMemo: 'My contribution.',
        contributionAmount: new Decimal(23.54),
      })
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

  describe('sendContributionChangedByModeratorEmail', () => {
    beforeAll(async () => {
      result = await sendContributionChangedByModeratorEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        senderFirstName: 'Bibi',
        senderLastName: 'Bloxberg',
        contributionMemo: 'My contribution.',
        contributionMemoUpdated: 'This is a better contribution memo.',
      })
    })

    describe('calls "sendEmailTranslated"', () => {
      it('with expected parameters', () => {
        expect(sendEmailTranslated).toBeCalledWith({
          receiver: {
            to: 'Peter Lustig <peter@lustig.de>',
          },
          template: 'contributionChangedByModerator',
          locals: {
            firstName: 'Peter',
            lastName: 'Lustig',
            locale: 'en',
            senderFirstName: 'Bibi',
            senderLastName: 'Bloxberg',
            contributionMemo: 'My contribution.',
            contributionMemoUpdated: 'This is a better contribution memo.',
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
        senderFirstName: 'Bibi',
        senderLastName: 'Bloxberg',
        contributionMemo: 'My contribution.',
      })
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
      result = await sendContributionDeletedEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        senderFirstName: 'Bibi',
        senderLastName: 'Bloxberg',
        contributionMemo: 'My contribution.',
      })
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
      result = await sendTransactionLinkRedeemedEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        senderFirstName: 'Bibi',
        senderLastName: 'Bloxberg',
        senderEmail: 'bibi@bloxberg.de',
        transactionMemo: 'You deserve it! 🙏🏼',
        transactionAmount: new Decimal(17.65),
      })
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
      result = await sendTransactionReceivedEmail({
        firstName: 'Peter',
        lastName: 'Lustig',
        email: 'peter@lustig.de',
        language: 'en',
        senderFirstName: 'Bibi',
        senderLastName: 'Bloxberg',
        senderEmail: 'bibi@bloxberg.de',
        transactionAmount: new Decimal(37.4),
      })
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
