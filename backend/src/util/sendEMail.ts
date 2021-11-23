import { createTransport } from 'nodemailer'

import CONFIG from '../config'

export const sendEMail = async (emailDef: {
  from: string
  to: string
  subject: string
  text: string
}): Promise<boolean> => {
  if (!CONFIG.EMAIL) {
    // eslint-disable-next-line no-console
    console.log('Emails are disabled via config')
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
  const info = await transporter.sendMail(emailDef)
  if (!info.messageId) {
    throw new Error('error sending notification email, but transaction succeed')
  }
  return true
}
