import path from 'path'

import Email from 'email-templates'
import i18n from 'i18n'
import { createTransport } from 'nodemailer'

import CONFIG from '@/config'
import { backendLogger as logger } from '@/server/logger'

export const sendEmailTranslated = async ({
  receiver,
  template,
  locals,
}: {
  receiver: {
    to: string
    cc?: string
  }
  template: string
  locals: Record<string, unknown>
}): Promise<Record<string, unknown> | boolean | null> => {
  // TODO: test the calling order of 'i18n.setLocale' for example: language of logging 'en', language of email receiver 'es', reset language of current user 'de'

  if (!CONFIG.EMAIL) {
    logger.info(`Emails are disabled via config...`)
    return null
  }

  // because language of receiver can differ from language of current user who triggers the sending
  // const rememberLocaleToRestore = i18n.getLocale()

  i18n.setLocale('en') // for logging
  logger.info(
    `send Email: language=${locals.locale as string} to=${receiver.to}` +
      (receiver.cc ? `, cc=${receiver.cc}` : '') +
      `, subject=${i18n.__('emails.' + template + '.subject')}`,
  )

  if (CONFIG.EMAIL_TEST_MODUS) {
    logger.info(
      `Testmodus=ON: change receiver from ${receiver.to} to ${CONFIG.EMAIL_TEST_RECEIVER}`,
    )
    receiver.to = CONFIG.EMAIL_TEST_RECEIVER
  }
  const transport = createTransport({
    host: CONFIG.EMAIL_SMTP_URL,
    port: CONFIG.EMAIL_SMTP_PORT,
    secure: false, // true for 465, false for other ports
    requireTLS: CONFIG.EMAIL_TLS,
    auth: {
      user: CONFIG.EMAIL_USERNAME,
      pass: CONFIG.EMAIL_PASSWORD,
    },
  })

  i18n.setLocale(locals.locale as string) // for email

  // TESTING: see 'README.md'
  const email = new Email({
    message: {
      from: `Gradido (${i18n.__('emails.general.doNotAnswer')}) <${CONFIG.EMAIL_SENDER}>`,
    },
    transport,
    preview: false,
    // i18n, // is only needed if you don't install i18n
  })

  const resultSend = await email
    .send({
      template: path.join(__dirname, 'templates', template),
      message: receiver,
      locals, // the 'locale' in here seems not to be used by 'email-template', because it doesn't work if the language isn't set before by 'i18n.setLocale'
    })
    .catch((error: unknown) => {
      logger.error('Error sending notification email', error)
      return false
    })

  return resultSend
}
