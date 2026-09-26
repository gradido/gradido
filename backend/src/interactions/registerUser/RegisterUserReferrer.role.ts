import { dbFindLocalUserByAlias, dbInsertEvent, EventType, UserInsert } from 'database'
import { CreateUser } from './createUser.schema'
import { RegisterUserRole } from './RegisterUser.role'

export class RegisterUserReferrerRole extends RegisterUserRole {
  protected referrerAlias: string
  protected referrerId: number | null = null

  constructor(user: CreateUser) {
    super(user)
    if (!user.referrerAlias) {
      throw new Error('Missing referrer alias')
    }
    this.referrerAlias = user.referrerAlias
  }

  public async prepareUser(): Promise<UserInsert> {
    const [dbUser, referrer] = await Promise.all([
      super.prepareUser(),
      dbFindLocalUserByAlias(this.referrerAlias),
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
    if (!referrerId) {
      throw new Error('Missing referrer id')
    }

    return dbInsertEvent({
      type: EventType.USER_REGISTER,
      affectedUserId: userId,
      actingUserId: referrerId,
    })
  }
}
