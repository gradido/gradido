// AI-GENERATED — not an architecture reference
import { OptInType } from '@enum/OptInType'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { sendAssistedRegistrationConfirmEmail } from 'core'
import {
  User as DbUser,
  dbFindRegisterUserContactByCodeOrFail,
  dbInsertEvent,
  EventType,
} from 'database'
import { getLogger } from 'log4js'
import random from 'random-bigint'
import { Arg, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import { subscribe } from '@/apis/KlicktippController'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { canEmailResend, isEmailVerificationCodeValid } from '@/data/EmailVerificationCode.logic'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { getTimeDurationObject, printTimeDuration } from '@/util/time'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.AssistedRegistrationResolver.${method}`)

/**
 * The guest's half of an assisted registration (EM-013): an account that holds a password
 * while its address is still unconfirmed. Such an account is opened at the table - a guest
 * who scanned a member's live card chooses the password in the registration form
 * (`createUser` with a presence code) - and it confirms its address here:
 *
 *   confirmEmail                    the guest's mail link: confirm-only, no password
 *   resendConfirmationEmail         the reminder modal's way out, next to "correct
 *                                   the address" (which is the normal e-mail change)
 *
 * The doorbell entry that used to open these accounts from a member's multi-registration
 * mail is gone; migration 0143 drops the table it parked its attempts in.
 */
@Resolver()
export class AssistedRegistrationResolver {
  /**
   * The guest's mail link. Confirm-only — it neither sets a password (setPassword does
   * that for classic registrations) nor logs anybody in, and it answers to REGISTER
   * rows of accounts that already hold a password: exactly the assisted population.
   * Letting it confirm password-less rows would create accounts that can never log in.
   */
  @Authorized([RIGHTS.CONFIRM_EMAIL])
  @Mutation(() => Boolean)
  async confirmEmail(@Arg('code') code: string): Promise<boolean> {
    const logger = createLogger('confirmEmail')
    logger.info('confirmEmail...')
    const userContact = await dbFindRegisterUserContactByCodeOrFail(code).catch(() => {
      logger.warn('invalid emailVerificationCode')
      throw new Error('Could not confirm with this code')
    })
    // Same trap as in `setPassword`: `UserContact.user` is the inverse of `users.email_id`
    // and is empty for a row that is no longer the member's address. The REGISTER filter
    // above does not catch it - a settled row carries REGISTER again - so the activation
    // link from an address the member has since left would arrive here and be dereferenced.
    if (!userContact.user) {
      logger.warn(`emailVerificationCode belongs to a former address, contact=${userContact.id}`)
      throw new Error('Could not confirm with this code')
    }
    logger.addContext('user', userContact.user.id)
    const user = userContact.user
    // "No password" is the encryption type, NOT `password === 0n` — the bigint column
    // arrives untyped at runtime, so that comparison never matches (the login has the
    // same rule; getUserCryptographicSalt is the pattern).
    if (user.passwordEncryptionType === PasswordEncryptionType.NO_PASSWORD) {
      logger.warn('confirmEmail refused: account holds no password (classic registration)')
      throw new LogError('Could not confirm with this code')
    }
    if (userContact.emailChecked) {
      // The second click on the same mail link — nothing left to do.
      return true
    }
    if (!isEmailVerificationCodeValid(userContact.updatedAt || userContact.createdAt)) {
      throw new LogError(
        `Email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
    }

    userContact.emailChecked = true
    await userContact.save().catch((error) => {
      throw new LogError('Error saving userContact', error)
    })

    // Sign into Klicktipp — same moment as setPassword does it for the classic path.
    try {
      await subscribe(userContact.email, user.language, user.firstName, user.lastName)
      logger.debug('Success subscribe to klicktipp')
    } catch (e) {
      logger.error('Error subscribing to klicktipp', e)
    }
    await dbInsertEvent({
      type: EventType.USER_ACTIVATE_ACCOUNT,
      affectedUserId: user.id,
      actingUserId: user.id,
    })
    logger.info('confirmEmail... successful')
    return true
  }

  /**
   * "Send the mail again" in the reminder modal. Behind MANAGE_OWN_EMAIL — the same
   * right that carries the other way out of the blockade (correcting the address), and
   * it stays granted while the account is narrowed down (see
   * RESTRICTED_WHILE_UNCONFIRMED).
   */
  @Authorized([RIGHTS.MANAGE_OWN_EMAIL])
  @Mutation(() => Boolean)
  async resendConfirmationEmail(@Ctx() context: Context): Promise<boolean> {
    const logger = createLogger('resendConfirmationEmail')
    const user = getUser(context)
    logger.addContext('user', user.id)
    logger.info('resendConfirmationEmail...')
    const contact = user.emailContact
    if (!contact || contact.emailChecked) {
      logger.warn('nothing to confirm')
      throw new LogError('Nothing to confirm for this account')
    }
    if (!canEmailResend(contact.updatedAt || contact.createdAt)) {
      throw new LogError(
        `Email already sent less than ${printTimeDuration(CONFIG.EMAIL_CODE_REQUEST_TIME)} ago`,
      )
    }
    contact.updatedAt = new Date()
    contact.emailResendCount++
    contact.emailVerificationCode = random(64).toString()
    // "Forgot password" may have flipped the row to RESET_PASSWORD (it reuses the same
    // code column). The confirm-only path answers to REGISTER rows, so the resend puts
    // the type back — the youngest mail is the one that counts, as everywhere here.
    contact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
    await contact.save().catch((error) => {
      throw new LogError('Error saving userContact', error)
    })

    const confirmLink = `${CONFIG.EMAIL_LINK_CONFIRM_EMAIL}${contact.emailVerificationCode.toString()}`
    await sendAssistedRegistrationConfirmEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: contact.email,
      language: user.language,
      confirmLink,
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
    })
    logger.info('resendConfirmationEmail... successful')
    return true
  }
}
