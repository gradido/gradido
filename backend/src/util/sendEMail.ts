import { createTransport } from 'nodemailer'

import CONFIG from '../config'

const sendEMail = async (emailDef: {
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

const sendAccountActivationEmail = (
  activationLink: string,
  firstName: string,
  lastName: string,
  email: string,
): Promise<boolean> => {
  return sendEMail({
    from: `Gradido (nicht antworten) <${CONFIG.EMAIL_SENDER}>`,
    to: `${firstName} ${lastName} <${email}>`,
    subject: 'Gradido: E-Mail Überprüfung',
    text: `Hallo ${firstName} ${lastName},
        
        Deine EMail wurde soeben bei Gradido registriert.
        
        Klicke bitte auf diesen Link, um die Registrierung abzuschließen und dein Gradido-Konto zu aktivieren:
        ${activationLink}
        oder kopiere den obigen Link in dein Browserfenster.
        
        Mit freundlichen Grüßen,
        dein Gradido-Team`,
  })
}

export { sendAccountActivationEmail, sendEMail }
