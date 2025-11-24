import path from 'path'
import Email from 'email-templates'
import { i18n } from './localization'
import { createTransport } from 'nodemailer'
import { CONFIG } from '../config'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import { getLogger } from 'log4js'
import gradidoHeader from './templates/includes/gradido-header.jpeg'
import facebookIcon from './templates/includes/facebook-icon.png'
import telegramIcon from './templates/includes/telegram-icon.png'
import twitterIcon from './templates/includes/twitter-icon.png'
import youtubeIcon from './templates/includes/youtube-icon.png'
import chatboxIcon from './templates/includes/chatbox-icon.png'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.emails.sendEmailTranslated`)

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
    `send Email: language=${locals.locale as string} to=${receiver.to.substring(0, 3)}...` +
      (receiver.cc ? `, cc=${receiver.cc.substring(0, 3)}...` : '') +
      `, subject=${i18n.__('emails.' + template + '.subject')}`,
  )

  if (CONFIG.EMAIL_TEST_MODUS) {
    logger.info(
      `Testmodus=ON: change receiver from ${receiver.to} to ${CONFIG.EMAIL_TEST_RECEIVER}`,
    )
    receiver.to = CONFIG.EMAIL_TEST_RECEIVER
  }
  
  const transport = createTransport({
    host: CONFIG.EMAIL_SMTP_HOST,
    port: CONFIG.EMAIL_SMTP_PORT,
    secure: false, // true for 465, false for other ports
    requireTLS: CONFIG.EMAIL_TLS,
    auth: {
      user: CONFIG.EMAIL_USERNAME,
      pass: CONFIG.EMAIL_PASSWORD,
    },
  })

  i18n.setLocale(locals.language as string) // for email
  // TESTING: see 'README.md'
  const email = new Email({
    message: {
      from: `Gradido (${i18n.__('emails.general.doNotAnswer')}) <${CONFIG.EMAIL_SENDER}>`,
    },
    send: CONFIG.EMAIL,
    transport,
    preview: false,
  })
  const resultSend = await email
    .send({
      template: path.join(__dirname, 'templates', template),
      message: {
        ...receiver,
        attachments: [
          {
            // filename: 'gradido-header.jpeg',
            content: gradidoHeader,
            cid: 'gradidoheader',
          },
          {
            // filename: 'facebook-icon.png',
            content: facebookIcon,
            cid: 'facebookicon',
          },
          {
            // filename: 'telegram-icon.png',
            content: telegramIcon,
            cid: 'telegramicon',
          },
          {
            // filename: 'twitter-icon.png',
            content: twitterIcon,
            cid: 'twittericon',
          },
          {
            // filename: 'youtube-icon.png',
            content: youtubeIcon,
            cid: 'youtubeicon',
          },
          {
             // filename: 'chatbox-icon.png',
            content: chatboxIcon,
            cid: 'chatboxicon',
          },
        ],
      },
      locals, // the 'locale' in here seems not to be used by 'email-template', because it doesn't work if the language isn't set before by 'i18n.setLocale'
      // t: i18n.__.bind(i18n),
    })
    .catch((error: unknown) => {
      logger.error('Error sending notification email', error)
      throw error
    })

  return resultSend
}
