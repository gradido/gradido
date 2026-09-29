import { dbFindLocalUserByAlias, dbInsertEvent, EventType, UserInsert } from 'database'
import { parseOrThrowFirstIssue } from 'shared'
import { CreateUser, ReferrerRegistration, referrerRegistrationSchema } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'

export class RegisterUserReferrerRole extends RegisterUserRole<ReferrerRegistration> {
  protected referrerId: number | null = null

  constructor(createUserInput: CreateUser) {
    super(parseOrThrowFirstIssue(referrerRegistrationSchema, createUserInput))
  }

  public async prepareUser(): Promise<UserInsert> {
    const [dbUser, referrer] = await Promise.all([
      super.prepareUser(),
      dbFindLocalUserByAlias(this.user.referrerAlias),
    ])
    if (referrer) {
      dbUser.referrerId = referrer.id
      this.referrerId = referrer.id
    }
    return dbUser
  }

  public storeUserRegisterEvent(): Promise<void> {
    const userId = this.userId
    const referrerId = this.referrerId
    if (!userId) {
      throw new Error('Missing user id')
    }

    return dbInsertEvent({
      type: EventType.USER_REGISTER,
      affectedUserId: userId,
      actingUserId: referrerId ?? userId,
    })
  }
}
