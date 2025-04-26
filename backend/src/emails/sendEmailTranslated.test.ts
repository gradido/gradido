import { createTransport } from 'nodemailer'

import { i18n, logger } from '@test/testSetup'

import { CONFIG } from '@/config'

import { sendEmailTranslated } from './sendEmailTranslated'

const testMailServerHost = 'localhost'
const testMailServerPort = 1025

CONFIG.EMAIL = false
CONFIG.EMAIL_SMTP_HOST = testMailServerHost
CONFIG.EMAIL_SMTP_PORT = testMailServerPort
CONFIG.EMAIL_SENDER = 'info@gradido.net'
CONFIG.EMAIL_USERNAME = 'user'
CONFIG.EMAIL_PASSWORD = 'pwd'
CONFIG.EMAIL_TLS = true

jest.mock('nodemailer', () => {
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

describe('sendEmailTranslated', () => {
  let result: Record<string, unknown> | boolean | null

  describe('config email is false', () => {
    beforeEach(async () => {
      result = await sendEmailTranslated({
        receiver: {
          to: 'receiver@mail.org',
          cc: 'support@gradido.net',
        },
        template: 'accountMultiRegistration',
        locals: {
          locale: 'en',
        },
      })
    })

    it('logs warning', () => {
      expect(logger.info).toBeCalledWith('Emails are disabled via config...')
    })

    it('returns false', () => {
      expect(result).toBeFalsy()
    })
  })

  describe('config email is true', () => {
    beforeEach(async () => {
      CONFIG.EMAIL = true
      result = await sendEmailTranslated({
        receiver: {
          to: 'receiver@mail.org',
          cc: 'support@gradido.net',
        },
        template: 'accountMultiRegistration',
        locals: {
          locale: 'en',
        },
      })
    })

    it('calls the transporter', () => {
      expect(createTransport).toBeCalledWith({
        host: testMailServerHost,
        port: testMailServerPort,
        secure: false,
        requireTLS: true,
        auth: {
          user: 'user',
          pass: 'pwd',
        },
      })
    })

    describe('call of "sendEmailTranslated"', () => {
      it('has expected result', () => {
        expect(result).toMatchObject({
          originalMessage: expect.objectContaining({
            to: 'receiver@mail.org',
            cc: 'support@gradido.net',
            from: 'Gradido (emails.general.doNotAnswer) <info@gradido.net>',
            attachments: expect.any(Array),
            subject: 'Try To Register Again With Your Email',
            html: expect.stringContaining('Try To Register Again With Your Email'),
            text: expect.stringContaining('TRY TO REGISTER AGAIN WITH YOUR EMAIL'),
          }),
        })
      })
    })

    it.skip('calls "i18n.setLocale" with "en"', () => {
      expect(i18n.setLocale).toBeCalledWith('en')
    })

    it.skip('calls "i18n.__" for translation', () => {
      expect(i18n.__).toBeCalled()
    })
  })

  describe('with email EMAIL_TEST_MODUS true', () => {
    beforeEach(async () => {
      jest.clearAllMocks()
      CONFIG.EMAIL = true
      CONFIG.EMAIL_TEST_MODUS = true
      result = await sendEmailTranslated({
        receiver: {
          to: 'receiver@mail.org',
          cc: 'support@gradido.net',
        },
        template: 'accountMultiRegistration',
        locals: {
          locale: 'en',
        },
      })
    })

    it('call of "sendEmailTranslated" with faked "to"', () => {
      expect(result).toMatchObject({
        originalMessage: expect.objectContaining({
          to: CONFIG.EMAIL_TEST_RECEIVER,
          cc: 'support@gradido.net',
          from: `Gradido (emails.general.doNotAnswer) <${CONFIG.EMAIL_SENDER}>`,
          attachments: expect.any(Array),
          subject: 'Try To Register Again With Your Email',
          html: expect.stringContaining('Try To Register Again With Your Email'),
          text: expect.stringContaining('TRY TO REGISTER AGAIN WITH YOUR EMAIL'),
        }),
      })
    })
  })
})
