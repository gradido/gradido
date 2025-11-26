import { createTransport } from 'nodemailer'
import { CONFIG } from '../config'
import { i18n } from './localization'
import { getLogger } from '../../../config-schema/test/testSetup.bun'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import { sendEmailTranslated } from './sendEmailTranslated'
import { mock, jest, describe, it, expect, beforeEach, afterAll } from 'bun:test'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.emails.sendEmailTranslated`)

const testMailServerHost = 'localhost'
const testMailServerPort = 1025

CONFIG.EMAIL = false
CONFIG.EMAIL_SMTP_HOST = testMailServerHost
CONFIG.EMAIL_SMTP_PORT = testMailServerPort
CONFIG.EMAIL_SENDER = 'info@gradido.net'
CONFIG.EMAIL_USERNAME = 'user'
CONFIG.EMAIL_PASSWORD = 'pwd'
CONFIG.EMAIL_TLS = true

mock.module('nodemailer', () => {
  return {
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

afterAll(() => {
  jest.restoreAllMocks()
})

const spySetLocale = jest.spyOn(i18n, 'setLocale')
const spyTranslate = jest.spyOn(i18n, '__')

describe('sendEmailTranslated', () => {
  let result: Record<string, unknown> | boolean | null | Error

  describe('config email is false', () => {
    beforeEach(async () => {
      result = await sendEmailTranslated({
        receiver: {
          to: 'receiver@mail.org',
          cc: 'support@gradido.net',
        },
        template: 'accountMultiRegistration',
        locals: {
          language: 'en',
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
          language: 'en',
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
    
    it('calls "i18n.setLocale" with "en"', async () => {
      expect(spySetLocale).toBeCalledWith('en')
    })

    it('calls "i18n.__" for translation', () => {
      expect(spyTranslate).toBeCalled()
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
          language: 'en',
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
