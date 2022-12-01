import { backendLogger as logger } from '@/server/logger'
import { createTransport } from 'nodemailer'

import CONFIG from '@/config'

export const sendEMail = async (emailDef: {
  to: string
  cc?: string
  subject: string
  text: string
}): Promise<boolean> => {
  logger.info(
    `send Email: to=${emailDef.to}` +
      (emailDef.cc ? `, cc=${emailDef.cc}` : '') +
      `, subject=${emailDef.subject}, text=${emailDef.text}`,
  )

  if (!CONFIG.EMAIL) {
    logger.info(`Emails are disabled via config...`)
    return false
  }
  if (CONFIG.EMAIL_TEST_MODUS) {
    logger.info(
      `Testmodus=ON: change receiver from ${emailDef.to} to ${CONFIG.EMAIL_TEST_RECEIVER}`,
    )
    emailDef.to = CONFIG.EMAIL_TEST_RECEIVER
  }
  const transporter = createTransport({
    host: CONFIG.EMAIL_SMTP_URL,
    port: Number(CONFIG.EMAIL_SMTP_PORT),
    secure: false, // true for 465, false for other ports
    requireTLS: false,
    auth: {
      user: CONFIG.EMAIL_USERNAME,
      pass: CONFIG.EMAIL_PASSWORD,
    },
  })
  const info = await transporter.sendMail({
    ...emailDef,
    from: `Gradido (nicht antworten) <${CONFIG.EMAIL_SENDER}>`,
  })
  if (!info.messageId) {
    logger.error('error sending notification email, but transaction succeed')
    throw new Error('error sending notification email, but transaction succeed')
  }
  logger.info('send Email successfully.')
  return true
}
