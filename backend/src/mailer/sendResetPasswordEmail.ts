import { sendEMail } from './sendEMail'
import { resetPassword } from './text/resetPassword'
import CONFIG from '@/config'

export const sendResetPasswordEmail = (data: {
  link: string
  firstName: string
  lastName: string
  email: string
  duration: string
}): Promise<boolean> => {
  return sendEMail({
    to: `${data.firstName} ${data.lastName} <${data.email}>`,
    subject: resetPassword.de.subject,
    text: resetPassword.de.text({ ...data, resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD }),
  })
}
