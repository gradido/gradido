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
  'data:image/jpeg;base64,/9j/4QAWRXhpZgAATU0AKgAAAAgAAAAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/+IH2ElDQ19QUk9GSUxFAAEBAAAHyGFwcGwCIAAAbW50clJHQiBYWVogB9kAAgAZAAsAGgALYWNzcEFQUEwAAAAAYXBwbAAAAAAAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y1hcHBsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALZGVzYwAAAQgAAABvZHNjbQAAAXgAAAWKY3BydAAABwQAAAA4d3RwdAAABzwAAAAUclhZWgAAB1AAAAAUZ1hZWgAAB2QAAAAUYlhZWgAAB3gAAAAUclRSQwAAB4wAAAAOY2hhZAAAB5wAAAAsYlRSQwAAB4wAAAAOZ1RSQwAAB4wAAAAOZGVzYwAAAAAAAAAUR2VuZXJpYyBSR0IgUHJvZmlsZQAAAAAAAAAAAAAAFEdlbmVyaWMgUkdCIFByb2ZpbGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG1sdWMAAAAAAAAAHwAAAAxza1NLAAAAKAAAAYRkYURLAAAAJAAAAaxjYUVTAAAAJAAAAdB2aVZOAAAAJAAAAfRwdEJSAAAAJgAAAhh1a1VBAAAAKgAAAj5mckZVAAAAKAAAAmhodUhVAAAAKAAAApB6aFRXAAAAEgAAArhrb0tSAAAAFgAAAspuYk5PAAAAJgAAAuBjc0NaAAAAIgAAAwZoZUlMAAAAHgAAAyhyb1JPAAAAJAAAA0ZkZURFAAAALAAAA2ppdElUAAAAKAAAA5ZzdlNFAAAAJgAAAuB6aENOAAAAEgAAA75qYUpQAAAAGgAAA9BlbEdSAAAAIgAAA+pwdFBPAAAAJgAABAxubE5MAAAAKAAABDJlc0VTAAAAJgAABAx0aFRIAAAAJAAABFp0clRSAAAAIgAABH5maUZJAAAAKAAABKBockhSAAAAKAAABMhwbFBMAAAALAAABPBydVJVAAAAIgAABRxlblVTAAAAJgAABT5hckVHAAAAJgAABWQAVgFhAGUAbwBiAGUAYwBuAP0AIABSAEcAQgAgAHAAcgBvAGYAaQBsAEcAZQBuAGUAcgBlAGwAIABSAEcAQgAtAHAAcgBvAGYAaQBsAFAAZQByAGYAaQBsACAAUgBHAEIAIABnAGUAbgDoAHIAaQBjAEMepQB1ACAAaADsAG4AaAAgAFIARwBCACAAQwBoAHUAbgBnAFAAZQByAGYAaQBsACAAUgBHAEIAIABHAGUAbgDpAHIAaQBjAG8EFwQwBDMEMAQ7BEwEPQQ4BDkAIAQ/BEAEPgREBDAEOQQ7ACAAUgBHAEIAUAByAG8AZgBpAGwAIABnAOkAbgDpAHIAaQBxAHUAZQAgAFIAVgBCAMEAbAB0AGEAbADhAG4AbwBzACAAUgBHAEIAIABwAHIAbwBmAGkAbJAadSgAUgBHAEKCcl9pY8+P8Md8vBgAIABSAEcAQgAg1QS4XNMMx3wARwBlAG4AZQByAGkAcwBrACAAUgBHAEIALQBwAHIAbwBmAGkAbABPAGIAZQBjAG4A/QAgAFIARwBCACAAcAByAG8AZgBpAGwF5AXoBdUF5AXZBdwAIABSAEcAQgAgBdsF3AXcBdkAUAByAG8AZgBpAGwAIABSAEcAQgAgAGcAZQBuAGUAcgBpAGMAQQBsAGwAZwBlAG0AZQBpAG4AZQBzACAAUgBHAEIALQBQAHIAbwBmAGkAbABQAHIAbwBmAGkAbABvACAAUgBHAEIAIABnAGUAbgBlAHIAaQBjAG9mbpAaAFIARwBCY8+P8GWHTvZOAIIsACAAUgBHAEIAIDDXMO0w1TChMKQw6wOTA7UDvQO5A7oDzAAgA8ADwQO/A8YDrwO7ACAAUgBHAEIAUABlAHIAZgBpAGwAIABSAEcAQgAgAGcAZQBuAOkAcgBpAGMAbwBBAGwAZwBlAG0AZQBlAG4AIABSAEcAQgAtAHAAcgBvAGYAaQBlAGwOQg4bDiMORA4fDiUOTAAgAFIARwBCACAOFw4xDkgOJw5EDhsARwBlAG4AZQBsACAAUgBHAEIAIABQAHIAbwBmAGkAbABpAFkAbABlAGkAbgBlAG4AIABSAEcAQgAtAHAAcgBvAGYAaQBpAGwAaQBHAGUAbgBlAHIAaQENAGsAaQAgAFIARwBCACAAcAByAG8AZgBpAGwAVQBuAGkAdwBlAHIAcwBhAGwAbgB5ACAAcAByAG8AZgBpAGwAIABSAEcAQgQeBDEESQQ4BDkAIAQ/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oooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAjZO4qu8Qb2NXKQgHrQBkSQY6j8az5rUMOR+NdGUPaqrwK33ePagDkZ7HrxWLPpwOcCu9khxwRVGW1U9RQB5pc6YO4/EVjTaSD2/A16nLY+lZsunr3FAHlcmkf7P5U1NHBPKfnXpL6appo0xc96AOIg0dR149hW9aaZt+6PxNdFFp4B6ZrVgs/UUAZlpp5GMAGuggtAoGRVmKHb2rShizyen86AK0cIAzg1cjgXbk5yauIufpUtAFHyV9/wDP4UohT3q7RQBVESj+H/P61IIz9KmooAYEHf8Az+tPoooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9f+/iiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACkKg0tFAEJjP1qu8KnpxV6kIB60AZL25Hb8qrNADW0wAOBTCqt1FAGE1qp6imi1APT/AD+VbhiQ9qb5Ke9AGStuB2qwkPOBz9K0BEg7U8ADpQBAkGPvflVpUz9KVAD1qWgAAxxRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQB/9k='

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
        expect(result.originalMessage.html).toContain(CONFIG.COMMUNITY_SUPPORT_MAIL)
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
        expect(result.originalMessage.html).toContain(CONFIG.COMMUNITY_SUPPORT_MAIL)
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
          expect(result.originalMessage.html).toContain(CONFIG.COMMUNITY_SUPPORT_MAIL)
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
        expect(result.originalMessage.html).toContain(CONFIG.COMMUNITY_SUPPORT_MAIL)
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
        expect(result.originalMessage.html).toContain(CONFIG.COMMUNITY_SUPPORT_MAIL)
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
        expect(result.originalMessage.html).toContain(CONFIG.COMMUNITY_SUPPORT_MAIL)
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
        expect(result.originalMessage.html).toContain(CONFIG.COMMUNITY_SUPPORT_MAIL)
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
        expect(result.originalMessage.html).toContain(CONFIG.COMMUNITY_SUPPORT_MAIL)
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
        expect(result.originalMessage.html).toContain(CONFIG.COMMUNITY_SUPPORT_MAIL)
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
