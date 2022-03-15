import { sendEMail } from './sendEMail'
import { accountActivation } from './text/accountActivation'

export const sendAccountActivationEmail = (data: {
  link: string
  firstName: string
  lastName: string
  email: string
}): Promise<boolean> => {
  return sendEMail({
    to: `${data.firstName} ${data.lastName} <${data.email}>`,
    subject: accountActivation.de.subject,
    text: accountActivation.de.text(data),
  })
}
