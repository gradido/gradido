import {
  AccountState,
  DbUser,
  DrizzleTransaction,
  dbFindUserById,
  dbInsertEvent,
  EventType,
  UserInsert,
} from 'database'
import { Logger } from 'log4js'
import { parseOrThrowFirstIssue, Result } from 'shared'
import { verifyGuarantorCode } from '@/data/GuarantorCode.logic'
import { CreateUser, GuarantorRegistration, guarantorRegistrationSchema } from './createUser.schema'
import { RegisterUserDuplicateError } from './errorTypes'
import { RegisterUserRole } from './RegisterUser.role'

export class RegisterUserGuarantorRole extends RegisterUserRole<GuarantorRegistration> {
  private referrerId: number | null = null

  public getRoleTitle(): string {
    return 'Register User with Guarantor'
  }

  constructor(createUserInput: CreateUser) {
    super(parseOrThrowFirstIssue(guarantorRegistrationSchema, createUserInput))
  }

  // The code names the member who showed it; the address the guest came from is not asked.
  // Checked before the address is looked at, like everything about the code.
  public async prepareUser(): Promise<UserInsert> {
    const dbUser = await super.prepareUser()
    const referrerId = verifyGuarantorCode(
      this.user.guarantorCode,
      dbUser.communityUuid,
      this.startDate,
    )
    // Deleted after showing the code: without the member, nobody vouches.
    const referrer = referrerId ? await dbFindUserById(referrerId) : null
    if (!referrer) {
      throw new Error('Guarantor code invalid or expired')
    }
    dbUser.referrerId = referrer.id
    // Acts before the address is confirmed, and counts against the referrer's GUARANTOR_LIMIT
    // until it is. The password type stays NO_PASSWORD until afterRun stores the hash.
    dbUser.accountState = AccountState.PARTLY_ACTIVATED_GUARANTOR
    this.referrerId = referrer.id
    return dbUser
  }

  public async storeUserAndUserContact(
    dbUser: UserInsert,
    logger: Logger,
    tx: DrizzleTransaction,
  ): Promise<Result<number, RegisterUserDuplicateError>> {
    // it take some time, let it run in parallel
    this.startPasswordEncryption(dbUser.gradidoId, this.user.password)

    const referrerId = dbUser.referrerId
    if (!referrerId) {
      throw new Error('Guarantor code invalid or expired')
    }

    // E-019: an account that can act without confirming email address at first is opened only while the member who
    // vouches for it holds fewer than GUARANTOR_LIMIT PARTLY_ACTIVATED_GUARANTOR ones. Counted here,
    // before the address: at the limit a taken address gets the same refusal as a free one -
    // the silence below would tell them apart - and a request over the limit never waits in
    // the member's line. Counted again in that line, where it decides: one after another per
    // member in this process, and whoever waits holds no connection.
    if (!(await this.guarantorHoldsPlace(referrerId, tx))) {
      throw new Error('Vouching limit reached')
    }
    // running normal RegisterUser Stuff from RegisterUserRole
    return await super.storeUserAndUserContact(dbUser, logger, tx)
  }

  // The password exists already, so the set-password page behind the activation link would
  // be the wrong door: this link only confirms that the address belongs to the guest (EM-013).
  public async sendAccountActivationEmail(_activationLink: string): Promise<boolean> {
    return this.sendConfirmAddressEmail()
  }

  public storeUserRegisterEvent(): Promise<void> {
    const userId = this.userId
    const referrerId = this.referrerId
    if (!userId) {
      throw new Error('Missing user id')
    }
    if (!referrerId) {
      throw new Error('Missing referrer id')
    }

    return dbInsertEvent({
      type: EventType.USER_REGISTER_GUARANTOR,
      affectedUserId: userId,
      actingUserId: referrerId,
    })
  }

  public async afterRun(user: DbUser): Promise<void> {
    return this.storePassword(user, this.user.password)
  }
}
