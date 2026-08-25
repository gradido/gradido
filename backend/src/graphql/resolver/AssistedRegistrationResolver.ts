// AI-GENERATED — not an architecture reference
import { OptInType } from '@enum/OptInType'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { AssistedRegistrationInfo, AssistedRegistrationResult } from '@model/AssistedRegistration'
import { sendAssistedRegistrationConfirmEmail } from 'core'
import {
  AssistedRegistrationSelect,
  User as DbUser,
  UserContact as DbUserContact,
  dbDeleteAssistedRegistration,
  dbFindAssistedRegistrationByCode,
} from 'database'
import { getLogger, Logger } from 'log4js'
import random from 'random-bigint'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { subscribe } from '@/apis/KlicktippController'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { canEmailResend, isEmailVerificationCodeValid } from '@/data/EmailVerificationCode.logic'
import { EVENT_USER_ACTIVATE_ACCOUNT, EVENT_USER_REGISTER_ASSISTED } from '@/event/Events'
import { CompleteAssistedRegistrationArgs } from '@/graphql/arg/CompleteAssistedRegistrationArgs'
import { registerAccount } from '@/interactions/registerAccount/RegisterAccount.context'
import { isValidPassword } from '@/password/EncryptorUtils'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { getTimeDurationObject, printTimeDuration } from '@/util/time'
import { checkEmailExists } from './UserResolver'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.AssistedRegistrationResolver.${method}`)

/**
 * The doorbell flow of EM-013. A registration attempt that used an existing member's
 * address (and carried a redeem code) was parked; the member's mail offers "I am
 * helping someone set up a Gradido account". Behind that button:
 *
 *   assistedRegistrationInfo        shows the guest's name on the helper page
 *   completeAssistedRegistration    creates the account — with the guest's OWN address
 *                                   (unconfirmed) and the password the guest typed
 *   confirmEmail                    the guest's mail link: confirm-only, no password
 *   resendConfirmationEmail         the reminder modal's way out, next to "correct
 *                                   the address" (which is the normal e-mail change)
 *
 * The host's address never becomes an account address — it only received the one mail.
 * The host therefore never holds a key to this account: the password reset goes to the
 * guest's own address from the first second.
 */
@Resolver()
export class AssistedRegistrationResolver {
  /**
   * One neutral answer for "mistyped", "already used" and "expired" alike: the code is
   * the only thing the caller holds, and this endpoint is public — it must not become
   * an oracle over what is parked here.
   */
  private async loadValidAttempt(
    assistCode: string,
    logger: Logger,
  ): Promise<AssistedRegistrationSelect> {
    let code: bigint
    try {
      code = BigInt(assistCode)
    } catch {
      logger.warn('assist code is not a number')
      throw new LogError('Assist code invalid or expired')
    }
    const found = await dbFindAssistedRegistrationByCode(code)
    if (!found.success) {
      logger.warn('assist code unknown')
      throw new LogError('Assist code invalid or expired')
    }
    if (!isEmailVerificationCodeValid(found.value.createdAt)) {
      logger.warn('assist code expired')
      throw new LogError('Assist code invalid or expired')
    }
    return found.value
  }

  @Authorized([RIGHTS.ASSISTED_REGISTRATION_INFO])
  @Query(() => AssistedRegistrationInfo)
  async assistedRegistrationInfo(
    @Arg('assistCode') assistCode: string,
  ): Promise<AssistedRegistrationInfo> {
    const logger = createLogger('assistedRegistrationInfo')
    logger.info('assistedRegistrationInfo...')
    const row = await this.loadValidAttempt(assistCode, logger)
    return { firstName: row.firstName, lastName: row.lastName }
  }

  @Authorized([RIGHTS.COMPLETE_ASSISTED_REGISTRATION])
  @Mutation(() => AssistedRegistrationResult)
  async completeAssistedRegistration(
    @Args() { assistCode, email, password }: CompleteAssistedRegistrationArgs,
  ): Promise<AssistedRegistrationResult> {
    const logger = createLogger('completeAssistedRegistration')
    logger.info('completeAssistedRegistration...')
    const row = await this.loadValidAttempt(assistCode, logger)

    if (!isValidPassword(password)) {
      throw new LogError(
        'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
      )
    }
    const guestEmail = email.trim().toLowerCase()
    // Said openly rather than silenced: the caller holds an assist code out of a
    // member's own mailbox — the same trust level at which requestEmailChange answers
    // openly. And the likeliest cause is the real one: the guest already has an
    // account and forgot; the message is what sends them to "forgot password" instead
    // of a second account.
    if (await checkEmailExists(guestEmail)) {
      logger.warn('guest address already in use')
      throw new LogError('Email address already in use')
    }

    const dbUser = await registerAccount(
      {
        email: guestEmail,
        firstName: row.firstName,
        lastName: row.lastName,
        language: row.language,
        publisherId: row.publisherId,
        redeemCode: row.redeemCode,
        project: row.project,
        alias: null,
        passwordPlain: password,
      },
      logger,
    )
    // Outside the account transaction on purpose: the attempt row is Drizzle, the
    // account is TypeORM, and nothing depends on the two being atomic — a row that
    // survives here simply expires, and its address is taken now anyway. That holds
    // for a second call with a DIFFERENT address too: registering books no money (a
    // transaction link pays once at redeem, guarded by redeemedBy; a contribution
    // link is per-user by design and its code is printed on the cheque anyway), so
    // the worst case is one extra empty account — the class any mistyped classic
    // registration leaves behind as well.
    await dbDeleteAssistedRegistration(row.id)

    // Only the id goes into the event, so no lookup: a host soft-deleted inside the
    // 24h window still keeps "who helped whom" answerable (same placeholder pattern
    // as registerAccount).
    await EVENT_USER_REGISTER_ASSISTED(dbUser, { id: row.hostUserId } as DbUser)
    logger.info('completeAssistedRegistration... successful')

    return { redeemCode: row.redeemCode }
  }

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
    const userContact = await DbUserContact.findOneOrFail({
      where: { emailVerificationCode: code, emailOptInTypeId: OptInType.EMAIL_OPT_IN_REGISTER },
      relations: ['user'],
    }).catch(() => {
      logger.warn('invalid emailVerificationCode')
      throw new Error('Could not confirm with this code')
    })
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
    await EVENT_USER_ACTIVATE_ACCOUNT(user)
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
