import { sendEMail } from './sendEMail'
import { accountMultiRegistration } from './text/accountMultiRegistration'
import CONFIG from '@/config'

export const sendAccountMultiRegistrationEmail = (data: {
  firstName: string
  lastName: string
  email: string
}): Promise<boolean> => {
  return sendEMail({
    to: `${data.firstName} ${data.lastName} <${data.email}>`,
    cc: CONFIG.EMAIL_EMAIL_SUPPORT,
    subject: accountMultiRegistration.de.subject,
    text: accountMultiRegistration.de.text({
      ...data,
      resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD,
      supportLink: CONFIG.EMAIL_LINK_SUPPORT,
    }),
  })
}
