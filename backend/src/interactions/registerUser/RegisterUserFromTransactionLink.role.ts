import { sendAccountActivationEmail } from 'core'
import {
  dbFindContributionLinkIdByCode,
  dbFindTransactionLinkByCode,
  dbInsertEvent,
  EventInsert,
  UserInsert,
} from 'database'
import { Logger } from 'log4js'
import { CONFIG } from '@/config'
import { EventType } from '@/event/EventType'
import { getTimeDurationObject } from '@/util/time'
import { CreateUser } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'

export class RegisterUserFromTransactionLinkRole extends RegisterUserRole {
  private redeemCode: string
  private contributionLinkId: number | null = null
  private transactionLinkId: number | null = null

  constructor(user: CreateUser) {
    super(user)
    if (!user.redeemCode) {
      throw new Error('Missing redeem code')
    }
    this.redeemCode = user.redeemCode
  }

  public async prepareUser(): Promise<UserInsert> {
    const dbUser = await super.prepareUser()
    if (this.redeemCode.match(/^CL-/)) {
      const contributionLinkId = await dbFindContributionLinkIdByCode(this.redeemCode)
      if (contributionLinkId) {
        dbUser.contributionLinkId = contributionLinkId
        this.contributionLinkId = contributionLinkId
      }
    } else {
      const transactionLink = await dbFindTransactionLinkByCode(this.redeemCode)
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
      activationLink: `${activationLink}/${this.redeemCode}`,
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
    })
    if (result instanceof Error) {
      throw result
    }
    return result !== null
  }

  public storeUserRegisterEvent(): Promise<void> {
    const userId = this.userId
    if (!userId) {
      new Error('Missing user id')
    }
    const event: EventInsert = {
      type: EventType.USER_REGISTER_REDEEM,
      affectedUserId: userId,
      actingUserId: userId,
    }
    if (this.contributionLinkId) {
      event.involvedContributionLink = this.contributionLinkId
    } else if (this.transactionLinkId) {
      event.involvedTransactionLink = this.transactionLinkId
    } else {
      return super.storeUserRegisterEvent()
    }

    return dbInsertEvent(event)
  }
}
