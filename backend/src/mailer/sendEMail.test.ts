import { sendEMail } from './sendEMail'
import { createTransport } from 'nodemailer'
import CONFIG from '@/config'

import { logger } from '@test/testSetup'

CONFIG.EMAIL = false
CONFIG.EMAIL_SMTP_URL = 'EMAIL_SMTP_URL'
CONFIG.EMAIL_SMTP_PORT = '1234'
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

describe('sendEMail', () => {
  let result: boolean
  describe('config email is false', () => {
    beforeEach(async () => {
      jest.clearAllMocks()
      result = await sendEMail({
        to: 'receiver@mail.org',
        cc: 'support@gradido.net',
        subject: 'Subject',
        text: 'Text text text',
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
      jest.clearAllMocks()
      CONFIG.EMAIL = true
      result = await sendEMail({
        to: 'receiver@mail.org',
        cc: 'support@gradido.net',
        subject: 'Subject',
        text: 'Text text text',
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

    it('calls sendMail of transporter', () => {
      expect((createTransport as jest.Mock).mock.results[0].value.sendMail).toBeCalledWith({
        from: `Gradido (nicht antworten) <${CONFIG.EMAIL_SENDER}>`,
        to: 'receiver@mail.org',
        cc: 'support@gradido.net',
        subject: 'Subject',
        text: 'Text text text',
      })
    })

    it('returns true', () => {
      expect(result).toBeTruthy()
    })
  })

  describe('with email EMAIL_TEST_MODUS true', () => {
    beforeEach(async () => {
      jest.clearAllMocks()
      CONFIG.EMAIL = true
      CONFIG.EMAIL_TEST_MODUS = true
      result = await sendEMail({
        to: 'receiver@mail.org',
        cc: 'support@gradido.net',
        subject: 'Subject',
        text: 'Text text text',
      })
    })

    it('calls sendMail of transporter with faked to', () => {
      expect((createTransport as jest.Mock).mock.results[0].value.sendMail).toBeCalledWith({
        from: `Gradido (nicht antworten) <${CONFIG.EMAIL_SENDER}>`,
        to: CONFIG.EMAIL_TEST_RECEIVER,
        cc: 'support@gradido.net',
        subject: 'Subject',
        text: 'Text text text',
      })
    })
  })
})
