import { sendEMail } from './sendEMail'
import { accountActivation } from './text/accountActivation'
import CONFIG from '@/config'

export const sendAccountActivationEmail = (data: {
  link: string
  firstName: string
  lastName: string
  email: string
  duration: string
}): Promise<boolean> => {
  return sendEMail({
    to: `${data.firstName} ${data.lastName} <${data.email}>`,
    subject: accountActivation.de.subject,
    text: accountActivation.de.text({ ...data, resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD }),
  })
}
