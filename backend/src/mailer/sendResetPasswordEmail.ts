import { sendEMail } from './sendEMail'
import { resetPassword } from './text/resetPassword'

export const sendResetPasswordEmail = (data: {
  link: string
  firstName: string
  lastName: string
  email: string
}): Promise<boolean> => {
  return sendEMail({
    to: `${data.firstName} ${data.lastName} <${data.email}>`,
    subject: resetPassword.de.subject,
    text: resetPassword.de.text(data),
  })
}
