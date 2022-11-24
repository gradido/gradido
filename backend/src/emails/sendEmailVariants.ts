import i18n from 'i18n'
import Decimal from 'decimal.js-light'
import CONFIG from '@/config'
import { sendEmailTranslated } from './sendEmailTranslated'

export const sendAddedContributionMessageEmail = (data: {
  firstName: string
  lastName: string
  email: string
  language: string
  senderFirstName: string
  senderLastName: string
  contributionMemo: string
}): Promise<Record<string, unknown> | null> => {
  return sendEmailTranslated({
    receiver: {
      to: `${data.firstName} ${data.lastName} <${data.email}>`,
    },
    template: 'addedContributionMessage',
    locals: {
      firstName: data.firstName,
      lastName: data.lastName,
      locale: data.language,
      senderFirstName: data.senderFirstName,
      senderLastName: data.senderLastName,
      contributionMemo: data.contributionMemo,
      overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
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
    template: 'accountActivation',
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

export const sendContributionConfirmedEmail = (data: {
  firstName: string
  lastName: string
  email: string
  language: string
  senderFirstName: string
  senderLastName: string
  contributionMemo: string
  contributionAmount: Decimal
}): Promise<Record<string, unknown> | null> => {
  const rememberLocaleToRestore = i18n.getLocale()
  i18n.setLocale(data.language)
  const contributionAmount = data.contributionAmount
    .toFixed(2)
    .replace('.', i18n.__('emails.general.decimalSeparator'))
  i18n.setLocale(rememberLocaleToRestore)
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'contributionConfirmed',
    locals: {
      firstName: data.firstName,
      lastName: data.lastName,
      locale: data.language,
      senderFirstName: data.senderFirstName,
      senderLastName: data.senderLastName,
      contributionMemo: data.contributionMemo,
      contributionAmount,
      overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
    },
  })
}

export const sendContributionRejectedEmail = (data: {
  firstName: string
  lastName: string
  email: string
  language: string
  senderFirstName: string
  senderLastName: string
  contributionMemo: string
}): Promise<Record<string, unknown> | null> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'contributionRejected',
    locals: {
      firstName: data.firstName,
      lastName: data.lastName,
      locale: data.language,
      senderFirstName: data.senderFirstName,
      senderLastName: data.senderLastName,
      contributionMemo: data.contributionMemo,
      overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
    },
  })
}

export const sendResetPasswordEmail = (data: {
  firstName: string
  lastName: string
  email: string
  language: string
  resetLink: string
  timeDurationObject: Record<string, unknown>
}): Promise<Record<string, unknown> | null> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'resetPassword',
    locals: {
      firstName: data.firstName,
      lastName: data.lastName,
      locale: data.language,
      resetLink: data.resetLink,
      timeDurationObject: data.timeDurationObject,
      resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD,
    },
  })
}
