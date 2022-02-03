/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import fs from 'fs'
import { Resolver, Query, Args, Arg, Authorized, Ctx, UseMiddleware, Mutation } from 'type-graphql'
import { getConnection, getCustomRepository, getRepository, QueryRunner } from '@dbTools/typeorm'
import CONFIG from '../../config'
import { User } from '../model/User'
import { User as DbUser } from '@entity/User'
import { encode } from '../../auth/JWT'
import CheckUsernameArgs from '../arg/CheckUsernameArgs'
import CreateUserArgs from '../arg/CreateUserArgs'
import UnsecureLoginArgs from '../arg/UnsecureLoginArgs'
import UpdateUserInfosArgs from '../arg/UpdateUserInfosArgs'
import { klicktippNewsletterStateMiddleware } from '../../middleware/klicktippMiddleware'
import { UserSettingRepository } from '../../typeorm/repository/UserSettingRepository'
import { Setting } from '../enum/Setting'
import { UserRepository } from '../../typeorm/repository/User'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'
import { sendResetPasswordEmail } from '../../mailer/sendResetPasswordEmail'
import { sendAccountActivationEmail } from '../../mailer/sendAccountActivationEmail'
import { LoginElopageBuysRepository } from '../../typeorm/repository/LoginElopageBuys'
import { klicktippSignIn } from '../../apis/KlicktippController'
import { RIGHTS } from '../../auth/RIGHTS'
import { ServerUserRepository } from '../../typeorm/repository/ServerUser'
import { ROLE_ADMIN } from '../../auth/ROLES'
import { randomInt } from 'crypto'

const EMAIL_OPT_IN_RESET_PASSWORD = 2
const EMAIL_OPT_IN_REGISTER = 1

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const random = require('random-bigint')

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
  const result = []
  for (let i = 0; i < PHRASE_WORD_COUNT; i++) {
    result.push(WORDS[sodium.randombytes_random() % 2048])
  }
  return result
}

const KeyPairEd25519Create = (passphrase: string[]): Buffer[] => {
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
  const emailHash = Buffer.alloc(sodium.crypto_generichash_BYTES)
  sodium.crypto_generichash(emailHash, Buffer.from(email))
  return emailHash
}

const SecretKeyCryptographyEncrypt = (message: Buffer, encryptionKey: Buffer): Buffer => {
  const encrypted = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES)
  const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
  nonce.fill(31) // static nonce

  sodium.crypto_secretbox_easy(encrypted, message, nonce, encryptionKey)
  return encrypted
}

const SecretKeyCryptographyDecrypt = (encryptedMessage: Buffer, encryptionKey: Buffer): Buffer => {
  const message = Buffer.alloc(encryptedMessage.length - sodium.crypto_secretbox_MACBYTES)
  const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
  nonce.fill(31) // static nonce

  sodium.crypto_secretbox_open_easy(message, encryptedMessage, nonce, encryptionKey)

  return message
}
const createEmailOptIn = async (
  loginUserId: number,
  queryRunner: QueryRunner,
): Promise<LoginEmailOptIn> => {
  const loginEmailOptInRepository = await getRepository(LoginEmailOptIn)
  let emailOptIn = await loginEmailOptInRepository.findOne({
    userId: loginUserId,
    emailOptInTypeId: EMAIL_OPT_IN_REGISTER,
  })
  if (emailOptIn) {
    const timeElapsed = Date.now() - new Date(emailOptIn.updatedAt).getTime()
    if (timeElapsed <= parseInt(CONFIG.RESEND_TIME.toString()) * 60 * 1000) {
      throw new Error(
        'email already sent less than ' + parseInt(CONFIG.RESEND_TIME.toString()) + ' minutes ago',
      )
    } else {
      emailOptIn.updatedAt = new Date()
      emailOptIn.resendCount++
    }
  } else {
    emailOptIn = new LoginEmailOptIn()
    emailOptIn.verificationCode = random(64)
    emailOptIn.userId = loginUserId
    emailOptIn.emailOptInTypeId = EMAIL_OPT_IN_REGISTER
  }
  await queryRunner.manager.save(emailOptIn).catch((error) => {
    // eslint-disable-next-line no-console
    console.log('Error while saving emailOptIn', error)
    throw new Error('error saving email opt in')
  })
  return emailOptIn
}

const getOptInCode = async (loginUserId: number): Promise<LoginEmailOptIn> => {
  const loginEmailOptInRepository = await getRepository(LoginEmailOptIn)
  let optInCode = await loginEmailOptInRepository.findOne({
    userId: loginUserId,
    emailOptInTypeId: EMAIL_OPT_IN_RESET_PASSWORD,
  })

  // Check for 10 minute delay
  if (optInCode) {
    const timeElapsed = Date.now() - new Date(optInCode.updatedAt).getTime()
    if (timeElapsed <= parseInt(CONFIG.RESEND_TIME.toString()) * 60 * 1000) {
      throw new Error(
        'email already sent less than ' + parseInt(CONFIG.RESEND_TIME.toString()) + ' minutes ago',
      )
    } else {
      optInCode.updatedAt = new Date()
      optInCode.resendCount++
    }
  } else {
    optInCode = new LoginEmailOptIn()
    optInCode.verificationCode = random(64)
    optInCode.userId = loginUserId
    optInCode.emailOptInTypeId = EMAIL_OPT_IN_RESET_PASSWORD
  }
  await loginEmailOptInRepository.save(optInCode)
  return optInCode
}

@Resolver()
export class UserResolver {
  @Authorized([RIGHTS.VERIFY_LOGIN])
  @Query(() => User)
  @UseMiddleware(klicktippNewsletterStateMiddleware)
  async verifyLogin(@Ctx() context: any): Promise<User> {
    // TODO refactor and do not have duplicate code with login(see below)
    const userRepository = getCustomRepository(UserRepository)
    const userEntity = await userRepository.findByPubkeyHex(context.pubKey)
    const user = new User()
    user.id = userEntity.id
    user.email = userEntity.email
    user.firstName = userEntity.firstName
    user.lastName = userEntity.lastName
    user.username = userEntity.username
    user.description = userEntity.description
    user.pubkey = userEntity.pubKey.toString('hex')
    user.language = userEntity.language

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

    user.isAdmin = context.role === ROLE_ADMIN
    return user
  }

  @Authorized([RIGHTS.LOGIN])
  @Query(() => User)
  @UseMiddleware(klicktippNewsletterStateMiddleware)
  async login(
    @Args() { email, password, publisherId }: UnsecureLoginArgs,
    @Ctx() context: any,
  ): Promise<User> {
    email = email.trim().toLowerCase()
    const dbUser = await DbUser.findOneOrFail({ email }).catch(() => {
      throw new Error('No user with this credentials')
    })
    if (!dbUser.emailChecked) {
      throw new Error('User email not validated')
    }
    if (dbUser.password === BigInt(0)) {
      // TODO we want to catch this on the frontend and ask the user to check his emails or resend code
      throw new Error('User has no password set yet')
    }
    if (!dbUser.pubKey || !dbUser.privKey) {
      // TODO we want to catch this on the frontend and ask the user to check his emails or resend code
      throw new Error('User has no private or publicKey')
    }
    const passwordHash = SecretKeyCryptographyCreateKey(email, password) // return short and long hash
    const loginUserPassword = BigInt(dbUser.password.toString())
    if (loginUserPassword !== passwordHash[0].readBigUInt64LE()) {
      throw new Error('No user with this credentials')
    }

    const user = new User()
    user.id = dbUser.id
    user.email = email
    user.firstName = dbUser.firstName
    user.lastName = dbUser.lastName
    user.username = dbUser.username
    user.description = dbUser.description
    user.pubkey = dbUser.pubKey.toString('hex')
    user.language = dbUser.language

    // Elopage Status & Stored PublisherId
    user.hasElopage = await this.hasElopage({ pubKey: dbUser.pubKey.toString('hex') })
    if (!user.hasElopage && publisherId) {
      user.publisherId = publisherId
      // TODO: Check if we can use updateUserInfos
      // await this.updateUserInfos({ publisherId }, { pubKey: loginUser.pubKey })
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

    // context.role is not set to the actual role yet on login
    const serverUserRepository = await getCustomRepository(ServerUserRepository)
    const countServerUsers = await serverUserRepository.count({ email: user.email })
    user.isAdmin = countServerUsers > 0

    context.setHeaders.push({
      key: 'token',
      value: encode(dbUser.pubKey),
    })

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
    return true
  }

  @Authorized([RIGHTS.CREATE_USER])
  @Mutation(() => String)
  async createUser(
    @Args() { email, firstName, lastName, language, publisherId }: CreateUserArgs,
  ): Promise<string> {
    // TODO: wrong default value (should be null), how does graphql work here? Is it an required field?
    // default int publisher_id = 0;

    // Validate Language (no throw)
    if (!language || !isLanguage(language)) {
      language = DEFAULT_LANGUAGE
    }

    // Validate username
    // TODO: never true
    const username = ''
    if (username.length > 3 && !this.checkUsername({ username })) {
      throw new Error('Username already in use')
    }

    // Validate email unique
    // TODO: i can register an email in upper/lower case twice
    const userRepository = getCustomRepository(UserRepository)
    const usersFound = await userRepository.count({ email })
    if (usersFound !== 0) {
      // TODO: this is unsecure, but the current implementation of the login server. This way it can be queried if the user with given EMail is existent.
      throw new Error(`User already exists.`)
    }

    const passphrase = PassphraseGenerate()
    // const keyPair = KeyPairEd25519Create(passphrase) // return pub, priv Key
    // const passwordHash = SecretKeyCryptographyCreateKey(email, password) // return short and long hash
    // const encryptedPrivkey = SecretKeyCryptographyEncrypt(keyPair[1], passwordHash[1])
    const emailHash = getEmailHash(email)

    // Table: state_users
    const dbUser = new DbUser()
    dbUser.email = email
    dbUser.firstName = firstName
    dbUser.lastName = lastName
    dbUser.username = username
    dbUser.description = ''
    dbUser.emailHash = emailHash
    dbUser.language = language
    dbUser.publisherId = publisherId
    dbUser.passphrase = passphrase.join(' ')
    // TODO this is a refactor artifact and must be removed quickly
    dbUser.loginUserId = randomInt(9999999999)
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
        throw new Error('error saving user')
      })

      // Store EmailOptIn in DB
      // TODO: this has duplicate code with sendResetPasswordEmail
      const emailOptIn = await createEmailOptIn(dbUser.loginUserId, queryRunner)

      const activationLink = CONFIG.EMAIL_LINK_VERIFICATION.replace(
        /{code}/g,
        emailOptIn.verificationCode.toString(),
      )
      const emailSent = await sendAccountActivationEmail({
        link: activationLink,
        firstName,
        lastName,
        email,
      })

      // In case EMails are disabled log the activation link for the user
      if (!emailSent) {
        // eslint-disable-next-line no-console
        console.log(`Account confirmation link: ${activationLink}`)
      }
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
    return 'success'
  }

  // THis is used by the admin only - should we move it to the admin resolver?
  @Authorized([RIGHTS.SEND_ACTIVATION_EMAIL])
  @Mutation(() => Boolean)
  async sendActivationEmail(@Arg('email') email: string): Promise<boolean> {
    const user = await DbUser.findOneOrFail({ email: email })

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')

    try {
      const emailOptIn = await createEmailOptIn(user.loginUserId, queryRunner)

      const activationLink = CONFIG.EMAIL_LINK_VERIFICATION.replace(
        /{code}/g,
        emailOptIn.verificationCode.toString(),
      )

      const emailSent = await sendAccountActivationEmail({
        link: activationLink,
        firstName: user.firstName,
        lastName: user.lastName,
        email,
      })

      // In case EMails are disabled log the activation link for the user
      if (!emailSent) {
        // eslint-disable-next-line no-console
        console.log(`Account confirmation link: ${activationLink}`)
      }
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
    return true
  }

  @Authorized([RIGHTS.SEND_RESET_PASSWORD_EMAIL])
  @Query(() => Boolean)
  async sendResetPasswordEmail(@Arg('email') email: string): Promise<boolean> {
    // TODO: this has duplicate code with createUser

    const user = await DbUser.findOneOrFail({ email })

    const optInCode = await getOptInCode(user.loginUserId)

    const link = CONFIG.EMAIL_LINK_SETPASSWORD.replace(
      /{code}/g,
      optInCode.verificationCode.toString(),
    )

    const emailSent = await sendResetPasswordEmail({
      link,
      firstName: user.firstName,
      lastName: user.lastName,
      email,
    })

    // In case EMails are disabled log the activation link for the user
    if (!emailSent) {
      // eslint-disable-next-line no-console
      console.log(`Reset password link: ${link}`)
    }

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
    const loginEmailOptInRepository = await getRepository(LoginEmailOptIn)
    const optInCode = await loginEmailOptInRepository
      .findOneOrFail({ verificationCode: code })
      .catch(() => {
        throw new Error('Could not login with emailVerificationCode')
      })

    // Code is only valid for 10minutes
    const timeElapsed = Date.now() - new Date(optInCode.updatedAt).getTime()
    if (timeElapsed > 10 * 60 * 1000) {
      throw new Error('Code is older than 10 minutes')
    }

    // load user
    const user = await DbUser.findOneOrFail({ loginUserId: optInCode.userId }).catch(() => {
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

      // Delete Code
      await queryRunner.manager.remove(optInCode).catch((error) => {
        throw new Error('error deleting code: ' + error)
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
    if (optInCode.emailOptInTypeId === EMAIL_OPT_IN_REGISTER) {
      try {
        await klicktippSignIn(user.email, user.language, user.firstName, user.lastName)
      } catch {
        // TODO is this a problem?
        // eslint-disable-next-line no-console
        console.log('Could not subscribe to klicktipp')
      }
    }

    return true
  }

  @Authorized([RIGHTS.UPDATE_USER_INFOS])
  @Mutation(() => Boolean)
  async updateUserInfos(
    @Args()
    {
      firstName,
      lastName,
      description,
      username,
      language,
      publisherId,
      password,
      passwordNew,
      coinanimation,
    }: UpdateUserInfosArgs,
    @Ctx() context: any,
  ): Promise<boolean> {
    const userRepository = getCustomRepository(UserRepository)
    const userEntity = await userRepository.findByPubkeyHex(context.pubKey)

    if (username) {
      throw new Error('change username currently not supported!')
      // TODO: this error was thrown on login_server whenever you tried to change the username
      // to anything except "" which is an exception to the rules below. Those were defined
      // aswell, even tho never used.
      // ^[a-zA-Z][a-zA-Z0-9_-]*$
      // username must start with [a-z] or [A-Z] and than can contain also [0-9], - and _
      // username already used
      // userEntity.username = username
    }

    if (firstName) {
      userEntity.firstName = firstName
    }

    if (lastName) {
      userEntity.lastName = lastName
    }

    if (description) {
      userEntity.description = description
    }

    if (language) {
      if (!isLanguage(language)) {
        throw new Error(`"${language}" isn't a valid language`)
      }
      userEntity.language = language
    }

    if (password && passwordNew) {
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

    // Save publisherId only if Elopage is not yet registered
    if (publisherId && !(await this.hasElopage(context))) {
      userEntity.publisherId = publisherId
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

  @Authorized([RIGHTS.CHECK_USERNAME])
  @Query(() => Boolean)
  async checkUsername(@Args() { username }: CheckUsernameArgs): Promise<boolean> {
    // Username empty?
    if (username === '') {
      throw new Error('Username must be set.')
    }

    // Do we fullfil the minimum character length?
    const MIN_CHARACTERS_USERNAME = 2
    if (username.length < MIN_CHARACTERS_USERNAME) {
      throw new Error(`Username must be at minimum ${MIN_CHARACTERS_USERNAME} characters long.`)
    }

    const usersFound = await DbUser.count({ username })

    // Username already present?
    if (usersFound !== 0) {
      throw new Error(`Username "${username}" already taken.`)
    }

    return true
  }

  @Authorized([RIGHTS.HAS_ELOPAGE])
  @Query(() => Boolean)
  async hasElopage(@Ctx() context: any): Promise<boolean> {
    const userRepository = getCustomRepository(UserRepository)
    const userEntity = await userRepository.findByPubkeyHex(context.pubKey).catch()
    if (!userEntity) {
      return false
    }

    const loginElopageBuysRepository = getCustomRepository(LoginElopageBuysRepository)
    const elopageBuyCount = await loginElopageBuysRepository.count({ payerEmail: userEntity.email })
    return elopageBuyCount > 0
  }
}
