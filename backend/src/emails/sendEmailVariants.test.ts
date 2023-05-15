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
} from './sendEmailVariants'

let con: Connection
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

// TODO
// when https://gdd.gradido.net/img/gradido-email-header.jpg is on production,
// replace this URL by https://gdd.gradido.net/img/brand/gradido-email-header.png
const headerImageURL =
  'https://cdn.discordapp.com/attachments/913740067208564736/1107629904306110595/Kopf-Grafik.png'

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
            attachments: [],
            subject: 'Gradido: Message about your common good contribution',
            html: expect.any(String),
            text: expect.stringContaining('MESSAGE ABOUT YOUR COMMON GOOD CONTRIBUTION'),
          }),
        })
      })

      it('has correct header', () => {
        expect(result.originalMessage.html).toContain(`src="${headerImageURL}"`)
      })

      it('has correct doctype and language set', () => {
        expect(result.originalMessage.html).toContain('<!DOCTYPE html>')
        expect(result.originalMessage.html).toContain('<html lang="en"')
      })

      it('has correct heading, salutation, and text', () => {
        expect(result.originalMessage.html).toContain(
          '>Message about your common good contribution</h1>',
        )
        expect(result.originalMessage.html).toContain('Hello Peter Lustig,')
        expect(result.originalMessage.html).toContain(
          'You have received a message from Bibi Bloxberg regarding your common good contribution “My contribution.”.',
        )
      })

      it('has correct CTA block', () => {
        expect(result.originalMessage.html).toContain('>Read and reply to message</h2>')
        expect(result.originalMessage.html).toContain(
          'To view and reply to the message, go to the “Creation” menu in your Gradido account and click on the “My contributions” tab.',
        )
        expect(result.originalMessage.html).toContain(
          '<a class="button-3 w-button" href="https://gdd.gradido.net/community/contribution"',
        )
        expect(result.originalMessage.html).toContain('>To account</a>')
        expect(result.originalMessage.html).toContain('Please do not reply to this email.')
      })

      it('has correct greating formula', () => {
        expect(result.originalMessage.html).toContain('Kind regards,<br')
        expect(result.originalMessage.html).toContain('>your Gradido team')
      })

      it('has correct footer', () => {
        expect(result.originalMessage.html).toContain('href="https://t.me/GradidoGruppe"')
        expect(result.originalMessage.html).toContain('href="https://www.youtube.com/c/GradidoNet"')
        expect(result.originalMessage.html).toContain('href="https://twitter.com/gradido"')
        expect(result.originalMessage.html).toContain(
          'href="https://www.facebook.com/groups/Gradido/"',
        )
        expect(result.originalMessage.html).toContain('<div class="line"')
        expect(result.originalMessage.html).toContain(
          'If you have any further questions, please contact our support',
        )
        expect(result.originalMessage.html).toContain('support@gradido.net')
        expect(result.originalMessage.html).toContain(
          'src="https://gdd.gradido.net/img/brand/green.png"',
        )
        expect(result.originalMessage.html).toContain('Gradido-Akademie')
        expect(result.originalMessage.html).toContain('Institut für Wirtschaftsbionik')
        expect(result.originalMessage.html).toContain('Pfarrweg 2')
        expect(result.originalMessage.html).toContain('74653 Künzelsau')
        expect(result.originalMessage.html).toContain('Deutschland')
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/impressum/"',
        )
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/datenschutz/"',
        )
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
            attachments: [],
            subject: 'Gradido: Email Verification',
            html: expect.any(String),
            text: expect.stringContaining('EMAIL VERIFICATION'),
          }),
        })
      })

      it('has correct header', () => {
        expect(result.originalMessage.html).toContain(`src="${headerImageURL}"`)
      })

      it('has correct doctype and language set', () => {
        expect(result.originalMessage.html).toContain('<!DOCTYPE html>')
        expect(result.originalMessage.html).toContain('<html lang="en"')
      })

      it('has correct heading, salutation, and text', () => {
        expect(result.originalMessage.html).toContain('>Email Verification</h1>')
        expect(result.originalMessage.html).toContain('Hello Peter Lustig,')
        expect(result.originalMessage.html).toContain(
          'Your email address has just been registered with Gradido.',
        )
      })

      it('has correct CTA block', () => {
        expect(result.originalMessage.html).toContain('>Complete registration</h2>')
        expect(result.originalMessage.html).toContain(
          'Please click here to complete the registration and activate your Gradido account.',
        )
        expect(result.originalMessage.html).toContain(
          'href="http://localhost/checkEmail/6627633878930542284',
        )
        expect(result.originalMessage.html).toContain('>Activate account</a>')
        expect(result.originalMessage.html).toContain('Or copy the link into your browser window.')
        expect(result.originalMessage.html).toContain(
          '>http://localhost/checkEmail/6627633878930542284</a>',
        )
        expect(result.originalMessage.html).toContain('>Request new valid link</h2>')
        expect(result.originalMessage.html).toContain(
          'The link has a validity of 23 hours and 30 minutes.',
        )
        expect(result.originalMessage.html).toContain(
          'If the validity of the link has already expired, you can have a new link sent to you here.',
        )
        expect(result.originalMessage.html).toContain('>New link</a>')
        expect(result.originalMessage.html).toContain(`href="${CONFIG.EMAIL_LINK_FORGOTPASSWORD}"`)
      })

      it('has correct greating formula', () => {
        expect(result.originalMessage.html).toContain('Kind regards,<br')
        expect(result.originalMessage.html).toContain('>your Gradido team')
      })

      it('has correct footer', () => {
        expect(result.originalMessage.html).toContain('href="https://t.me/GradidoGruppe"')
        expect(result.originalMessage.html).toContain('href="https://www.youtube.com/c/GradidoNet"')
        expect(result.originalMessage.html).toContain('href="https://twitter.com/gradido"')
        expect(result.originalMessage.html).toContain(
          'href="https://www.facebook.com/groups/Gradido/"',
        )
        expect(result.originalMessage.html).toContain('<div class="line"')
        expect(result.originalMessage.html).toContain(
          'If you have any further questions, please contact our support',
        )
        expect(result.originalMessage.html).toContain('support@gradido.net')
        expect(result.originalMessage.html).toContain(
          'src="https://gdd.gradido.net/img/brand/green.png"',
        )
        expect(result.originalMessage.html).toContain('Gradido-Akademie')
        expect(result.originalMessage.html).toContain('Institut für Wirtschaftsbionik')
        expect(result.originalMessage.html).toContain('Pfarrweg 2')
        expect(result.originalMessage.html).toContain('74653 Künzelsau')
        expect(result.originalMessage.html).toContain('Deutschland')
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/impressum/"',
        )
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/datenschutz/"',
        )
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
              attachments: [],
              subject: 'Gradido: Try To Register Again With Your Email',
              html: expect.any(String),
              text: expect.stringContaining('TRY TO REGISTER AGAIN WITH YOUR EMAIL'),
            }),
          })
        })

        it('has correct header', () => {
          expect(result.originalMessage.html).toContain(`src="${headerImageURL}"`)
        })

        it('has correct doctype and language set', () => {
          expect(result.originalMessage.html).toContain('<!DOCTYPE html>')
          expect(result.originalMessage.html).toContain('<html lang="en"')
        })

        it('has correct heading, salutation, and text', () => {
          expect(result.originalMessage.html).toContain(
            '>Try To Register Again With Your Email</h1>',
          )
          expect(result.originalMessage.html).toContain('Hello Peter Lustig,')
          expect(result.originalMessage.html).toContain(
            'Your email address has just been used again to register an account with Gradido.',
          )
          expect(result.originalMessage.html).toContain(
            'However, an account already exists for your email address.',
          )
        })

        it('has correct CTA block', () => {
          expect(result.originalMessage.html).toContain('>Reset password</h2>')
          expect(result.originalMessage.html).toContain(
            'If you have forgotten your password, please click here.',
          )
          expect(result.originalMessage.html).toContain(
            `<a class="button-3 w-button" href="${CONFIG.EMAIL_LINK_FORGOTPASSWORD}"`,
          )
          expect(result.originalMessage.html).toContain('>reset</a>')
          expect(result.originalMessage.html).toContain(
            'Or copy the link into your browser window.',
          )
          expect(result.originalMessage.html).toContain(`>${CONFIG.EMAIL_LINK_FORGOTPASSWORD}</a>`)
          expect(result.originalMessage.html).toContain('>Contact support</h2>')
          expect(result.originalMessage.html).toContain(
            'If you did not try to register again, please contact our support:',
          )
          expect(result.originalMessage.html).toContain('href="mailto:support@supportmail.com"')
          expect(result.originalMessage.html).toContain('>support@supportmail.com</a>')
        })

        it('has correct greating formula', () => {
          expect(result.originalMessage.html).toContain('Kind regards,<br')
          expect(result.originalMessage.html).toContain('>your Gradido team')
        })

        it('has correct footer', () => {
          expect(result.originalMessage.html).toContain('href="https://t.me/GradidoGruppe"')
          expect(result.originalMessage.html).toContain(
            'href="https://www.youtube.com/c/GradidoNet"',
          )
          expect(result.originalMessage.html).toContain('href="https://twitter.com/gradido"')
          expect(result.originalMessage.html).toContain(
            'href="https://www.facebook.com/groups/Gradido/"',
          )
          expect(result.originalMessage.html).toContain('<div class="line"')
          expect(result.originalMessage.html).toContain(
            'If you have any further questions, please contact our support',
          )
          expect(result.originalMessage.html).toContain('support@gradido.net')
          expect(result.originalMessage.html).toContain(
            'src="https://gdd.gradido.net/img/brand/green.png"',
          )
          expect(result.originalMessage.html).toContain('Gradido-Akademie')
          expect(result.originalMessage.html).toContain('Institut für Wirtschaftsbionik')
          expect(result.originalMessage.html).toContain('Pfarrweg 2')
          expect(result.originalMessage.html).toContain('74653 Künzelsau')
          expect(result.originalMessage.html).toContain('Deutschland')
          expect(result.originalMessage.html).toContain(
            '<a class="terms_of_use" href="https://gradido.net/de/impressum/"',
          )
          expect(result.originalMessage.html).toContain(
            '<a class="terms_of_use" href="https://gradido.net/de/datenschutz/"',
          )
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
            attachments: [],
            subject: 'Gradido: Your contribution to the common good was confirmed',
            html: expect.any(String),
            text: expect.stringContaining('YOUR CONTRIBUTION TO THE COMMON GOOD WAS CONFIRMED'),
          }),
        })
      })

      it('has correct header', () => {
        expect(result.originalMessage.html).toContain(`src="${headerImageURL}"`)
      })

      it('has correct doctype and language set', () => {
        expect(result.originalMessage.html).toContain('<!DOCTYPE html>')
        expect(result.originalMessage.html).toContain('<html lang="en"')
      })

      it('has correct heading, salutation, and text', () => {
        expect(result.originalMessage.html).toContain(
          '>Your contribution to the common good was confirmed</h1>',
        )
        expect(result.originalMessage.html).toContain('Hello Peter Lustig,')
        expect(result.originalMessage.html).toContain(
          'Your common good contribution “My contribution.” has just been approved by Bibi Bloxberg. Your Gradido account has been credited with 23.54 GDD.',
        )
      })

      it('has correct CTA block', () => {
        expect(result.originalMessage.html).toContain('>Contribution details</h2>')
        expect(result.originalMessage.html).toContain(
          'To see your common good contributions and related messages, go to the “Creation” menu in your Gradido account and click on the “My contributions” tab.',
        )
        expect(result.originalMessage.html).toContain(
          'href="https://gdd.gradido.net/community/contributions',
        )
        expect(result.originalMessage.html).toContain('>To account</a>')
        expect(result.originalMessage.html).toContain('Or copy the link into your browser window.')
        expect(result.originalMessage.html).toContain(
          '>https://gdd.gradido.net/community/contributions</a>',
        )
        expect(result.originalMessage.html).toContain('Please do not reply to this email.')
      })

      it('has correct greating formula', () => {
        expect(result.originalMessage.html).toContain('Kind regards,<br')
        expect(result.originalMessage.html).toContain('>your Gradido team')
      })

      it('has correct footer', () => {
        expect(result.originalMessage.html).toContain('href="https://t.me/GradidoGruppe"')
        expect(result.originalMessage.html).toContain('href="https://www.youtube.com/c/GradidoNet"')
        expect(result.originalMessage.html).toContain('href="https://twitter.com/gradido"')
        expect(result.originalMessage.html).toContain(
          'href="https://www.facebook.com/groups/Gradido/"',
        )
        expect(result.originalMessage.html).toContain('<div class="line"')
        expect(result.originalMessage.html).toContain(
          'If you have any further questions, please contact our support',
        )
        expect(result.originalMessage.html).toContain('support@gradido.net')
        expect(result.originalMessage.html).toContain(
          'src="https://gdd.gradido.net/img/brand/green.png"',
        )
        expect(result.originalMessage.html).toContain('Gradido-Akademie')
        expect(result.originalMessage.html).toContain('Institut für Wirtschaftsbionik')
        expect(result.originalMessage.html).toContain('Pfarrweg 2')
        expect(result.originalMessage.html).toContain('74653 Künzelsau')
        expect(result.originalMessage.html).toContain('Deutschland')
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/impressum/"',
        )
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/datenschutz/"',
        )
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
            attachments: [],
            subject: 'Gradido: Your common good contribution was rejected',
            html: expect.any(String),
            text: expect.stringContaining('YOUR COMMON GOOD CONTRIBUTION WAS REJECTED'),
          }),
        })
      })

      it('has correct header', () => {
        expect(result.originalMessage.html).toContain(`src="${headerImageURL}"`)
      })

      it('has correct doctype and language set', () => {
        expect(result.originalMessage.html).toContain('<!DOCTYPE html>')
        expect(result.originalMessage.html).toContain('<html lang="en"')
      })

      it('has correct heading, salutation, and text', () => {
        expect(result.originalMessage.html).toContain(
          '>Your common good contribution was rejected</h1>',
        )
        expect(result.originalMessage.html).toContain('Hello Peter Lustig,')
        expect(result.originalMessage.html).toContain(
          'Your common good contribution “My contribution.” was rejected by Bibi Bloxberg.',
        )
      })

      it('has correct CTA block', () => {
        expect(result.originalMessage.html).toContain('>Contribution details</h2>')
        expect(result.originalMessage.html).toContain(
          'To see your common good contributions and related messages, go to the “Creation” menu in your Gradido account and click on the “My contributions” tab.',
        )
        expect(result.originalMessage.html).toContain(
          '<a class="button-3 w-button" href="https://gdd.gradido.net/community/contributions"',
        )
        expect(result.originalMessage.html).toContain('>To account</a>')
        expect(result.originalMessage.html).toContain('Please do not reply to this email.')
      })

      it('has correct greating formula', () => {
        expect(result.originalMessage.html).toContain('Kind regards,<br')
        expect(result.originalMessage.html).toContain('>your Gradido team')
      })

      it('has correct footer', () => {
        expect(result.originalMessage.html).toContain('href="https://t.me/GradidoGruppe"')
        expect(result.originalMessage.html).toContain('href="https://www.youtube.com/c/GradidoNet"')
        expect(result.originalMessage.html).toContain('href="https://twitter.com/gradido"')
        expect(result.originalMessage.html).toContain(
          'href="https://www.facebook.com/groups/Gradido/"',
        )
        expect(result.originalMessage.html).toContain('<div class="line"')
        expect(result.originalMessage.html).toContain(
          'If you have any further questions, please contact our support',
        )
        expect(result.originalMessage.html).toContain('support@gradido.net')
        expect(result.originalMessage.html).toContain(
          'src="https://gdd.gradido.net/img/brand/green.png"',
        )
        expect(result.originalMessage.html).toContain('Gradido-Akademie')
        expect(result.originalMessage.html).toContain('Institut für Wirtschaftsbionik')
        expect(result.originalMessage.html).toContain('Pfarrweg 2')
        expect(result.originalMessage.html).toContain('74653 Künzelsau')
        expect(result.originalMessage.html).toContain('Deutschland')
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/impressum/"',
        )
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/datenschutz/"',
        )
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
            attachments: [],
            subject: 'Gradido: Your common good contribution was deleted',
            html: expect.any(String),
            text: expect.stringContaining('YOUR COMMON GOOD CONTRIBUTION WAS DELETED'),
          }),
        })
      })

      it('has correct header', () => {
        expect(result.originalMessage.html).toContain(`src="${headerImageURL}"`)
      })

      it('has correct doctype and language set', () => {
        expect(result.originalMessage.html).toContain('<!DOCTYPE html>')
        expect(result.originalMessage.html).toContain('<html lang="en"')
      })

      it('has correct heading, salutation, and text', () => {
        expect(result.originalMessage.html).toContain(
          '>Your common good contribution was deleted</h1>',
        )
        expect(result.originalMessage.html).toContain('Hello Peter Lustig,')
        expect(result.originalMessage.html).toContain(
          'Your common good contribution “My contribution.” was deleted by Bibi Bloxberg.',
        )
      })

      it('has correct CTA block', () => {
        expect(result.originalMessage.html).toContain('>Contribution details</h2>')
        expect(result.originalMessage.html).toContain(
          'To see your common good contributions and related messages, go to the “Creation” menu in your Gradido account and click on the “My contributions” tab.',
        )
        expect(result.originalMessage.html).toContain(
          'href="https://gdd.gradido.net/community/contributions',
        )
        expect(result.originalMessage.html).toContain('>To account</a>')
        expect(result.originalMessage.html).toContain('Or copy the link into your browser window.')
        expect(result.originalMessage.html).toContain(
          '>https://gdd.gradido.net/community/contributions</a>',
        )
        expect(result.originalMessage.html).toContain('Please do not reply to this email.')
      })

      it('has correct greating formula', () => {
        expect(result.originalMessage.html).toContain('Kind regards,<br')
        expect(result.originalMessage.html).toContain('>your Gradido team')
      })

      it('has correct footer', () => {
        expect(result.originalMessage.html).toContain('href="https://t.me/GradidoGruppe"')
        expect(result.originalMessage.html).toContain('href="https://www.youtube.com/c/GradidoNet"')
        expect(result.originalMessage.html).toContain('href="https://twitter.com/gradido"')
        expect(result.originalMessage.html).toContain(
          'href="https://www.facebook.com/groups/Gradido/"',
        )
        expect(result.originalMessage.html).toContain('<div class="line"')
        expect(result.originalMessage.html).toContain(
          'If you have any further questions, please contact our support',
        )
        expect(result.originalMessage.html).toContain('support@gradido.net')
        expect(result.originalMessage.html).toContain(
          'src="https://gdd.gradido.net/img/brand/green.png"',
        )
        expect(result.originalMessage.html).toContain('Gradido-Akademie')
        expect(result.originalMessage.html).toContain('Institut für Wirtschaftsbionik')
        expect(result.originalMessage.html).toContain('Pfarrweg 2')
        expect(result.originalMessage.html).toContain('74653 Künzelsau')
        expect(result.originalMessage.html).toContain('Deutschland')
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/impressum/"',
        )
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/datenschutz/"',
        )
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
            attachments: [],
            subject: 'Gradido: Reset password',
            html: expect.any(String),
            text: expect.stringContaining('RESET PASSWORD'),
          }),
        })
      })

      it('has correct header', () => {
        expect(result.originalMessage.html).toContain(`src="${headerImageURL}"`)
      })

      it('has correct doctype and language set', () => {
        expect(result.originalMessage.html).toContain('<!DOCTYPE html>')
        expect(result.originalMessage.html).toContain('<html lang="en"')
      })

      it('has correct heading, salutation, and text', () => {
        expect(result.originalMessage.html).toContain('>Reset password</h1>')
        expect(result.originalMessage.html).toContain('Hello Peter Lustig,')
        expect(result.originalMessage.html).toContain(
          'You, or someone else, requested a password reset for this account.',
        )
      })

      it('has correct CTA block', () => {
        expect(result.originalMessage.html).toContain('>Reset password</h2>')
        expect(result.originalMessage.html).toContain('If it was you, please click here.')
        expect(result.originalMessage.html).toContain(
          '<a class="button-3 w-button" href="http://localhost/reset-password/3762660021544901417"',
        )
        expect(result.originalMessage.html).toContain('>reset</a>')
        expect(result.originalMessage.html).toContain('Or copy the link into your browser window.')
        expect(result.originalMessage.html).toContain(
          'http://localhost/reset-password/3762660021544901417</a>',
        )
        expect(result.originalMessage.html).toContain('>Request new valid link</h2>')
        expect(result.originalMessage.html).toContain(
          'The link has a validity of 23 hours and 30 minutes.',
        )
        expect(result.originalMessage.html).toContain(
          'If the validity of the link has already expired, you can have a new link sent to you here.',
        )
        expect(result.originalMessage.html).toContain('>New link</a>')
        expect(result.originalMessage.html).toContain(`href="${CONFIG.EMAIL_LINK_FORGOTPASSWORD}"`)
      })

      it('has correct greating formula', () => {
        expect(result.originalMessage.html).toContain('Kind regards,<br')
        expect(result.originalMessage.html).toContain('>your Gradido team')
      })

      it('has correct footer', () => {
        expect(result.originalMessage.html).toContain('href="https://t.me/GradidoGruppe"')
        expect(result.originalMessage.html).toContain('href="https://www.youtube.com/c/GradidoNet"')
        expect(result.originalMessage.html).toContain('href="https://twitter.com/gradido"')
        expect(result.originalMessage.html).toContain(
          'href="https://www.facebook.com/groups/Gradido/"',
        )
        expect(result.originalMessage.html).toContain('<div class="line"')
        expect(result.originalMessage.html).toContain(
          'If you have any further questions, please contact our support',
        )
        expect(result.originalMessage.html).toContain('support@gradido.net')
        expect(result.originalMessage.html).toContain(
          'src="https://gdd.gradido.net/img/brand/green.png"',
        )
        expect(result.originalMessage.html).toContain('Gradido-Akademie')
        expect(result.originalMessage.html).toContain('Institut für Wirtschaftsbionik')
        expect(result.originalMessage.html).toContain('Pfarrweg 2')
        expect(result.originalMessage.html).toContain('74653 Künzelsau')
        expect(result.originalMessage.html).toContain('Deutschland')
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/impressum/"',
        )
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/datenschutz/"',
        )
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
            attachments: [],
            subject: 'Gradido: Bibi Bloxberg has redeemed your Gradido link',
            html: expect.any(String),
            text: expect.stringContaining('BIBI BLOXBERG HAS REDEEMED YOUR GRADIDO LINK'),
          }),
        })
      })

      it('has correct header', () => {
        expect(result.originalMessage.html).toContain(`src="${headerImageURL}"`)
      })

      it('has correct doctype and language set', () => {
        expect(result.originalMessage.html).toContain('<!DOCTYPE html>')
        expect(result.originalMessage.html).toContain('<html lang="en"')
      })

      it('has correct heading, salutation, and text', () => {
        expect(result.originalMessage.html).toContain(
          '>Bibi Bloxberg has redeemed your Gradido link</h1>',
        )
        expect(result.originalMessage.html).toContain('Hello Peter Lustig,')
        expect(result.originalMessage.html).toContain(
          'Bibi Bloxberg (bibi@bloxberg.de) has just redeemed your link.',
        )
      })

      it('has correct CTA block', () => {
        expect(result.originalMessage.html).toContain('>Transaction details</h2>')
        expect(result.originalMessage.html).toContain('Amount: 17.65 GDD')
        expect(result.originalMessage.html).toContain('Message: You deserve it! 🙏🏼')
        expect(result.originalMessage.html).toContain(
          'You can find transaction details in your Gradido account.',
        )
        expect(result.originalMessage.html).toContain(
          '<a class="button-3 w-button" href="https://gdd.gradido.net/transactions"',
        )
        expect(result.originalMessage.html).toContain('>To account</a>')
        expect(result.originalMessage.html).toContain('Please do not reply to this email.')
      })

      it('has correct greating formula', () => {
        expect(result.originalMessage.html).toContain('Kind regards,<br')
        expect(result.originalMessage.html).toContain('>your Gradido team')
      })

      it('has correct footer', () => {
        expect(result.originalMessage.html).toContain('href="https://t.me/GradidoGruppe"')
        expect(result.originalMessage.html).toContain('href="https://www.youtube.com/c/GradidoNet"')
        expect(result.originalMessage.html).toContain('href="https://twitter.com/gradido"')
        expect(result.originalMessage.html).toContain(
          'href="https://www.facebook.com/groups/Gradido/"',
        )
        expect(result.originalMessage.html).toContain('<div class="line"')
        expect(result.originalMessage.html).toContain(
          'If you have any further questions, please contact our support',
        )
        expect(result.originalMessage.html).toContain('support@gradido.net')
        expect(result.originalMessage.html).toContain(
          'src="https://gdd.gradido.net/img/brand/green.png"',
        )
        expect(result.originalMessage.html).toContain('Gradido-Akademie')
        expect(result.originalMessage.html).toContain('Institut für Wirtschaftsbionik')
        expect(result.originalMessage.html).toContain('Pfarrweg 2')
        expect(result.originalMessage.html).toContain('74653 Künzelsau')
        expect(result.originalMessage.html).toContain('Deutschland')
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/impressum/"',
        )
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/datenschutz/"',
        )
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
            attachments: [],
            subject: 'Gradido: Bibi Bloxberg has sent you 37.40 Gradido',
            html: expect.any(String),
            text: expect.stringContaining('BIBI BLOXBERG HAS SENT YOU 37.40 GRADIDO'),
          }),
        })
      })

      it('has correct header', () => {
        expect(result.originalMessage.html).toContain(`src="${headerImageURL}"`)
      })

      it('has correct doctype and language set', () => {
        expect(result.originalMessage.html).toContain('<!DOCTYPE html>')
        expect(result.originalMessage.html).toContain('<html lang="en"')
      })

      it('has correct heading, salutation, and text', () => {
        expect(result.originalMessage.html).toContain(
          '>Bibi Bloxberg has sent you 37.40 Gradido</h1>',
        )
        expect(result.originalMessage.html).toContain('Hello Peter Lustig,')
        expect(result.originalMessage.html).toContain(
          'You have just received 37.40 GDD from Bibi Bloxberg (bibi@bloxberg.de).',
        )
      })

      it('has correct CTA block', () => {
        expect(result.originalMessage.html).toContain('>Transaction details</h2>')
        expect(result.originalMessage.html).toContain(
          'You can find transaction details in your Gradido account.',
        )
        expect(result.originalMessage.html).toContain(
          '<a class="button-3 w-button" href="https://gdd.gradido.net/transactions"',
        )
        expect(result.originalMessage.html).toContain('>To account</a>')
        expect(result.originalMessage.html).toContain('Please do not reply to this email.')
      })

      it('has correct greating formula', () => {
        expect(result.originalMessage.html).toContain('Kind regards,<br')
        expect(result.originalMessage.html).toContain('>your Gradido team')
      })

      it('has correct footer', () => {
        expect(result.originalMessage.html).toContain('href="https://t.me/GradidoGruppe"')
        expect(result.originalMessage.html).toContain('href="https://www.youtube.com/c/GradidoNet"')
        expect(result.originalMessage.html).toContain('href="https://twitter.com/gradido"')
        expect(result.originalMessage.html).toContain(
          'href="https://www.facebook.com/groups/Gradido/"',
        )
        expect(result.originalMessage.html).toContain('<div class="line"')
        expect(result.originalMessage.html).toContain(
          'If you have any further questions, please contact our support',
        )
        expect(result.originalMessage.html).toContain('support@gradido.net')
        expect(result.originalMessage.html).toContain(
          'src="https://gdd.gradido.net/img/brand/green.png"',
        )
        expect(result.originalMessage.html).toContain('Gradido-Akademie')
        expect(result.originalMessage.html).toContain('Institut für Wirtschaftsbionik')
        expect(result.originalMessage.html).toContain('Pfarrweg 2')
        expect(result.originalMessage.html).toContain('74653 Künzelsau')
        expect(result.originalMessage.html).toContain('Deutschland')
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/impressum/"',
        )
        expect(result.originalMessage.html).toContain(
          '<a class="terms_of_use" href="https://gradido.net/de/datenschutz/"',
        )
      })
    })
  })
})
