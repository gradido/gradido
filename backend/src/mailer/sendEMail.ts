import { backendLogger as logger } from '@/server/logger'
import { createTransport } from 'nodemailer'

import CONFIG from '@/config'

export const sendEMail = async (emailDef: {
  to: string
  subject: string
  text: string
}): Promise<boolean> => {
  logger.info(`send Email: to=${emailDef.to}, subject=${emailDef.subject}, text=${emailDef.text}`)

  if (!CONFIG.EMAIL) {
    logger.info(`Emails are disabled via config...`)
    return false
  }
  const transporter = createTransport({
    host: CONFIG.EMAIL_SMTP_URL,
    port: Number(CONFIG.EMAIL_SMTP_PORT),
    secure: false, // true for 465, false for other ports
    requireTLS: true,
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
