import CONFIG from '@/config'
import { backendLogger as logger } from '@/server/logger'
import path from 'path'
import { createTransport } from 'nodemailer'
import Email from 'email-templates'
import i18n from 'i18n'

export const sendEmailTranslated = async (params: {
  receiver: {
    to: string
    cc?: string
  }
  template: string
  locals: Record<string, unknown>
}): Promise<Record<string, unknown> | null> => {
  let resultSend: Record<string, unknown> | null = null

  // TODO: test the calling order of 'i18n.setLocale' for example: language of logging 'en', language of email receiver 'es', reset language of current user 'de'

  // because language of receiver can differ from language of current user who triggers the sending
  const rememberLocaleToRestore = i18n.getLocale()

  i18n.setLocale('en') // for logging
  logger.info(
    `send Email: language=${params.locals.locale} to=${params.receiver.to}` +
      (params.receiver.cc ? `, cc=${params.receiver.cc}` : '') +
      `, subject=${i18n.__('emails.' + params.template + '.subject')}`,
  )

  if (!CONFIG.EMAIL) {
    logger.info(`Emails are disabled via config...`)
    return null
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

  i18n.setLocale(params.locals.locale as string) // for email

  // TESTING: see 'README.md'
  const email = new Email({
    message: {
      from: `Gradido (nicht antworten) <${CONFIG.EMAIL_SENDER}>`,
    },
    transport,
    preview: false,
    // i18n, // is only needed if you don't install i18n
  })

  // ATTENTION: await is needed, because otherwise on send the email gets send in the language of the current user, because below the language gets reset
  await email
    .send({
      template: path.join(__dirname, params.template),
      message: params.receiver,
      locals: params.locals, // the 'locale' in here seems not to be used by 'email-template', because it doesn't work if the language isn't set before by 'i18n.setLocale'
    })
    .then((result: Record<string, unknown>) => {
      resultSend = result
      logger.info('Send email successfully !!!')
      logger.info('Result: ', result)
    })
    .catch((error: unknown) => {
      logger.error('Error sending notification email: ', error)
      throw new Error('Error sending notification email!')
    })

  i18n.setLocale(rememberLocaleToRestore)

  return resultSend
}
