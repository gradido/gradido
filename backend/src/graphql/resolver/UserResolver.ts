import fs from 'fs'
import { backendLogger as logger } from '@/server/logger'
import { Context, getUser } from '@/server/context'
import { Resolver, Query, Args, Arg, Authorized, Ctx, UseMiddleware, Mutation } from 'type-graphql'
import { getConnection, getCustomRepository, IsNull, Not } from '@dbTools/typeorm'
import CONFIG from '@/config'
import { User } from '@model/User'
import { User as DbUser } from '@entity/User'
import { UserContact as DbUserContact } from '@entity/UserContact'
import { communityDbUser } from '@/util/communityUser'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { ContributionLink as dbContributionLink } from '@entity/ContributionLink'
import { encode } from '@/auth/JWT'
import CreateUserArgs from '@arg/CreateUserArgs'
import UnsecureLoginArgs from '@arg/UnsecureLoginArgs'
import UpdateUserInfosArgs from '@arg/UpdateUserInfosArgs'
import { klicktippNewsletterStateMiddleware } from '@/middleware/klicktippMiddleware'
import { OptInType } from '@enum/OptInType'
import { sendResetPasswordEmail as sendResetPasswordEmailMailer } from '@/mailer/sendResetPasswordEmail'
import { sendAccountActivationEmail } from '@/mailer/sendAccountActivationEmail'
import { sendAccountMultiRegistrationEmail } from '@/mailer/sendAccountMultiRegistrationEmail'
import { klicktippSignIn } from '@/apis/KlicktippController'
import { RIGHTS } from '@/auth/RIGHTS'
import { hasElopageBuys } from '@/util/hasElopageBuys'
import { eventProtocol } from '@/event/EventProtocolEmitter'
import {
  Event,
  EventLogin,
  EventRedeemRegister,
  EventRegister,
  EventSendAccountMultiRegistrationEmail,
  EventSendConfirmationEmail,
} from '@/event/Event'
import { getUserCreation } from './util/creations'
import { UserContactType } from '../enum/UserContactType'
import { UserRepository } from '@/typeorm/repository/User'
import { SearchAdminUsersResult } from '@model/AdminUser'
import Paginated from '@arg/Paginated'
import { Order } from '@enum/Order'
import { v4 as uuidv4 } from 'uuid'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const random = require('random-bigint')

// We will reuse this for changePassword
const isPassword = (password: string): boolean => {
  return !!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 \\t\\n\\r]).{8,}$/)
}

const LANGUAGES = ['de', 'en', 'es', 'fr', 'nl']
const DEFAULT_LANGUAGE = 'de'
const isLanguage = (language: string): boolean => {
  return LANGUAGES.includes(language)
}

const PHRASE_WORD_COUNT = 24
const WORDS = fs
  .readFileSync('src/config/mnemonic.uncompressed_buffer13116.txt')
  .toString()
  .split(',')
const PassphraseGenerate = (): string[] => {
  logger.trace('PassphraseGenerate...')
  const result = []
  for (let i = 0; i < PHRASE_WORD_COUNT; i++) {
    result.push(WORDS[sodium.randombytes_random() % 2048])
  }
  return result
}

const KeyPairEd25519Create = (passphrase: string[]): Buffer[] => {
  logger.trace('KeyPairEd25519Create...')
  if (!passphrase.length || passphrase.length < PHRASE_WORD_COUNT) {
    logger.error('passphrase empty or to short')
    throw new Error('passphrase empty or to short')
  }

  const state = Buffer.alloc(sodium.crypto_hash_sha512_STATEBYTES)
  sodium.crypto_hash_sha512_init(state)

  // To prevent breaking existing passphrase-hash combinations word indices will be put into 64 Bit Variable to mimic first implementation of algorithms
  for (let i = 0; i < PHRASE_WORD_COUNT; i++) {
    const value = Buffer.alloc(8)
    const wordIndex = WORDS.indexOf(passphrase[i])
    value.writeBigInt64LE(BigInt(wordIndex))
    sodium.crypto_hash_sha512_update(state, value)
  }
  // trailing space is part of the login_server implementation
  const clearPassphrase = passphrase.join(' ') + ' '
  sodium.crypto_hash_sha512_update(state, Buffer.from(clearPassphrase))
  const outputHashBuffer = Buffer.alloc(sodium.crypto_hash_sha512_BYTES)
  sodium.crypto_hash_sha512_final(state, outputHashBuffer)

  const pubKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
  const privKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)

  sodium.crypto_sign_seed_keypair(
    pubKey,
    privKey,
    outputHashBuffer.slice(0, sodium.crypto_sign_SEEDBYTES),
  )
  logger.debug(`KeyPair creation ready. pubKey=${pubKey}`)

  return [pubKey, privKey]
}

const SecretKeyCryptographyCreateKey = (salt: string, password: string): Buffer[] => {
  logger.trace('SecretKeyCryptographyCreateKey...')
  const configLoginAppSecret = Buffer.from(CONFIG.LOGIN_APP_SECRET, 'hex')
  const configLoginServerKey = Buffer.from(CONFIG.LOGIN_SERVER_KEY, 'hex')
  if (configLoginServerKey.length !== sodium.crypto_shorthash_KEYBYTES) {
    logger.error(
      `ServerKey has an invalid size. The size must be ${sodium.crypto_shorthash_KEYBYTES} bytes.`,
    )
    throw new Error(
      `ServerKey has an invalid size. The size must be ${sodium.crypto_shorthash_KEYBYTES} bytes.`,
    )
  }

  const state = Buffer.alloc(sodium.crypto_hash_sha512_STATEBYTES)
  sodium.crypto_hash_sha512_init(state)
  sodium.crypto_hash_sha512_update(state, Buffer.from(salt))
  sodium.crypto_hash_sha512_update(state, configLoginAppSecret)
  const hash = Buffer.alloc(sodium.crypto_hash_sha512_BYTES)
  sodium.crypto_hash_sha512_final(state, hash)

  const encryptionKey = Buffer.alloc(sodium.crypto_box_SEEDBYTES)
  const opsLimit = 10
  const memLimit = 33554432
  const algo = 2
  sodium.crypto_pwhash(
    encryptionKey,
    Buffer.from(password),
    hash.slice(0, sodium.crypto_pwhash_SALTBYTES),
    opsLimit,
    memLimit,
    algo,
  )

  const encryptionKeyHash = Buffer.alloc(sodium.crypto_shorthash_BYTES)
  sodium.crypto_shorthash(encryptionKeyHash, encryptionKey, configLoginServerKey)

  logger.debug(
    `SecretKeyCryptographyCreateKey...successful: encryptionKeyHash= ${encryptionKeyHash}, encryptionKey= ${encryptionKey}`,
  )
  return [encryptionKeyHash, encryptionKey]
}

/*
const getEmailHash = (email: string): Buffer => {
  logger.trace('getEmailHash...')
  const emailHash = Buffer.alloc(sodium.crypto_generichash_BYTES)
  sodium.crypto_generichash(emailHash, Buffer.from(email))
  logger.debug(`getEmailHash...successful: ${emailHash}`)
  return emailHash
}
*/

const SecretKeyCryptographyEncrypt = (message: Buffer, encryptionKey: Buffer): Buffer => {
  logger.trace('SecretKeyCryptographyEncrypt...')
  const encrypted = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES)
  const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
  nonce.fill(31) // static nonce

  sodium.crypto_secretbox_easy(encrypted, message, nonce, encryptionKey)
  logger.debug(`SecretKeyCryptographyEncrypt...successful: ${encrypted}`)
  return encrypted
}

const SecretKeyCryptographyDecrypt = (encryptedMessage: Buffer, encryptionKey: Buffer): Buffer => {
  logger.trace('SecretKeyCryptographyDecrypt...')
  const message = Buffer.alloc(encryptedMessage.length - sodium.crypto_secretbox_MACBYTES)
  const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
  nonce.fill(31) // static nonce

  sodium.crypto_secretbox_open_easy(message, encryptedMessage, nonce, encryptionKey)

  logger.debug(`SecretKeyCryptographyDecrypt...successful: ${message}`)
  return message
}

const newEmailContact = (email: string, userId: number): DbUserContact => {
  logger.trace(`newEmailContact...`)
  const emailContact = new DbUserContact()
  emailContact.email = email
  emailContact.userId = userId
  emailContact.type = UserContactType.USER_CONTACT_EMAIL
  emailContact.emailChecked = false
  emailContact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
  emailContact.emailVerificationCode = random(64)
  logger.debug(`newEmailContact...successful: ${emailContact}`)
  return emailContact
}
/*
const newEmailOptIn = (userId: number): LoginEmailOptIn => {
  logger.trace('newEmailOptIn...')
  const emailOptIn = new LoginEmailOptIn()
  emailOptIn.verificationCode = random(64)
  emailOptIn.userId = userId
  emailOptIn.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
  logger.debug(`newEmailOptIn...successful: ${emailOptIn}`)
  return emailOptIn
}
*/
/*
// needed by AdminResolver
// checks if given code exists and can be resent
// if optIn does not exits, it is created
export const checkOptInCode = async (
  optInCode: LoginEmailOptIn | undefined,
  user: DbUser,
  optInType: OptInType = OptInType.EMAIL_OPT_IN_REGISTER,
): Promise<LoginEmailOptIn> => {
  logger.info(`checkOptInCode... ${optInCode}`)
  if (optInCode) {
    if (!canResendOptIn(optInCode)) {
      logger.error(
        `email already sent less than ${printTimeDuration(
          CONFIG.EMAIL_CODE_REQUEST_TIME,
        )} minutes ago`,
      )
      throw new Error(
        `email already sent less than ${printTimeDuration(
          CONFIG.EMAIL_CODE_REQUEST_TIME,
        )} minutes ago`,
      )
    }
    optInCode.updatedAt = new Date()
    optInCode.resendCount++
  } else {
    logger.trace('create new OptIn for userId=' + user.id)
    optInCode = newEmailOptIn(user.id)
  }

  if (user.emailChecked) {
    optInCode.emailOptInTypeId = optInType
  }
  await LoginEmailOptIn.save(optInCode).catch(() => {
    logger.error('Unable to save optin code= ' + optInCode)
    throw new Error('Unable to save optin code.')
  })
  logger.debug(`checkOptInCode...successful: ${optInCode} for userid=${user.id}`)
  return optInCode
}
*/
export const checkEmailVerificationCode = async (
  emailContact: DbUserContact,
  optInType: OptInType = OptInType.EMAIL_OPT_IN_REGISTER,
): Promise<DbUserContact> => {
  logger.info(`checkEmailVerificationCode... ${emailContact}`)
  if (emailContact.updatedAt) {
    if (!canEmailResend(emailContact.updatedAt)) {
      logger.error(
        `email already sent less than ${printTimeDuration(
          CONFIG.EMAIL_CODE_REQUEST_TIME,
        )} minutes ago`,
      )
      throw new Error(
        `email already sent less than ${printTimeDuration(
          CONFIG.EMAIL_CODE_REQUEST_TIME,
        )} minutes ago`,
      )
    }
    emailContact.updatedAt = new Date()
    emailContact.emailResendCount++
  } else {
    logger.trace('create new EmailVerificationCode for userId=' + emailContact.userId)
    emailContact.emailChecked = false
    emailContact.emailVerificationCode = random(64)
  }
  emailContact.emailOptInTypeId = optInType
  await DbUserContact.save(emailContact).catch(() => {
    logger.error('Unable to save email verification code= ' + emailContact)
    throw new Error('Unable to save email verification code.')
  })
  logger.debug(`checkEmailVerificationCode...successful: ${emailContact}`)
  return emailContact
}

export const activationLink = (verificationCode: BigInt): string => {
  logger.debug(`activationLink(${verificationCode})...`)
  return CONFIG.EMAIL_LINK_SETPASSWORD.replace(/{optin}/g, verificationCode.toString())
}

const newGradidoID = async (): Promise<string> => {
  let gradidoId: string
  let countIds: number
  do {
    gradidoId = uuidv4()
    countIds = await DbUser.count({ where: { gradidoID: gradidoId } })
    if (countIds > 0) {
      logger.info('Gradido-ID creation conflict...')
    }
  } while (countIds > 0)
  return gradidoId
}

@Resolver()
export class UserResolver {
  @Authorized([RIGHTS.VERIFY_LOGIN])
  @Query(() => User)
  @UseMiddleware(klicktippNewsletterStateMiddleware)
  async verifyLogin(@Ctx() context: Context): Promise<User> {
    logger.info('verifyLogin...')
    // TODO refactor and do not have duplicate code with login(see below)
    const userEntity = getUser(context)
    const user = new User(userEntity, await getUserCreation(userEntity.id))
    // user.pubkey = userEntity.pubKey.toString('hex')
    // Elopage Status & Stored PublisherId
    user.hasElopage = await this.hasElopage(context)

    logger.debug(`verifyLogin... successful: ${user.firstName}.${user.lastName}, ${user.email}`)
    return user
  }

  @Authorized([RIGHTS.LOGIN])
  @Query(() => User)
  @UseMiddleware(klicktippNewsletterStateMiddleware)
  async login(
    @Args() { email, password, publisherId }: UnsecureLoginArgs,
    @Ctx() context: Context,
  ): Promise<User> {
    logger.info(`login with ${email}, ***, ${publisherId} ...`)
    email = email.trim().toLowerCase()
    const dbUser = await findUserByEmail(email)
    if (dbUser.deletedAt) {
      logger.error('The User was permanently deleted in database.')
      throw new Error('This user was permanently deleted. Contact support for questions.')
    }
    if (!dbUser.emailContact.emailChecked) {
      logger.error('The Users email is not validate yet.')
      throw new Error('User email not validated')
    }
    if (dbUser.password === BigInt(0)) {
      logger.error('The User has not set a password yet.')
      // TODO we want to catch this on the frontend and ask the user to check his emails or resend code
      throw new Error('User has no password set yet')
    }
    if (!dbUser.pubKey || !dbUser.privKey) {
      logger.error('The User has no private or publicKey.')
      // TODO we want to catch this on the frontend and ask the user to check his emails or resend code
      throw new Error('User has no private or publicKey')
    }
    const passwordHash = SecretKeyCryptographyCreateKey(email, password) // return short and long hash
    const loginUserPassword = BigInt(dbUser.password.toString())
    if (loginUserPassword !== passwordHash[0].readBigUInt64LE()) {
      logger.error('The User has no valid credentials.')
      throw new Error('No user with this credentials')
    }
    // add pubKey in logger-context for layout-pattern X{user} to print it in each logging message
    logger.addContext('user', dbUser.id)
    logger.debug('login credentials valid...')

    const user = new User(dbUser, await getUserCreation(dbUser.id))
    logger.debug(`user= ${JSON.stringify(user, null, 2)}`)

    // Elopage Status & Stored PublisherId
    user.hasElopage = await this.hasElopage({ ...context, user: dbUser })
    logger.info('user.hasElopage=' + user.hasElopage)
    if (!user.hasElopage && publisherId) {
      user.publisherId = publisherId
      dbUser.publisherId = publisherId
      DbUser.save(dbUser)
    }

    context.setHeaders.push({
      key: 'token',
      value: encode(dbUser.pubKey),
    })
    const ev = new EventLogin()
    ev.userId = user.id
    eventProtocol.writeEvent(new Event().setEventLogin(ev))
    logger.info(`successful Login: ${JSON.stringify(user, null, 2)}`)
    return user
  }

  @Authorized([RIGHTS.LOGOUT])
  @Query(() => String)
  async logout(): Promise<boolean> {
    // TODO: We dont need this anymore, but might need this in the future in oder to invalidate a valid JWT-Token.
    // Furthermore this hook can be useful for tracking user behaviour (did he logout or not? Warn him if he didn't on next login)
    // The functionality is fully client side - the client just needs to delete his token with the current implementation.
    // we could try to force this by sending `token: null` or `token: ''` with this call. But since it bares no real security
    // we should just return true for now.
    logger.info('Logout...')
    // remove user.pubKey from logger-context to ensure a correct filter on log-messages belonging to the same user
    logger.addContext('user', 'unknown')
    return true
  }

  @Authorized([RIGHTS.CREATE_USER])
  @Mutation(() => User)
  async createUser(
    @Args()
    { email, firstName, lastName, language, publisherId, redeemCode = null }: CreateUserArgs,
  ): Promise<User> {
    logger.info(
      `createUser(email=${email}, firstName=${firstName}, lastName=${lastName}, language=${language}, publisherId=${publisherId}, redeemCode =${redeemCode})`,
    )
    // TODO: wrong default value (should be null), how does graphql work here? Is it an required field?
    // default int publisher_id = 0;
    const event = new Event()

    // Validate Language (no throw)
    if (!language || !isLanguage(language)) {
      language = DEFAULT_LANGUAGE
    }

    // check if user with email still exists?
    email = email.trim().toLowerCase()
    if (await checkEmailExists(email)) {
      const foundUser = await findUserByEmail(email)
      logger.info(`DbUser.findOne(email=${email}) = ${foundUser}`)

      if (foundUser) {
        // ATTENTION: this logger-message will be exactly expected during tests
        logger.info(`User already exists with this email=${email}`)
        // TODO: this is unsecure, but the current implementation of the login server. This way it can be queried if the user with given EMail is existent.

        const user = new User(communityDbUser)
        user.id = sodium.randombytes_random() % (2048 * 16) // TODO: for a better faking derive id from email so that it will be always the same id when the same email comes in?
        user.gradidoID = uuidv4()
        user.email = email
        user.firstName = firstName
        user.lastName = lastName
        user.language = language
        user.publisherId = publisherId
        logger.debug('partly faked user=' + user)

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const emailSent = await sendAccountMultiRegistrationEmail({
          firstName,
          lastName,
          email,
        })
        const eventSendAccountMultiRegistrationEmail = new EventSendAccountMultiRegistrationEmail()
        eventSendAccountMultiRegistrationEmail.userId = foundUser.id
        eventProtocol.writeEvent(
          event.setEventSendConfirmationEmail(eventSendAccountMultiRegistrationEmail),
        )
        logger.info(`sendAccountMultiRegistrationEmail of ${firstName}.${lastName} to ${email}`)
        /* uncomment this, when you need the activation link on the console */
        // In case EMails are disabled log the activation link for the user
        if (!emailSent) {
          logger.debug(`Email not send!`)
        }
        logger.info('createUser() faked and send multi registration mail...')

        return user
      }
    }

    const passphrase = PassphraseGenerate()
    // const keyPair = KeyPairEd25519Create(passphrase) // return pub, priv Key
    // const passwordHash = SecretKeyCryptographyCreateKey(email, password) // return short and long hash
    // const encryptedPrivkey = SecretKeyCryptographyEncrypt(keyPair[1], passwordHash[1])
    // const emailHash = getEmailHash(email)
    const gradidoID = await newGradidoID()

    const eventRegister = new EventRegister()
    const eventRedeemRegister = new EventRedeemRegister()
    const eventSendConfirmEmail = new EventSendConfirmationEmail()

    let dbUser = new DbUser()
    dbUser.gradidoID = gradidoID
    dbUser.firstName = firstName
    dbUser.lastName = lastName
    dbUser.language = language
    dbUser.publisherId = publisherId
    dbUser.passphrase = passphrase.join(' ')
    logger.debug('new dbUser=' + dbUser)
    if (redeemCode) {
      if (redeemCode.match(/^CL-/)) {
        const contributionLink = await dbContributionLink.findOne({
          code: redeemCode.replace('CL-', ''),
        })
        logger.info('redeemCode found contributionLink=' + contributionLink)
        if (contributionLink) {
          dbUser.contributionLinkId = contributionLink.id
          eventRedeemRegister.contributionId = contributionLink.id
        }
      } else {
        const transactionLink = await dbTransactionLink.findOne({ code: redeemCode })
        logger.info('redeemCode found transactionLink=' + transactionLink)
        if (transactionLink) {
          dbUser.referrerId = transactionLink.userId
          eventRedeemRegister.transactionId = transactionLink.id
        }
      }
    }
    // TODO this field has no null allowed unlike the loginServer table
    // dbUser.pubKey = Buffer.from(randomBytes(32)) // Buffer.alloc(32, 0) default to 0000...
    // dbUser.pubkey = keyPair[0]
    // loginUser.password = passwordHash[0].readBigUInt64LE() // using the shorthash
    // loginUser.pubKey = keyPair[0]
    // loginUser.privKey = encryptedPrivkey

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')
    try {
      dbUser = await queryRunner.manager.save(dbUser).catch((error) => {
        logger.error('Error while saving dbUser', error)
        throw new Error('error saving user')
      })
      let emailContact = newEmailContact(email, dbUser.id)
      emailContact = await queryRunner.manager.save(emailContact).catch((error) => {
        logger.error('Error while saving emailContact', error)
        throw new Error('error saving email user contact')
      })

      dbUser.emailContact = emailContact
      dbUser.emailId = emailContact.id
      await queryRunner.manager.save(dbUser).catch((error) => {
        logger.error('Error while updating dbUser', error)
        throw new Error('error updating user')
      })

      /*
      const emailOptIn = newEmailOptIn(dbUser.id)
      await queryRunner.manager.save(emailOptIn).catch((error) => {
        logger.error('Error while saving emailOptIn', error)
        throw new Error('error saving email opt in')
      })
      */

      const activationLink = CONFIG.EMAIL_LINK_VERIFICATION.replace(
        /{optin}/g,
        emailContact.emailVerificationCode.toString(),
      ).replace(/{code}/g, redeemCode ? '/' + redeemCode : '')

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const emailSent = await sendAccountActivationEmail({
        link: activationLink,
        firstName,
        lastName,
        email,
        duration: printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME),
      })
      logger.info(`sendAccountActivationEmail of ${firstName}.${lastName} to ${email}`)
      eventSendConfirmEmail.userId = dbUser.id
      eventProtocol.writeEvent(event.setEventSendConfirmationEmail(eventSendConfirmEmail))

      if (!emailSent) {
        logger.debug(`Account confirmation link: ${activationLink}`)
      }

      await queryRunner.commitTransaction()
    } catch (e) {
      logger.error(`error during create user with ${e}`)
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
    logger.info('createUser() successful...')

    if (redeemCode) {
      eventRedeemRegister.userId = dbUser.id
      eventProtocol.writeEvent(event.setEventRedeemRegister(eventRedeemRegister))
    } else {
      eventRegister.userId = dbUser.id
      eventProtocol.writeEvent(event.setEventRegister(eventRegister))
    }

    return new User(dbUser)
  }

  @Authorized([RIGHTS.SEND_RESET_PASSWORD_EMAIL])
  @Mutation(() => Boolean)
  async forgotPassword(@Arg('email') email: string): Promise<boolean> {
    logger.info(`forgotPassword(${email})...`)
    email = email.trim().toLowerCase()
    const user = await findUserByEmail(email).catch(() => {
      logger.warn(`fail on find UserContact per ${email}`)
    })
    if (!user) {
      logger.warn(`no user found with ${email}`)
      return true
    }

    // can be both types: REGISTER and RESET_PASSWORD
    // let optInCode = await LoginEmailOptIn.findOne({
    //  userId: user.id,
    // })
    // let optInCode = user.emailContact.emailVerificationCode
    const dbUserContact = await checkEmailVerificationCode(
      user.emailContact,
      OptInType.EMAIL_OPT_IN_RESET_PASSWORD,
    )

    // optInCode = await checkOptInCode(optInCode, user, OptInType.EMAIL_OPT_IN_RESET_PASSWORD)
    logger.info(`optInCode for ${email}=${dbUserContact}`)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const emailSent = await sendResetPasswordEmailMailer({
      link: activationLink(dbUserContact.emailVerificationCode),
      firstName: user.firstName,
      lastName: user.lastName,
      email,
      duration: printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME),
    })

    /*  uncomment this, when you need the activation link on the console */
    // In case EMails are disabled log the activation link for the user
    if (!emailSent) {
      logger.debug(`Reset password link: ${activationLink(dbUserContact.emailVerificationCode)}`)
    }
    logger.info(`forgotPassword(${email}) successful...`)

    return true
  }

  @Authorized([RIGHTS.SET_PASSWORD])
  @Mutation(() => Boolean)
  async setPassword(
    @Arg('code') code: string,
    @Arg('password') password: string,
  ): Promise<boolean> {
    logger.info(`setPassword(${code}, ***)...`)
    // Validate Password
    if (!isPassword(password)) {
      throw new Error(
        'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
      )
    }

    // Load code
    /*
    const optInCode = await LoginEmailOptIn.findOneOrFail({ verificationCode: code }).catch(() => {
      logger.error('Could not login with emailVerificationCode')
      throw new Error('Could not login with emailVerificationCode')
    })
    */
    const userContact = await DbUserContact.findOneOrFail(
      { emailVerificationCode: code },
      { relations: ['user'] },
    ).catch(() => {
      logger.error('Could not login with emailVerificationCode')
      throw new Error('Could not login with emailVerificationCode')
    })
    logger.debug('userContact loaded...')
    // Code is only valid for `CONFIG.EMAIL_CODE_VALID_TIME` minutes
    if (!isEmailVerificationCodeValid(userContact.updatedAt)) {
      logger.error(
        `email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
      throw new Error(
        `email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
    }
    logger.debug('EmailVerificationCode is valid...')

    // load user
    const user = userContact.user
    logger.debug('user with EmailVerificationCode found...')

    // Generate Passphrase if needed
    if (!user.passphrase) {
      const passphrase = PassphraseGenerate()
      user.passphrase = passphrase.join(' ')
      logger.debug('new Passphrase generated...')
    }

    const passphrase = user.passphrase.split(' ')
    if (passphrase.length < PHRASE_WORD_COUNT) {
      logger.error('Could not load a correct passphrase')
      // TODO if this can happen we cannot recover from that
      // this seem to be good on production data, if we dont
      // make a coding mistake we do not have a problem here
      throw new Error('Could not load a correct passphrase')
    }
    logger.debug('Passphrase is valid...')

    // Activate EMail
    userContact.emailChecked = true

    // Update Password
    const passwordHash = SecretKeyCryptographyCreateKey(userContact.email, password) // return short and long hash
    const keyPair = KeyPairEd25519Create(passphrase) // return pub, priv Key
    const encryptedPrivkey = SecretKeyCryptographyEncrypt(keyPair[1], passwordHash[1])
    user.password = passwordHash[0].readBigUInt64LE() // using the shorthash
    user.pubKey = keyPair[0]
    user.privKey = encryptedPrivkey
    logger.debug('User credentials updated ...')

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')

    try {
      // Save user
      await queryRunner.manager.save(user).catch((error) => {
        logger.error('error saving user: ' + error)
        throw new Error('error saving user: ' + error)
      })
      // Save userContact
      await queryRunner.manager.save(userContact).catch((error) => {
        logger.error('error saving userContact: ' + error)
        throw new Error('error saving userContact: ' + error)
      })

      await queryRunner.commitTransaction()
      logger.info('User and UserContact data written successfully...')
    } catch (e) {
      await queryRunner.rollbackTransaction()
      logger.error('Error on writing User and UserContact data:' + e)
      throw e
    } finally {
      await queryRunner.release()
    }

    // Sign into Klicktipp
    // TODO do we always signUp the user? How to handle things with old users?
    if (userContact.emailOptInTypeId === OptInType.EMAIL_OPT_IN_REGISTER) {
      try {
        await klicktippSignIn(userContact.email, user.language, user.firstName, user.lastName)
        logger.debug(
          `klicktippSignIn(${userContact.email}, ${user.language}, ${user.firstName}, ${user.lastName})`,
        )
      } catch (e) {
        logger.error('Error subscribe to klicktipp:' + e)
        // TODO is this a problem?
        // eslint-disable-next-line no-console
        /*  uncomment this, when you need the activation link on the console
        console.log('Could not subscribe to klicktipp')
        */
      }
    }

    return true
  }

  @Authorized([RIGHTS.QUERY_OPT_IN])
  @Query(() => Boolean)
  async queryOptIn(@Arg('optIn') optIn: string): Promise<boolean> {
    logger.info(`queryOptIn(${optIn})...`)
    const userContact = await DbUserContact.findOneOrFail({ emailVerificationCode: optIn })
    logger.debug(`found optInCode=${userContact}`)
    // Code is only valid for `CONFIG.EMAIL_CODE_VALID_TIME` minutes
    if (!isEmailVerificationCodeValid(userContact.updatedAt)) {
      logger.error(
        `email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
      throw new Error(
        `email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
    }
    logger.info(`queryOptIn(${optIn}) successful...`)
    return true
  }

  @Authorized([RIGHTS.UPDATE_USER_INFOS])
  @Mutation(() => Boolean)
  async updateUserInfos(
    @Args()
    { firstName, lastName, language, password, passwordNew }: UpdateUserInfosArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    logger.info(`updateUserInfos(${firstName}, ${lastName}, ${language}, ***, ***)...`)
    const userEntity = getUser(context)

    if (firstName) {
      userEntity.firstName = firstName
    }

    if (lastName) {
      userEntity.lastName = lastName
    }

    if (language) {
      if (!isLanguage(language)) {
        logger.error(`"${language}" isn't a valid language`)
        throw new Error(`"${language}" isn't a valid language`)
      }
      userEntity.language = language
    }

    if (password && passwordNew) {
      // Validate Password
      if (!isPassword(passwordNew)) {
        logger.error('newPassword does not fullfil the rules')
        throw new Error(
          'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
        )
      }

      // TODO: This had some error cases defined - like missing private key. This is no longer checked.
      const oldPasswordHash = SecretKeyCryptographyCreateKey(
        userEntity.emailContact.email,
        password,
      )
      if (BigInt(userEntity.password.toString()) !== oldPasswordHash[0].readBigUInt64LE()) {
        logger.error(`Old password is invalid`)
        throw new Error(`Old password is invalid`)
      }

      const privKey = SecretKeyCryptographyDecrypt(userEntity.privKey, oldPasswordHash[1])
      logger.debug('oldPassword decrypted...')
      const newPasswordHash = SecretKeyCryptographyCreateKey(
        userEntity.emailContact.email,
        passwordNew,
      ) // return short and long hash
      logger.debug('newPasswordHash created...')
      const encryptedPrivkey = SecretKeyCryptographyEncrypt(privKey, newPasswordHash[1])
      logger.debug('PrivateKey encrypted...')

      // Save new password hash and newly encrypted private key
      userEntity.password = newPasswordHash[0].readBigUInt64LE()
      userEntity.privKey = encryptedPrivkey
    }

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')

    try {
      await queryRunner.manager.save(userEntity).catch((error) => {
        throw new Error('error saving user: ' + error)
      })

      await queryRunner.commitTransaction()
      logger.debug('writing User data successful...')
    } catch (e) {
      await queryRunner.rollbackTransaction()
      logger.error(`error on writing updated user data: ${e}`)
      throw e
    } finally {
      await queryRunner.release()
    }
    logger.info('updateUserInfos() successfully finished...')
    return true
  }

  @Authorized([RIGHTS.HAS_ELOPAGE])
  @Query(() => Boolean)
  async hasElopage(@Ctx() context: Context): Promise<boolean> {
    logger.info(`hasElopage()...`)
    const userEntity = getUser(context)
    const elopageBuys = hasElopageBuys(userEntity.emailContact.email)
    logger.debug(`has ElopageBuys = ${elopageBuys}`)
    return elopageBuys
  }

  @Authorized([RIGHTS.SEARCH_ADMIN_USERS])
  @Query(() => SearchAdminUsersResult)
  async searchAdminUsers(
    @Args()
    { currentPage = 1, pageSize = 25, order = Order.DESC }: Paginated,
  ): Promise<SearchAdminUsersResult> {
    const userRepository = getCustomRepository(UserRepository)

    const [users, count] = await userRepository.findAndCount({
      where: {
        isAdmin: Not(IsNull()),
      },
      order: {
        createdAt: order,
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    })

    return {
      userCount: count,
      userList: users.map((user) => {
        return {
          firstName: user.firstName,
          lastName: user.lastName,
        }
      }),
    }
  }
}

export async function findUserByEmail(email: string): Promise<DbUser> {
  const dbUserContact = await DbUserContact.findOneOrFail(
    { email: email },
    { withDeleted: true, relations: ['user'] },
  ).catch(() => {
    logger.error(`UserContact with email=${email} does not exists`)
    throw new Error('No user with this credentials')
  })
  const dbUser = dbUserContact.user
  dbUser.emailContact = dbUserContact
  return dbUser
}

async function checkEmailExists(email: string): Promise<boolean> {
  const userContact = await DbUserContact.findOne({ email: email }, { withDeleted: true })
  if (userContact) {
    return true
  }
  return false
}

/*
const isTimeExpired = (optIn: LoginEmailOptIn, duration: number): boolean => {
  const timeElapsed = Date.now() - new Date(optIn.updatedAt).getTime()
  // time is given in minutes
  return timeElapsed <= duration * 60 * 1000
}
*/
const isTimeExpired = (updatedAt: Date, duration: number): boolean => {
  const timeElapsed = Date.now() - new Date(updatedAt).getTime()
  // time is given in minutes
  return timeElapsed <= duration * 60 * 1000
}
/*
const isOptInValid = (optIn: LoginEmailOptIn): boolean => {
  return isTimeExpired(optIn, CONFIG.EMAIL_CODE_VALID_TIME)
}
*/
const isEmailVerificationCodeValid = (updatedAt: Date | null): boolean => {
  if (updatedAt == null) {
    return true
  }
  return isTimeExpired(updatedAt, CONFIG.EMAIL_CODE_VALID_TIME)
}
/*
const canResendOptIn = (optIn: LoginEmailOptIn): boolean => {
  return !isTimeExpired(optIn, CONFIG.EMAIL_CODE_REQUEST_TIME)
}
*/
const canEmailResend = (updatedAt: Date): boolean => {
  return !isTimeExpired(updatedAt, CONFIG.EMAIL_CODE_REQUEST_TIME)
}

const getTimeDurationObject = (time: number): { hours?: number; minutes: number } => {
  if (time > 60) {
    return {
      hours: Math.floor(time / 60),
      minutes: time % 60,
    }
  }
  return { minutes: time }
}

export const printTimeDuration = (duration: number): string => {
  const time = getTimeDurationObject(duration)
  const result = time.minutes > 0 ? `${time.minutes} minutes` : ''
  if (time.hours) return `${time.hours} hours` + (result !== '' ? ` and ${result}` : '')
  return result
}
