import { Decimal } from 'decimal.js-light'
import { getLogger } from 'log4js'
import { GradidoUnit } from 'shared'
import { CONFIG } from '../config'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import { decimalSeparatorByLanguage } from '../util/utilities'
import { sendEmailTranslated } from './sendEmailTranslated'

const createLogger = () => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.emails.sendEmailVariants`)

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
      contributionAmount: GradidoUnit
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

/**
 * The receipt for somebody who paid with their printed card.
 *
 * ⚠️ This is not a courtesy, it is part of the security model. The limits cap what can be
 * lost in a DAY; only a member who NOTICES and blocks the card turns that into a cap for
 * good. Without this mail a watched PIN keeps bleeding until somebody happens to scroll
 * through their account.
 *
 * That is also why it carries a block link rather than only pointing at the account: the
 * moment the receipt is read is the moment blocking has to be one reach away.
 */
export const sendThankYouCardPaidEmail = (
  data: EmailCommonData & {
    recipientName: string
    recipientCommunity: string
    transactionMemo: string
    transactionAmount: GradidoUnit
    cardLabel: string
    cardId: number
  },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'thankYouCardPaid',
    locals: {
      ...data,
      transactionAmount: decimalSeparatorByLanguage(data.transactionAmount, data.language),
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
    transactionAmount: GradidoUnit
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
    transactionAmount: GradidoUnit
  },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: data.senderEmail !== null ? 'transactionReceived' : 'transactionReceivedNoSender',
    locals: {
      ...data,
      transactionAmount: decimalSeparatorByLanguage(data.transactionAmount, data.language),
      ...(data.senderEmail !== null ? getEmailCommonLocales() : { locale: data.language }),
    },
  })
}

export const sendCustomEmail = (
  data: EmailCommonData & {
    senderFirstName: string
    senderLastName: string
    subject: string
    memo: string
    senderUuid?: string
    senderCommunityUuid?: string
  },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  const logger = createLogger()
  logger.debug(`sendCustomEmail(data=${JSON.stringify(data)})`)
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'customEmail',
    locals: {
      ...data,
      subject: data.subject,
      ...getEmailCommonLocales(),
    },
  })
}
