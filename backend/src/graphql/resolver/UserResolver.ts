import fs from 'fs'
import log4js from '@/server/logger'

import { Context, getUser } from '@/server/context'
import { Resolver, Query, Args, Arg, Authorized, Ctx, UseMiddleware, Mutation } from 'type-graphql'
import { getConnection, getCustomRepository } from '@dbTools/typeorm'
import CONFIG from '@/config'
import { User } from '@model/User'
import { User as DbUser } from '@entity/User'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { encode } from '@/auth/JWT'
import CreateUserArgs from '@arg/CreateUserArgs'
import UnsecureLoginArgs from '@arg/UnsecureLoginArgs'
import UpdateUserInfosArgs from '@arg/UpdateUserInfosArgs'
import { klicktippNewsletterStateMiddleware } from '@/middleware/klicktippMiddleware'
import { UserSettingRepository } from '@repository/UserSettingRepository'
import { Setting } from '@enum/Setting'
import { OptInType } from '@enum/OptInType'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'
import { sendResetPasswordEmail as sendResetPasswordEmailMailer } from '@/mailer/sendResetPasswordEmail'
import { sendAccountActivationEmail } from '@/mailer/sendAccountActivationEmail'
import { klicktippSignIn } from '@/apis/KlicktippController'
import { RIGHTS } from '@/auth/RIGHTS'
import { hasElopageBuys } from '@/util/hasElopageBuys'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const random = require('random-bigint')

const logger = log4js.getLogger('graphql.UserResolver')

// We will reuse this for changePassword
const isPassword = (password: string): boolean => {
  return !!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 \\t\\n\\r]).{8,}$/)
}

const LANGUAGES = ['de', 'en']
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

  return [pubKey, privKey]
}

const SecretKeyCryptographyCreateKey = (salt: string, password: string): Buffer[] => {
  logger.trace('SecretKeyCryptographyCreateKey...')
  const configLoginAppSecret = Buffer.from(CONFIG.LOGIN_APP_SECRET, 'hex')
  const configLoginServerKey = Buffer.from(CONFIG.LOGIN_SERVER_KEY, 'hex')
  if (configLoginServerKey.length !== sodium.crypto_shorthash_KEYBYTES) {
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

  return [encryptionKeyHash, encryptionKey]
}

const getEmailHash = (email: string): Buffer => {
  logger.trace('getEmailHash...')
  const emailHash = Buffer.alloc(sodium.crypto_generichash_BYTES)
  sodium.crypto_generichash(emailHash, Buffer.from(email))
  return emailHash
}

const SecretKeyCryptographyEncrypt = (message: Buffer, encryptionKey: Buffer): Buffer => {
  logger.trace('SecretKeyCryptographyEncrypt...')
  const encrypted = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES)
  const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
  nonce.fill(31) // static nonce

  sodium.crypto_secretbox_easy(encrypted, message, nonce, encryptionKey)
  return encrypted
}

const SecretKeyCryptographyDecrypt = (encryptedMessage: Buffer, encryptionKey: Buffer): Buffer => {
  logger.trace('SecretKeyCryptographyDecrypt...')
  const message = Buffer.alloc(encryptedMessage.length - sodium.crypto_secretbox_MACBYTES)
  const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
  nonce.fill(31) // static nonce

  sodium.crypto_secretbox_open_easy(message, encryptedMessage, nonce, encryptionKey)

  return message
}

const newEmailOptIn = (userId: number): LoginEmailOptIn => {
  logger.trace('newEmailOptIn...')
  const emailOptIn = new LoginEmailOptIn()
  emailOptIn.verificationCode = random(64)
  emailOptIn.userId = userId
  emailOptIn.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
  return emailOptIn
}

// needed by AdminResolver
// checks if given code exists and can be resent
// if optIn does not exits, it is created
export const checkOptInCode = async (
  optInCode: LoginEmailOptIn | undefined,
  userId: number,
  optInType: OptInType = OptInType.EMAIL_OPT_IN_REGISTER,
): Promise<LoginEmailOptIn> => {
  logger.trace('checkOptInCode...')
  if (optInCode) {
    if (!canResendOptIn(optInCode)) {
      throw new Error(
        `email already sent less than ${printTimeDuration(
          CONFIG.EMAIL_CODE_REQUEST_TIME,
        )} minutes ago`,
      )
    }
    optInCode.updatedAt = new Date()
    optInCode.resendCount++
  } else {
    optInCode = newEmailOptIn(userId)
  }
  optInCode.emailOptInTypeId = optInType
  await LoginEmailOptIn.save(optInCode).catch(() => {
    throw new Error('Unable to save optin code.')
  })
  return optInCode
}

export const activationLink = (optInCode: LoginEmailOptIn): string => {
  logger.trace('activationLink...')
  return CONFIG.EMAIL_LINK_SETPASSWORD.replace(/{optin}/g, optInCode.verificationCode.toString())
}

@Resolver()
export class UserResolver {
  @Authorized([RIGHTS.VERIFY_LOGIN])
  @Query(() => User)
  @UseMiddleware(klicktippNewsletterStateMiddleware)
  async verifyLogin(@Ctx() context: Context): Promise<User> {
    const logger = log4js.getLogger('graphql.UserResolver')
    logger.trace('verifyLogin...')
    // TODO refactor and do not have duplicate code with login(see below)
    const userEntity = getUser(context)
    const user = new User(userEntity)
    // user.pubkey = userEntity.pubKey.toString('hex')
    // Elopage Status & Stored PublisherId
    user.hasElopage = await this.hasElopage(context)

    // coinAnimation
    const userSettingRepository = getCustomRepository(UserSettingRepository)
    const coinanimation = await userSettingRepository
      .readBoolean(userEntity.id, Setting.COIN_ANIMATION)
      .catch((error) => {
        throw new Error(error)
      })
    user.coinanimation = coinanimation

    return user
  }

  @Authorized([RIGHTS.LOGIN])
  @Query(() => User)
  @UseMiddleware(klicktippNewsletterStateMiddleware)
  async login(
    @Args() { email, password, publisherId }: UnsecureLoginArgs,
    @Ctx() context: Context,
  ): Promise<User> {
    const logger = log4js.getLogger('graphql.UserResolver')
    logger.trace('Login(' + email + ', ***, ' + publisherId)
    email = email.trim().toLowerCase()
    const dbUser = await DbUser.findOneOrFail({ email }, { withDeleted: true }).catch(() => {
      logger.error('User does not exists with this email=' + email)
      throw new Error('No user with this credentials')
    })
    if (dbUser.deletedAt) {
      logger.error('The User was permanently deleted in database. email=' + email)
      throw new Error('This user was permanently deleted. Contact support for questions.')
    }
    if (!dbUser.emailChecked) {
      logger.error('The Users email is not validate yet. email=' + email)
      throw new Error('User email not validated')
    }
    if (dbUser.password === BigInt(0)) {
      logger.error('The User has not set a password yet. email=' + email)
      // TODO we want to catch this on the frontend and ask the user to check his emails or resend code
      throw new Error('User has no password set yet')
    }
    if (!dbUser.pubKey || !dbUser.privKey) {
      logger.error('The User has no private or publicKey. email=' + email)
      // TODO we want to catch this on the frontend and ask the user to check his emails or resend code
      throw new Error('User has no private or publicKey')
    }
    const passwordHash = SecretKeyCryptographyCreateKey(email, password) // return short and long hash
    const loginUserPassword = BigInt(dbUser.password.toString())
    if (loginUserPassword !== passwordHash[0].readBigUInt64LE()) {
      logger.error('The User has no valid credentials. email=' + email)
      throw new Error('No user with this credentials')
    }
    logger.info('successfull login with ' + email + ', ***, ' + publisherId)

    const user = new User(dbUser)
    logger.debug('user=' + user)

    // Elopage Status & Stored PublisherId
    user.hasElopage = await this.hasElopage({ ...context, user: dbUser })
    logger.info('user.hasElopage=' + user.hasElopage)
    if (!user.hasElopage && publisherId) {
      user.publisherId = publisherId
      dbUser.publisherId = publisherId
      DbUser.save(dbUser)
    }

    // coinAnimation
    const userSettingRepository = getCustomRepository(UserSettingRepository)
    const coinanimation = await userSettingRepository
      .readBoolean(dbUser.id, Setting.COIN_ANIMATION)
      .catch((error) => {
        throw new Error(error)
      })
    user.coinanimation = coinanimation

    context.setHeaders.push({
      key: 'token',
      value: encode(dbUser.pubKey),
    })
    logger.info('successful Login:' + user)
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
    return true
  }

  @Authorized([RIGHTS.CREATE_USER])
  @Mutation(() => User)
  async createUser(
    @Args()
    { email, firstName, lastName, language, publisherId, redeemCode = null }: CreateUserArgs,
  ): Promise<User> {
    const logger = log4js.getLogger('graphql.resolver.UserResolver')
    logger.trace(
      'createUser(email=' +
        email +
        ', firstName=' +
        firstName +
        ', lastName=' +
        lastName +
        ', language=' +
        language +
        ', publisherId=' +
        publisherId +
        ', redeemCode =' +
        redeemCode,
    )
    // TODO: wrong default value (should be null), how does graphql work here? Is it an required field?
    // default int publisher_id = 0;

    // Validate Language (no throw)
    if (!language || !isLanguage(language)) {
      language = DEFAULT_LANGUAGE
    }

    // Validate email unique
    email = email.trim().toLowerCase()
    // TODO we cannot use repository.count(), since it does not allow to specify if you want to include the soft deletes
    const userFound = await DbUser.findOne({ email }, { withDeleted: true })
    logger.info('DbUser.findOne(email=' + email + ') = ' + userFound)
    if (userFound) {
      logger.error('User already exists with this email=' + email)
      // TODO: this is unsecure, but the current implementation of the login server. This way it can be queried if the user with given EMail is existent.
      throw new Error(`User already exists.`)
    }

    const passphrase = PassphraseGenerate()
    // const keyPair = KeyPairEd25519Create(passphrase) // return pub, priv Key
    // const passwordHash = SecretKeyCryptographyCreateKey(email, password) // return short and long hash
    // const encryptedPrivkey = SecretKeyCryptographyEncrypt(keyPair[1], passwordHash[1])
    const emailHash = getEmailHash(email)

    const dbUser = new DbUser()
    dbUser.email = email
    dbUser.firstName = firstName
    dbUser.lastName = lastName
    dbUser.emailHash = emailHash
    dbUser.language = language
    dbUser.publisherId = publisherId
    dbUser.passphrase = passphrase.join(' ')
    logger.info('new dbUser=' + dbUser)
    if (redeemCode) {
      const transactionLink = await dbTransactionLink.findOne({ code: redeemCode })
      logger.info('redeemCode found transactionLink=' + transactionLink)
      if (transactionLink) {
        dbUser.referrerId = transactionLink.userId
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
      await queryRunner.manager.save(dbUser).catch((error) => {
        // eslint-disable-next-line no-console
        console.log('Error while saving dbUser', error)
        logger.error('Error while saving dbUser', error)
        throw new Error('error saving user')
      })

      const emailOptIn = newEmailOptIn(dbUser.id)
      await queryRunner.manager.save(emailOptIn).catch((error) => {
        // eslint-disable-next-line no-console
        console.log('Error while saving emailOptIn', error)
        logger.error('Error while saving emailOptIn', error)
        throw new Error('error saving email opt in')
      })

      const activationLink = CONFIG.EMAIL_LINK_VERIFICATION.replace(
        /{optin}/g,
        emailOptIn.verificationCode.toString(),
      ).replace(/{code}/g, redeemCode ? '/' + redeemCode : '')

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const emailSent = await sendAccountActivationEmail({
        link: activationLink,
        firstName,
        lastName,
        email,
        duration: printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME),
      })
      logger.info('sendAccountActivationEmail=' + emailSent)
      /* uncomment this, when you need the activation link on the console
      // In case EMails are disabled log the activation link for the user
      if (!emailSent) {
        // eslint-disable-next-line no-console
        console.log(`Account confirmation link: ${activationLink}`)
      }
      */

      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
    logger.info('successful createUser()=' + dbUser)
    return new User(dbUser)
  }

  @Authorized([RIGHTS.SEND_RESET_PASSWORD_EMAIL])
  @Mutation(() => Boolean)
  async forgotPassword(@Arg('email') email: string): Promise<boolean> {
    email = email.trim().toLowerCase()
    const user = await DbUser.findOne({ email })
    if (!user) return true

    // can be both types: REGISTER and RESET_PASSWORD
    let optInCode = await LoginEmailOptIn.findOne({
      userId: user.id,
    })

    optInCode = await checkOptInCode(optInCode, user.id, OptInType.EMAIL_OPT_IN_RESET_PASSWORD)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const emailSent = await sendResetPasswordEmailMailer({
      link: activationLink(optInCode),
      firstName: user.firstName,
      lastName: user.lastName,
      email,
      duration: printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME),
    })

    /*  uncomment this, when you need the activation link on the console
    // In case EMails are disabled log the activation link for the user
    if (!emailSent) {
      // eslint-disable-next-line no-console
      console.log(`Reset password link: ${link}`)
    }
    */

    return true
  }

  @Authorized([RIGHTS.SET_PASSWORD])
  @Mutation(() => Boolean)
  async setPassword(
    @Arg('code') code: string,
    @Arg('password') password: string,
  ): Promise<boolean> {
    // Validate Password
    if (!isPassword(password)) {
      throw new Error(
        'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
      )
    }

    // Load code
    const optInCode = await LoginEmailOptIn.findOneOrFail({ verificationCode: code }).catch(() => {
      throw new Error('Could not login with emailVerificationCode')
    })

    // Code is only valid for `CONFIG.EMAIL_CODE_VALID_TIME` minutes
    if (!isOptInValid(optInCode)) {
      throw new Error(
        `email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
    }

    // load user
    const user = await DbUser.findOneOrFail({ id: optInCode.userId }).catch(() => {
      throw new Error('Could not find corresponding Login User')
    })

    // Generate Passphrase if needed
    if (!user.passphrase) {
      const passphrase = PassphraseGenerate()
      user.passphrase = passphrase.join(' ')
    }

    const passphrase = user.passphrase.split(' ')
    if (passphrase.length < PHRASE_WORD_COUNT) {
      // TODO if this can happen we cannot recover from that
      // this seem to be good on production data, if we dont
      // make a coding mistake we do not have a problem here
      throw new Error('Could not load a correct passphrase')
    }

    // Activate EMail
    user.emailChecked = true

    // Update Password
    const passwordHash = SecretKeyCryptographyCreateKey(user.email, password) // return short and long hash
    const keyPair = KeyPairEd25519Create(passphrase) // return pub, priv Key
    const encryptedPrivkey = SecretKeyCryptographyEncrypt(keyPair[1], passwordHash[1])
    user.password = passwordHash[0].readBigUInt64LE() // using the shorthash
    user.pubKey = keyPair[0]
    user.privKey = encryptedPrivkey

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')

    try {
      // Save user
      await queryRunner.manager.save(user).catch((error) => {
        throw new Error('error saving user: ' + error)
      })

      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }

    // Sign into Klicktipp
    // TODO do we always signUp the user? How to handle things with old users?
    if (optInCode.emailOptInTypeId === OptInType.EMAIL_OPT_IN_REGISTER) {
      try {
        await klicktippSignIn(user.email, user.language, user.firstName, user.lastName)
      } catch {
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
    const optInCode = await LoginEmailOptIn.findOneOrFail({ verificationCode: optIn })
    // Code is only valid for `CONFIG.EMAIL_CODE_VALID_TIME` minutes
    if (!isOptInValid(optInCode)) {
      throw new Error(
        `email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
    }
    return true
  }

  @Authorized([RIGHTS.UPDATE_USER_INFOS])
  @Mutation(() => Boolean)
  async updateUserInfos(
    @Args()
    { firstName, lastName, language, password, passwordNew, coinanimation }: UpdateUserInfosArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const userEntity = getUser(context)

    if (firstName) {
      userEntity.firstName = firstName
    }

    if (lastName) {
      userEntity.lastName = lastName
    }

    if (language) {
      if (!isLanguage(language)) {
        throw new Error(`"${language}" isn't a valid language`)
      }
      userEntity.language = language
    }

    if (password && passwordNew) {
      // Validate Password
      if (!isPassword(passwordNew)) {
        throw new Error(
          'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
        )
      }

      // TODO: This had some error cases defined - like missing private key. This is no longer checked.
      const oldPasswordHash = SecretKeyCryptographyCreateKey(userEntity.email, password)
      if (BigInt(userEntity.password.toString()) !== oldPasswordHash[0].readBigUInt64LE()) {
        throw new Error(`Old password is invalid`)
      }

      const privKey = SecretKeyCryptographyDecrypt(userEntity.privKey, oldPasswordHash[1])

      const newPasswordHash = SecretKeyCryptographyCreateKey(userEntity.email, passwordNew) // return short and long hash
      const encryptedPrivkey = SecretKeyCryptographyEncrypt(privKey, newPasswordHash[1])

      // Save new password hash and newly encrypted private key
      userEntity.password = newPasswordHash[0].readBigUInt64LE()
      userEntity.privKey = encryptedPrivkey
    }

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')

    try {
      if (coinanimation !== null && coinanimation !== undefined) {
        queryRunner.manager
          .getCustomRepository(UserSettingRepository)
          .setOrUpdate(userEntity.id, Setting.COIN_ANIMATION, coinanimation.toString())
          .catch((error) => {
            throw new Error('error saving coinanimation: ' + error)
          })
      }

      await queryRunner.manager.save(userEntity).catch((error) => {
        throw new Error('error saving user: ' + error)
      })

      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }

    return true
  }

  @Authorized([RIGHTS.HAS_ELOPAGE])
  @Query(() => Boolean)
  async hasElopage(@Ctx() context: Context): Promise<boolean> {
    const userEntity = context.user
    if (!userEntity) {
      return false
    }

    return hasElopageBuys(userEntity.email)
  }
}

const isTimeExpired = (optIn: LoginEmailOptIn, duration: number): boolean => {
  const timeElapsed = Date.now() - new Date(optIn.updatedAt).getTime()
  // time is given in minutes
  return timeElapsed <= duration * 60 * 1000
}

const isOptInValid = (optIn: LoginEmailOptIn): boolean => {
  return isTimeExpired(optIn, CONFIG.EMAIL_CODE_VALID_TIME)
}

const canResendOptIn = (optIn: LoginEmailOptIn): boolean => {
  return !isTimeExpired(optIn, CONFIG.EMAIL_CODE_REQUEST_TIME)
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
