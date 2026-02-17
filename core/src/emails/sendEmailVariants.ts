import { Decimal } from 'decimal.js-light'

import { CONFIG } from '../config'
import { decimalSeparatorByLanguage } from '../util/utilities'

import { sendEmailTranslated } from './sendEmailTranslated'

export interface EmailCommonData {
  firstName: string
  lastName: string
  email: string
  language: string
}

export interface ContributionEmailCommonData {
  senderFirstName: string
  senderLastName: string
  contributionMemo: string
  contributionFrontendLink: string
}

function getEmailCommonLocales(): Record<string, unknown> {
  return {
    supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
    resendLink: CONFIG.EMAIL_LINK_FORGOTPASSWORD,
    communityURL: CONFIG.COMMUNITY_URL,
  }
}

export const sendAddedContributionMessageEmail = (
  data: EmailCommonData &
    ContributionEmailCommonData & {
      message: string
    },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: {
      to: `${data.firstName} ${data.lastName} <${data.email}>`,
    },
    template: 'addedContributionMessage',
    locals: {
      ...data,
      ...getEmailCommonLocales(),
    },
  })
}

export const sendAccountActivationEmail = (
  data: EmailCommonData & {
    activationLink: string
    timeDurationObject: Record<string, unknown>
    logoUrl?: string | null
  },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'accountActivation',
    locals: {
      ...data,
      ...getEmailCommonLocales(),
    },
  })
}

export const sendAccountMultiRegistrationEmail = (
  data: EmailCommonData,
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'accountMultiRegistration',
    locals: {
      ...data,
      ...getEmailCommonLocales(),
    },
  })
}

export const sendContributionConfirmedEmail = (
  data: EmailCommonData &
    ContributionEmailCommonData & {
      contributionAmount: Decimal
    },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'contributionConfirmed',
    locals: {
      ...data,
      ...getEmailCommonLocales(),
      contributionAmount: decimalSeparatorByLanguage(data.contributionAmount, data.language),
    },
  })
}

export const sendContributionChangedByModeratorEmail = (
  data: EmailCommonData &
    ContributionEmailCommonData & {
      contributionMemoUpdated: string
    },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'contributionChangedByModerator',
    locals: {
      ...data,
      ...getEmailCommonLocales(),
      contributionMemoUpdated: data.contributionMemoUpdated,
    },
  })
}

export const sendContributionDeletedEmail = (
  data: EmailCommonData & ContributionEmailCommonData,
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'contributionDeleted',
    locals: {
      ...data,
      ...getEmailCommonLocales(),
    },
  })
}

export const sendContributionDeniedEmail = (
  data: EmailCommonData & ContributionEmailCommonData,
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'contributionDenied',
    locals: {
      ...data,
      ...getEmailCommonLocales(),
    },
  })
}

export const sendResetPasswordEmail = (
  data: EmailCommonData & {
    resetLink: string
    timeDurationObject: Record<string, unknown>
  },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'resetPassword',
    locals: {
      ...data,
      ...getEmailCommonLocales(),
    },
  })
}

export const sendTransactionLinkRedeemedEmail = (
  data: EmailCommonData & {
    senderFirstName: string
    senderLastName: string
    senderEmail: string
    transactionMemo: string
    transactionAmount: Decimal
  },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'transactionLinkRedeemed',
    locals: {
      ...data,
      transactionAmount: decimalSeparatorByLanguage(data.transactionAmount, data.language),
      ...getEmailCommonLocales(),
    },
  })
}

export const sendTransactionReceivedEmail = (
  data: EmailCommonData & {
    senderFirstName: string
    senderLastName: string
    senderEmail: string | null
    memo: string
    transactionAmount: Decimal
  },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: data.senderEmail !== null ? 'transactionReceived' : 'transactionReceivedNoSender',
    locals: {
      ...data,
      transactionAmount: decimalSeparatorByLanguage(data.transactionAmount, data.language),
      ...data.senderEmail !== null ? getEmailCommonLocales() : {locale: data.language},
    },
  })
}
