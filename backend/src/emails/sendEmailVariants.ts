import CONFIG from '@/config'
import { sendEmailTranslated } from './sendEmailTranslated'

export const sendAccountMultiRegistrationEmail = (data: {
  firstName: string
  lastName: string
  email: string
  language: string
}): Promise<Record<string, unknown> | null> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'accountMultiRegistration',
    locals: {
      locale: data.language,
      firstName: data.firstName,
      lastName: data.lastName,
      resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD,
    },
  })
}
