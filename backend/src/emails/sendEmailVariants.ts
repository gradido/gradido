import Decimal from 'decimal.js-light'
import CONFIG from '@/config'
import { decimalSeparatorByLanguage } from '@/util/utilities'
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
      supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
      communityURL: CONFIG.COMMUNITY_URL,
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
      supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
      communityURL: CONFIG.COMMUNITY_URL,
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
      supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
      communityURL: CONFIG.COMMUNITY_URL,
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
      contributionAmount: decimalSeparatorByLanguage(data.contributionAmount, data.language),
      overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
      supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
      communityURL: CONFIG.COMMUNITY_URL,
    },
  })
}

export const sendContributionDeletedEmail = (data: {
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
    template: 'contributionDeleted',
    locals: {
      firstName: data.firstName,
      lastName: data.lastName,
      locale: data.language,
      senderFirstName: data.senderFirstName,
      senderLastName: data.senderLastName,
      contributionMemo: data.contributionMemo,
      overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
      supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
      communityURL: CONFIG.COMMUNITY_URL,
    },
  })
}

export const sendContributionDeniedEmail = (data: {
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
    template: 'contributionDenied',
    locals: {
      firstName: data.firstName,
      lastName: data.lastName,
      locale: data.language,
      senderFirstName: data.senderFirstName,
      senderLastName: data.senderLastName,
      contributionMemo: data.contributionMemo,
      overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
      supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
      communityURL: CONFIG.COMMUNITY_URL,
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
      supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
      communityURL: CONFIG.COMMUNITY_URL,
    },
  })
}

export const sendTransactionLinkRedeemedEmail = (data: {
  firstName: string
  lastName: string
  email: string
  language: string
  senderFirstName: string
  senderLastName: string
  senderEmail: string
  transactionMemo: string
  transactionAmount: Decimal
}): Promise<Record<string, unknown> | null> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'transactionLinkRedeemed',
    locals: {
      firstName: data.firstName,
      lastName: data.lastName,
      locale: data.language,
      senderFirstName: data.senderFirstName,
      senderLastName: data.senderLastName,
      senderEmail: data.senderEmail,
      transactionMemo: data.transactionMemo,
      transactionAmount: decimalSeparatorByLanguage(data.transactionAmount, data.language),
      overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
      supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
      communityURL: CONFIG.COMMUNITY_URL,
    },
  })
}

export const sendTransactionReceivedEmail = (data: {
  firstName: string
  lastName: string
  email: string
  language: string
  senderFirstName: string
  senderLastName: string
  senderEmail: string
  transactionAmount: Decimal
}): Promise<Record<string, unknown> | null> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'transactionReceived',
    locals: {
      firstName: data.firstName,
      lastName: data.lastName,
      locale: data.language,
      senderFirstName: data.senderFirstName,
      senderLastName: data.senderLastName,
      senderEmail: data.senderEmail,
      transactionAmount: decimalSeparatorByLanguage(data.transactionAmount, data.language),
      overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
      supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
      communityURL: CONFIG.COMMUNITY_URL,
    },
  })
}
