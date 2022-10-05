import { sendEmailTranslated } from './sendEmailTranslated'
import CONFIG from '@/config'

export const sendAccountMultiRegistrationEmail = (data: {
  firstName: string
  lastName: string
  email: string
}): Promise<boolean> => {
  // Wolle: console.log('sendAccountMultiRegistrationEmail !!!')
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'accountMultiRegistration',
    locals: {
      subject: 'Gradido: Erneuter Registrierungsversuch mit deiner E-Mail',
      firstName: data.firstName,
      lastName: data.lastName,
      resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD,
    },
  })
}
