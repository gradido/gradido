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
  // Wolle: test this …
  // because language of receiver can differ from language of current user who triggers the sending
  const rememberLocaleToRestore = i18n.getLocale()
  // Wolle:
  // console.log('sendEmailTranslated – i18n.getLocale, incoming from user: ', i18n.getLocale())

  i18n.setLocale('en') // for logging
  // Wolle:
  // console.log('sendEmailTranslated – i18n.getLocale, logging: ', i18n.getLocale())
  logger.info(
    `send Email: language=${params.locals.locale} to=${params.receiver.to}` +
      (params.receiver.cc ? `, cc=${params.receiver.cc}` : '') +
      `, subject=${i18n.__('emails.' + params.template + '.subject')}`,
  )

  i18n.setLocale(params.locals.locale) // for email
  // Wolle:
  // console.log('sendEmailTranslated – i18n.getLocale, email: ', i18n.getLocale())
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
    // i18n, // is only needed if you don't install i18n
  })

  // TESTING: to send emails to yourself set .env "EMAIL_TEST_MODUS=true" and "EMAIL_TEST_RECEIVER" to your preferred email address
  // ATTENTION: await is needed, because otherwise on send the email gets send in the language from the current user, because below the language gets reset to the current user
  await email
    .send({
      template: path.join(__dirname, params.template),
      message: params.receiver,
      locals: params.locals,
    })
    .then((result: unknown) => {
      logger.info('Send email successfully !!!')
      logger.info('Result: ', result)
    })
    .catch((error: unknown) => {
      logger.error('Error sending notification email: ', error)
      throw new Error('Error sending notification email!')
    })

  // Wolle: !!! if we do this without an await on send the email gets send in the language from the current user !!!
  i18n.setLocale(rememberLocaleToRestore)
  // Wolle:
  // console.log('sendEmailTranslated – i18n.getLocale, reset: ', i18n.getLocale())

  return true
}
