import { sendAccountMultiRegistrationEmail } from 'core'
import { dbInsertEvent, EventType, UserSelect
} from 'database'
import { Logger } from 'log4js'
import { randombytes_random } from 'sodium-native'
import { CreateUser } from './createUser.schema'
import { AbstractRegisterUserRole } from './AbstractRegisterUser.role'

export class RegisterUserExistRole extends AbstractRegisterUserRole {
  private firstName: string
  private lastName: string

  constructor(
    user: CreateUser,
    protected existingUser: UserSelect,
  ) {
    super(user)
    if (!existingUser.firstName || !existingUser.lastName) {
      throw new Error('Missing first and/or last name for existing local user')
    }
    this.firstName = existingUser.firstName
    this.lastName = existingUser.lastName
  }

  public async run(logger: Logger): Promise<number> {
    logger.addContext('user', this.existingUser.id)
    logger.removeContext('email')
    // ATTENTION: this logger-message will be exactly expected during tests, next line
    logger.info(`User already exists`)

    await sendAccountMultiRegistrationEmail({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.user.email,
      language: this.existingUser.language, // use language of the emails owner for sending
    })
    await dbInsertEvent({
      type: EventType.EMAIL_ACCOUNT_MULTIREGISTRATION,
      affectedUserId: this.existingUser.id,
      actingUserId: 0,
    })
    let fakeUserId = 0
    while(!fakeUserId) { fakeUserId = randombytes_random() % (2048 * 16) + 1 }
    return fakeUserId
  }
}
