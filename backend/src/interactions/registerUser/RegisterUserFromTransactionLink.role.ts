import { sendAccountActivationEmail } from 'core'
import {
  DrizzleTransaction,
  dbFindContributionLinkIdByCode,
  dbFindTransactionLinkByCode,
  dbInsertEvent,
  EventInsert,
  EventType,
  UserInsert,
} from 'database'
import { parseOrThrowFirstIssue } from 'shared'
import { CONFIG } from '@/config'
import { getTimeDurationObject } from '@/util/time'
import { CreateUser, RedeemRegistration, redeemRegistrationSchema } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'

enum RedeemCodeType {
  ContributionLink,
  TransactionLink,
}

export class RegisterUserFromTransactionLinkRole extends RegisterUserRole<RedeemRegistration> {
  private contributionLinkId: number | null = null
  protected transactionLinkId: number | null = null
  private type: RedeemCodeType

  constructor(createUserInput: CreateUser) {
    super(parseOrThrowFirstIssue(redeemRegistrationSchema, createUserInput))
    if (this.user.redeemCode.match(/^CL-/)) {
      this.type = RedeemCodeType.ContributionLink
    } else {
      this.type = RedeemCodeType.TransactionLink
    }
  }

  public getRoleTitle(): string {
    if (this.type === RedeemCodeType.ContributionLink) {
      return 'Register User with Contribution Link Code'
    } else {
      return 'Register User with Transaction Link Code'
    }
  }

  public async prepareUser(): Promise<UserInsert> {
    const dbUser = await super.prepareUser()
    if (this.type === RedeemCodeType.ContributionLink) {
      const contributionLinkId = await dbFindContributionLinkIdByCode(this.user.redeemCode)
      if (contributionLinkId) {
        dbUser.contributionLinkId = contributionLinkId
        this.contributionLinkId = contributionLinkId
      }
    } else {
      const transactionLink = await dbFindTransactionLinkByCode(this.user.redeemCode)
      if (transactionLink) {
        dbUser.referrerId = transactionLink.userId
        this.transactionLinkId = transactionLink.id
      }
    }
    return dbUser
  }

  public async sendAccountActivationEmail(activationLink: string): Promise<boolean> {
    const { firstName, lastName, language, email } = this.user
    const result = await sendAccountActivationEmail({
      firstName,
      lastName,
      email,
      language,
      activationLink: `${activationLink}/${this.user.redeemCode}`,
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
    })
    if (result instanceof Error) {
      throw result
    }
    return result !== null
  }

  // `tx`: only RegisterUserFromVouchingLinkRole hands one in, to write the event with the account.
  public storeUserRegisterEvent(tx?: DrizzleTransaction): Promise<void> {
    const userId = this.userId
    if (!userId) {
      throw new Error('Missing user id')
    }
    const event: EventInsert = {
      type: EventType.USER_REGISTER_REDEEM,
      affectedUserId: userId,
      actingUserId: userId,
    }
    if (this.contributionLinkId) {
      event.involvedContributionLinkId = this.contributionLinkId
    } else if (this.transactionLinkId) {
      event.involvedTransactionLinkId = this.transactionLinkId
    } else {
      return super.storeUserRegisterEvent()
    }

    return dbInsertEvent(event, tx)
  }
}
