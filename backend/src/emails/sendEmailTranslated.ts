import { backendLogger as logger } from '@/server/logger'
import path from 'path'
import { createTransport } from 'nodemailer'
import Email from 'email-templates'
import i18n from 'i18n'

import CONFIG from '@/config'

export const sendEmailTranslated = async (params: {
  receiver: {
    to: string
    cc?: string
  }
  template: string
  locals: Record<string, string>
}): Promise<boolean> => {
  i18n.setLocale(params.locals.locale)

  logger.info(
    `send Email: to=${params.receiver.to}` +
      (params.receiver.cc ? `, cc=${params.receiver.cc}` : '') +
      `, subject=${i18n.__('emails.' + params.template + '.subject')}`,
  )

  if (!CONFIG.EMAIL) {
    logger.info(`Emails are disabled via config...`)
    return false
  }
  if (CONFIG.EMAIL_TEST_MODUS) {
    logger.info(
      `Testmodus=ON: change receiver from ${params.receiver.to} to ${CONFIG.EMAIL_TEST_RECEIVER}`,
    )
    params.receiver.to = CONFIG.EMAIL_TEST_RECEIVER
  }
  const transport = createTransport({
    host: CONFIG.EMAIL_SMTP_URL,
    port: Number(CONFIG.EMAIL_SMTP_PORT),
    secure: false, // true for 465, false for other ports
    requireTLS: true,
    auth: {
      user: CONFIG.EMAIL_USERNAME,
      pass: CONFIG.EMAIL_PASSWORD,
    },
  })

  const email = new Email({
    message: {
      from: `Gradido (nicht antworten) <${CONFIG.EMAIL_SENDER}>`,
    },
    // uncomment below to send emails in development/test env:
    // send: true,
    // transport: {
    //   jsonTransport: true,
    // },
    transport,
    // uncomment below to open send emails in the browser
    // preview: {
    //   open: {
    //     app: 'firefox',
    //     wait: false,
    //   },
    // },
    // i18n, // seems not to be needed
  })

  email
    .send({
      template: path.join(__dirname, params.template),
      message: params.receiver,
      locals: params.locals,
    })
    .then((result: unknown) => {
      logger.info('Send email successfully.')
      logger.info('Result: ', result)
    })
    .catch((error: unknown) => {
      logger.error('Error sending notification email: ', error)
      throw new Error('Error sending notification email!')
    })

  return true
}
