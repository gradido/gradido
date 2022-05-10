import { sendEMail, logger } from './sendEMail'
import { createTransport } from 'nodemailer'
import CONFIG from '@/config'

import { getLogger } from '@/server/logger'

CONFIG.EMAIL = false
CONFIG.EMAIL_SMTP_URL = 'EMAIL_SMTP_URL'
CONFIG.EMAIL_SMTP_PORT = '1234'
CONFIG.EMAIL_USERNAME = 'user'
CONFIG.EMAIL_PASSWORD = 'pwd'

jest.mock('@/server/logger', () => {
  const originalModule = jest.requireActual('@/server/logger')
  return {
    __esModule: true,
    ...originalModule,
    getLogger: jest.fn(() => {
      return {
        addContext: jest.fn(),
        trace: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        fatal: jest.fn(),
      }
    }),
  }
})

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
  describe('logger', () => {
    it('initializes the logger', () => {
      expect(getLogger).toBeCalledWith('backend.mailer.sendEMail')
    })
  })

  describe('config email is false', () => {
    beforeEach(async () => {
      result = await sendEMail({
        to: 'receiver@mail.org',
        subject: 'Subject',
        text: 'Text text text',
      })
    })

    it('logs warining', () => {
      expect(logger.info).toBeCalledWith('Emails are disabled via config...')
    })

    it('returns false', () => {
      expect(result).toBeFalsy()
    })
  })

  describe('config email is true', () => {
    beforeEach(async () => {
      CONFIG.EMAIL = true
      result = await sendEMail({
        to: 'receiver@mail.org',
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
        subject: 'Subject',
        text: 'Text text text',
      })
    })

    it('returns true', () => {
      expect(result).toBeTruthy()
    })
  })
})
