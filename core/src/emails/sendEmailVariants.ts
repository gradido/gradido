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
  // helperLink (EM-013): set only when the registration attempt carried a redeem code —
  // the mail then offers "I am helping someone set up a Gradido account". Absent, the
  // mail renders exactly as it always has.
  data: EmailCommonData & { helperLink?: string | null },
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

/**
 * The guest's half of an assisted registration (EM-013): account and password already
 * exist, this mail only asks them to confirm that the address is theirs.
 */
export const sendAssistedRegistrationConfirmEmail = (
  data: EmailCommonData & {
    confirmLink: string
    timeDurationObject: Record<string, unknown>
  },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'assistedRegistrationConfirm',
    locals: {
      ...data,
      ...getEmailCommonLocales(),
    },
  })
}

/** To the NEW address: the click that makes it the member's address. */
export const sendEmailChangeConfirmEmail = (
  data: EmailCommonData & {
    confirmLink: string
    timeDurationObject: Record<string, unknown>
  },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'emailChangeConfirm',
    locals: {
      ...data,
      ...getEmailCommonLocales(),
    },
  })
}

/**
 * To the OLD address: a notice with a veto link, not a precondition. Whoever still reads
 * that mailbox can throw the change away; whoever lost it is not held up by it.
 */
export const sendEmailChangeNoticeEmail = (
  data: EmailCommonData & {
    newEmail: string
    revokeLink: string
    timeDurationObject: Record<string, unknown>
  },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'emailChangeNotice',
    locals: {
      ...data,
      ...getEmailCommonLocales(),
    },
  })
}

/** After the change, to both addresses. */
export const sendEmailChangeDoneEmail = (
  data: EmailCommonData & {
    oldEmail: string
    newEmail: string
  },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'emailChangeDone',
    locals: {
      ...data,
      ...getEmailCommonLocales(),
    },
  })
}

/**
 * To the support mailbox. The GDT server and the newsletter are keyed by address and get
 * brought up to date by hand; this mail is what sets that in motion. `gdtEmail` is the
 * address the GDT server is asked with - the one to merge the new address into.
 */
export const sendEmailChangeSupportEmail = (
  data: EmailCommonData & {
    alias: string
    oldEmail: string
    newEmail: string
    gdtEmail: string
    /** A change back to an address the member held before - nothing to merge on the GDT server. */
    takeBack: boolean
    /**
     * The replaced address was never confirmed (an EM-013 typo correction): it was never
     * on the GDT server and never in Klick-Tipp - the new address only needs entering.
     */
    typoCorrection: boolean
  },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: data.email },
    template: 'emailChangeSupport',
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

/**
 * The uuids are what makes a reply possible, so they decide whether the template shows
 * the reply button - the sender's e-mail address no longer appears in this mail at all.
 *
 * It used to be the address that decided, through a second template
 * (`transactionReceivedNoSender`) whose only difference was the missing mailto. With the
 * address gone the two templates were the same page, so there is one again, with the
 * button behind an `if` - the shape `customEmail` has always used.
 */
export const sendTransactionReceivedEmail = (
  data: EmailCommonData & {
    senderFirstName: string
    senderLastName: string
    memo: string
    transactionAmount: GradidoUnit
    senderUuid?: string
    senderCommunityUuid?: string
  },
): Promise<Record<string, unknown> | boolean | null | Error> => {
  return sendEmailTranslated({
    receiver: { to: `${data.firstName} ${data.lastName} <${data.email}>` },
    template: 'transactionReceived',
    locals: {
      ...data,
      transactionAmount: decimalSeparatorByLanguage(data.transactionAmount, data.language),
      ...getEmailCommonLocales(),
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
