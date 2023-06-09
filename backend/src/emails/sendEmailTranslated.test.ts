/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createTransport } from 'nodemailer'

import { logger, i18n } from '@test/testSetup'

import { CONFIG } from '@/config'

import { sendEmailTranslated } from './sendEmailTranslated'

CONFIG.EMAIL = false
CONFIG.EMAIL_SMTP_URL = 'EMAIL_SMTP_URL'
CONFIG.EMAIL_SMTP_PORT = 1234
CONFIG.EMAIL_USERNAME = 'user'
CONFIG.EMAIL_PASSWORD = 'pwd'
CONFIG.EMAIL_TLS = true

jest.mock('nodemailer', () => {
  return {
    __esModule: true,
    createTransport: jest.fn(() => {
      return {
        sendMail: jest.fn(() => {
          return {
            messageId: 'message',
          }
        }),
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
        host: 'EMAIL_SMTP_URL',
        port: 1234,
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
          envelope: {
            from: 'info@gradido.net',
            to: ['receiver@mail.org', 'support@gradido.net'],
          },
          message: expect.any(String),
          originalMessage: expect.objectContaining({
            to: 'receiver@mail.org',
            cc: 'support@gradido.net',
            from: 'Gradido (do not answer) <info@gradido.net>',
            attachments: [],
            subject: 'Gradido: Try To Register Again With Your Email',
            html: expect.stringContaining('Gradido: Try To Register Again With Your Email'),
            text: expect.stringContaining('GRADIDO: TRY TO REGISTER AGAIN WITH YOUR EMAIL'),
          }),
        })
      })
    })

    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('calls "i18n.setLocale" with "en"', () => {
      expect(i18n.setLocale).toBeCalledWith('en')
    })

    // eslint-disable-next-line jest/no-disabled-tests
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
        envelope: {
          from: CONFIG.EMAIL_SENDER,
          to: [CONFIG.EMAIL_TEST_RECEIVER, 'support@gradido.net'],
        },
        message: expect.any(String),
        originalMessage: expect.objectContaining({
          to: CONFIG.EMAIL_TEST_RECEIVER,
          cc: 'support@gradido.net',
          from: `Gradido (do not answer) <${CONFIG.EMAIL_SENDER}>`,
          attachments: [],
          subject: 'Gradido: Try To Register Again With Your Email',
          html: expect.stringContaining('Gradido: Try To Register Again With Your Email'),
          text: expect.stringContaining('GRADIDO: TRY TO REGISTER AGAIN WITH YOUR EMAIL'),
        }),
      })
    })
  })
})
