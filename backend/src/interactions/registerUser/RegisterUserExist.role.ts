import { sendAccountMultiRegistrationEmail } from 'core'
import { dbInsertEvent, UserSelect } from 'database'
import { Logger } from 'log4js'
import { randombytes_random } from 'sodium-native'
import { EventType } from '@/event/EventType'
import { AbstractRegisterUserRole } from './AbstractRegisterUser.role'
import { CreateUser } from './createUser.schema'

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
    // TODO: for a better faking derive id from email so that it will be always the same id when the same email comes in?
    // TODO: return only boolean to the frontend
    return randombytes_random() % (2048 * 16)
  }
}
