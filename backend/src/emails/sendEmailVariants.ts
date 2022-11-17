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
      firstName: data.firstName,
      lastName: data.lastName,
      locale: data.language,
      resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD,
    },
  })
}

export const sendAccountActivationEmail = (data: {
  firstName: string
  lastName: string
  email: string
  language: string
  activationLink: string
  timeDurationObject: Record<string, unknown>
}): Promise<Record<string, unknown> | null> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'sendAccountActivation',
    locals: {
      firstName: data.firstName,
      lastName: data.lastName,
      locale: data.language,
      activationLink: data.activationLink,
      timeDurationObject: data.timeDurationObject,
      resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD,
    },
  })
}
