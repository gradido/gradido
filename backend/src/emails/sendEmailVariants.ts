import { decimalSeparatorByLanguage } from 'core'
import { Decimal } from 'decimal.js-light'
import { CONFIG } from '@/config'

import { sendEmailTranslated } from './sendEmailTranslated'

export interface ContributionEmailCommonData {
  firstName: string
  lastName: string
  email: string
  language: string
  senderFirstName: string
  senderLastName: string
  contributionMemo: string
  contributionFrontendLink: string
}

function toContributionEmailLocales(data: ContributionEmailCommonData): Record<string, unknown> {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    locale: data.language,
    senderFirstName: data.senderFirstName,
    senderLastName: data.senderLastName,
    contributionMemo: data.contributionMemo,
    contributionFrontendLink: data.contributionFrontendLink,
    supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
  }
}

export const sendAddedContributionMessageEmail = (
  data: ContributionEmailCommonData & {
    message: string
  },
): Promise<Record<string, unknown> | boolean | null> => {
  return sendEmailTranslated({
    receiver: {
      to: `${data.firstName} ${data.lastName} <${data.email}>`,
    },
    template: 'addedContributionMessage',
    locals: {
      ...toContributionEmailLocales(data),
      message: data.message,
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
  logoUrl?: string | null
}): Promise<Record<string, unknown> | boolean | null> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'accountActivation',
    locals: {
      firstName: data.firstName,
      lastName: data.lastName,
      locale: data.language,
      activationLink: data.activationLink,
      timeDurationObject: data.timeDurationObject,
      logoUrl: data.logoUrl,
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
}): Promise<Record<string, unknown> | boolean | null> => {
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

export const sendContributionConfirmedEmail = (
  data: ContributionEmailCommonData & {
    contributionAmount: Decimal
  },
): Promise<Record<string, unknown> | boolean | null> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'contributionConfirmed',
    locals: {
      ...toContributionEmailLocales(data),
      contributionAmount: decimalSeparatorByLanguage(data.contributionAmount, data.language),
    },
  })
}

export const sendContributionChangedByModeratorEmail = (
  data: ContributionEmailCommonData & {
    contributionMemoUpdated: string
  },
): Promise<Record<string, unknown> | boolean | null> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'contributionChangedByModerator',
    locals: {
      ...toContributionEmailLocales(data),
      contributionMemoUpdated: data.contributionMemoUpdated,
    },
  })
}

export const sendContributionDeletedEmail = (
  data: ContributionEmailCommonData,
): Promise<Record<string, unknown> | boolean | null> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'contributionDeleted',
    locals: toContributionEmailLocales(data),
  })
}

export const sendContributionDeniedEmail = (
  data: ContributionEmailCommonData,
): Promise<Record<string, unknown> | boolean | null> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'contributionDenied',
    locals: toContributionEmailLocales(data),
  })
}

export const sendResetPasswordEmail = (data: {
  firstName: string
  lastName: string
  email: string
  language: string
  resetLink: string
  timeDurationObject: Record<string, unknown>
}): Promise<Record<string, unknown> | boolean | null> => {
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
}): Promise<Record<string, unknown> | boolean | null> => {
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
  memo: string
  transactionAmount: Decimal
}): Promise<Record<string, unknown> | boolean | null> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'transactionReceived',
    locals: {
      firstName: data.firstName,
      lastName: data.lastName,
      locale: data.language,
      memo: data.memo,
      senderFirstName: data.senderFirstName,
      senderLastName: data.senderLastName,
      senderEmail: data.senderEmail,
      transactionAmount: decimalSeparatorByLanguage(data.transactionAmount, data.language),
      supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
      communityURL: CONFIG.COMMUNITY_URL,
    },
  })
}
