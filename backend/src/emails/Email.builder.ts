import { Contribution } from '@entity/Contribution'
import { Transaction } from '@entity/Transaction'
import { User } from '@entity/User'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { TimeDuration } from '@/util/time'
import { decimalSeparatorByLanguage, resetInterface } from '@/util/utilities'

import { sendEmailTranslated } from './sendEmailTranslated'

export interface EmailLocals {
  firstName: string
  lastName: string
  locale: string
  supportEmail: string
  communityURL: string
  senderFirstName?: string
  senderLastName?: string
  senderEmail?: string
  contributionMemo?: string
  contributionAmount?: string
  overviewURL?: string
  activationLink?: string
  timeDurationObject?: TimeDuration
  resendLink?: string
  resetLink?: string
  transactionMemo?: string
  transactionAmount?: string
  [key: string]: string | TimeDuration | undefined
}

export enum EmailType {
  NONE = 'none',
  ACCOUNT_ACTIVATION = 'accountActivation',
  ACCOUNT_MULTI_REGISTRATION = 'accountMultiRegistration',
  ADDED_CONTRIBUTION_MESSAGE = 'addedContributionMessage',
  CONTRIBUTION_CONFIRMED = 'contributionConfirmed',
  CONTRIBUTION_DELETED = 'contributionDeleted',
  CONTRIBUTION_DENIED = 'contributionDenied',
  CONTRIBUTION_CHANGED_BY_MODERATOR = 'contributionChangedByModerator',
  RESET_PASSWORD = 'resetPassword',
  TRANSACTION_LINK_REDEEMED = 'transactionLinkRedeemed',
  TRANSACTION_RECEIVED = 'transactionReceived',
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class EmailBuilder {
  private receiver: { to: string }
  private type: EmailType
  private locals: EmailLocals

  // https://refactoring.guru/design-patterns/builder/typescript/example
  /**
   * A fresh builder instance should contain a blank product object, which is
   * used in further assembly.
   */
  constructor() {
    this.reset()
  }

  public reset(): void {
    this.receiver.to = ''
    this.type = EmailType.NONE
    this.locals = resetInterface(this.locals)
  }

  protected setLocalsFromConfig(): void {
    this.locals.overviewURL = CONFIG.EMAIL_LINK_OVERVIEW
    this.locals.supportEmail = CONFIG.COMMUNITY_SUPPORT_MAIL
    this.locals.communityURL = CONFIG.COMMUNITY_URL
    switch (this.type) {
      case EmailType.ACCOUNT_ACTIVATION:
      case EmailType.ACCOUNT_MULTI_REGISTRATION:
      case EmailType.RESET_PASSWORD:
        this.locals.resendLink = CONFIG.EMAIL_LINK_FORGOTPASSWORD
    }
  }

  protected checkIfFieldsSet(names: string[]): void {
    for (const name of names) {
      // eslint-disable-next-line security/detect-object-injection
      if (!this.locals[name]) {
        throw new LogError(`missing field with ${name}`)
      }
    }
  }

  /**
   * check if non default fields a set for type
   */
  protected checkRequiredFields(): void {
    switch (this.type) {
      case EmailType.NONE:
        throw new LogError('please call setType before to set email type')
      case EmailType.ACCOUNT_ACTIVATION:
        this.checkIfFieldsSet(['activationLink', 'timeDurationObject', 'resendLink'])
        break
      case EmailType.ACCOUNT_MULTI_REGISTRATION:
        this.checkIfFieldsSet(['resendLink'])
        break
      // CONTRIBUTION_CONFIRMED has same required fields as ADDED_CONTRIBUTION_MESSAGE plus contributionAmount
      case EmailType.CONTRIBUTION_CONFIRMED:
        this.checkIfFieldsSet(['contributionAmount'])
      // eslint-disable-next-line no-fallthrough
      case EmailType.ADDED_CONTRIBUTION_MESSAGE:
      case EmailType.CONTRIBUTION_DELETED:
      case EmailType.CONTRIBUTION_DENIED:
        this.checkIfFieldsSet(['senderFirstName', 'senderLastName', 'contributionMemo'])
        break
      case EmailType.CONTRIBUTION_CHANGED_BY_MODERATOR:
        // this.checkIfFieldsSet([''])
        break
      case EmailType.RESET_PASSWORD:
        this.checkIfFieldsSet(['resetLink', 'timeDurationObject', 'resendLink'])
        break
      // TRANSACTION_LINK_REDEEMED has same required fields as TRANSACTION_RECEIVED plus transactionMemo
      case EmailType.TRANSACTION_LINK_REDEEMED:
        this.checkIfFieldsSet(['transactionMemo'])
      // eslint-disable-next-line no-fallthrough
      case EmailType.TRANSACTION_RECEIVED:
        this.checkIfFieldsSet([
          'senderFirstName',
          'senderLastName',
          'senderEmail',
          'transactionAmount',
        ])
        break
    }
  }

  /**
   * Concrete Builders are supposed to provide their own methods for
   * retrieving results. That's because various types of builders may create
   * entirely different products that don't follow the same interface.
   * Therefore, such methods cannot be declared in the base Builder interface
   * (at least in a statically typed programming language).
   *
   * Usually, after returning the end result to the client, a builder instance
   * is expected to be ready to start producing another product. That's why
   * it's a usual practice to call the reset method at the end of the
   * `getProduct` method body. However, this behavior is not mandatory, and
   * you can make your builders wait for an explicit reset call from the
   * client code before disposing of the previous result.
   */
  public sendEmail(): Promise<Record<string, unknown> | boolean | null> {
    this.setLocalsFromConfig()
    // will throw if a field is missing
    this.checkRequiredFields()
    const result = sendEmailTranslated({
      receiver: this.receiver,
      template: this.type.toString(),
      locals: this.locals,
    })
    this.reset()
    return result
  }

  public setRecipient(recipient: User): this {
    this.receiver.to = `${recipient.firstName} ${recipient.lastName} <${recipient.emailContact.email}>`
    this.locals.firstName = recipient.firstName
    this.locals.lastName = recipient.lastName
    this.locals.locale = recipient.language
    return this
  }

  public setSender(sender: User): this {
    this.locals.senderEmail = sender.emailContact.email
    this.locals.senderFirstName = sender.firstName
    this.locals.senderLastName = sender.lastName
    return this
  }

  public setType(type: EmailType): this {
    this.type = type
    return this
  }

  public setResetLink(resetLink: string): this {
    this.locals.resentLink = resetLink
    return this
  }

  public setContribution(contribution: Contribution): this {
    this.locals.contributionMemo = contribution.memo
    if (!this.locals.locale || this.locals.locale === '') {
      throw new LogError('missing locale please call setRecipient before')
    }
    this.locals.contributionAmount = decimalSeparatorByLanguage(
      contribution.amount,
      this.locals.locale,
    )
    return this
  }

  public setTransaction(transaction: Transaction): this {
    this.locals.transactionMemo = transaction.memo
    if (!this.locals.locale || this.locals.locale === '') {
      throw new LogError('missing locale please call setRecipient before')
    }
    this.locals.transactionAmount = decimalSeparatorByLanguage(
      transaction.amount,
      this.locals.locale,
    )
    return this
  }

  public setActivationLink(activationLink: string): this {
    this.locals.activationLink = activationLink
    return this
  }

  public setTimeDurationObject(timeDurationObject: TimeDuration): this {
    this.locals.timeDurationObject = timeDurationObject
    return this
  }
}
