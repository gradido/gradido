/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import fs from 'fs'
import { Resolver, Query, Args, Arg, Authorized, Ctx, UseMiddleware, Mutation } from 'type-graphql'
import { getCustomRepository } from 'typeorm'
import CONFIG from '../../config'
import { LoginViaVerificationCode } from '../model/LoginViaVerificationCode'
import { SendPasswordResetEmailResponse } from '../model/SendPasswordResetEmailResponse'
import { UpdateUserInfosResponse } from '../model/UpdateUserInfosResponse'
import { User } from '../model/User'
import { User as DbUser } from '@entity/User'
import encode from '../../jwt/encode'
import ChangePasswordArgs from '../arg/ChangePasswordArgs'
import CheckUsernameArgs from '../arg/CheckUsernameArgs'
import CreateUserArgs from '../arg/CreateUserArgs'
import UnsecureLoginArgs from '../arg/UnsecureLoginArgs'
import UpdateUserInfosArgs from '../arg/UpdateUserInfosArgs'
import { apiPost, apiGet } from '../../apis/HttpRequest'
import {
  klicktippRegistrationMiddleware,
  klicktippNewsletterStateMiddleware,
} from '../../middleware/klicktippMiddleware'
import { CheckEmailResponse } from '../model/CheckEmailResponse'
import { UserSettingRepository } from '../../typeorm/repository/UserSettingRepository'
import { Setting } from '../enum/Setting'
import { UserRepository } from '../../typeorm/repository/User'
import { LoginUserRepository } from '../../typeorm/repository/LoginUser'
import { LoginUserBackupRepository } from '../../typeorm/repository/LoginUserBackup'
import { LoginUser } from '@entity/LoginUser'
import { LoginUserBackup } from '@entity/LoginUserBackup'

// TODO apparently the types are cannot be loaded correctly? IDK whats wrong and we have to use require
// import {
//  /* eslint-disable camelcase */
//  randombytes_random,
//  crypto_hash_sha512_instance,
//  crypto_hash_sha512_BYTES,
//  crypto_sign_seed_keypair,
//  crypto_sign_PUBLICKEYBYTES,
//  crypto_sign_SECRETKEYBYTES,
//  /* eslint-enable camelcase */
// } from 'sodium-native'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')

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
const WORDS = fs.readFileSync('src/config/mnemonic.english.txt').toString().split('\n')
const PassphraseGenerate = (): string[] => {
  const result = []
  for (let i = 0; i < PHRASE_WORD_COUNT; i++) {
    result.push(WORDS[sodium.randombytes_random() % 2048])
  }
  return result
}

/*
  return [
    'avoid',
    'security',
    'heavy',
    'mercy',
    'exit',
    'avocado',
    'actress',
    'apple',
    'crowd',
    'drop',
    'rib',
    'photo',
    'valley',
    'test',
    'board',
    'evidence',
    'blast',
    'pencil',
    'frost',
    'frame',
    'come',
    'vanish',
    'very',
    'inner',
  ]
*/
// pub:  0xdd1b7bb
// priv: 0xbcadd66 (wrong?)

const KeyPairEd25519Create = (passphrase: string[]): Buffer[] => {
  if (!passphrase.length || passphrase.length < PHRASE_WORD_COUNT) {
    throw new Error('passphrase empty or to short')
  }

  const wordIndicies = []
  for (let i = 0; i < PHRASE_WORD_COUNT; i++) {
    wordIndicies.push(WORDS.indexOf(passphrase[i]))
  }

  const state = Buffer.alloc(sodium.crypto_hash_sha512_STATEBYTES)
  sodium.crypto_hash_sha512_init(state)

  // To prevent breaking existing passphrase-hash combinations word indices will be put into 64 Bit Variable to mimic first implementation of algorithms
  for (let i = 0; i < PHRASE_WORD_COUNT; i++) {
    const value = Buffer.alloc(8)
    value.writeBigInt64LE(BigInt(wordIndicies[i]))
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
  // TODO: put that in the actual config
  const configCryptoAppSecret = Buffer.from('21ffbbc616fe', 'hex')
  const configCryptoServerKey = Buffer.from('a51ef8ac7ef1abf162fb7a65261acd7a', 'hex')
  if (configCryptoServerKey.length !== sodium.crypto_shorthash_KEYBYTES) {
    throw new Error(
      `ServerKey has an invalid size. The size must be ${sodium.crypto_shorthash_KEYBYTES} bytes.`,
    )
  }

  const state = Buffer.alloc(sodium.crypto_hash_sha512_STATEBYTES)
  sodium.crypto_hash_sha512_init(state)
  sodium.crypto_hash_sha512_update(state, Buffer.from(salt))
  sodium.crypto_hash_sha512_update(state, Buffer.from(configCryptoAppSecret))
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
  sodium.crypto_shorthash(encryptionKeyHash, encryptionKey, configCryptoServerKey)

  return [encryptionKeyHash, encryptionKey]
}

const getEmailHash = (email: string): Buffer => {
  const emailHash = Buffer.alloc(sodium.crypto_generichash_BYTES)
  sodium.crypto_generichash(emailHash, Buffer.from(email))
  return emailHash
}

@Resolver()
export class UserResolver {
  @Query(() => User)
  @UseMiddleware(klicktippNewsletterStateMiddleware)
  async login(
    @Args() { email, password, publisherId }: UnsecureLoginArgs,
    @Ctx() context: any,
  ): Promise<User> {
    email = email.trim().toLowerCase()
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'unsecureLogin', { email, password })

    // if there is no user, throw an authentication error
    if (!result.success) {
      throw new Error(result.data)
    }

    context.setHeaders.push({
      key: 'token',
      value: encode(result.data.session_id, result.data.user.public_hex),
    })
    const user = new User(result.data.user)
    // Hack: Database Field is not validated properly and not nullable
    if (user.publisherId === 0) {
      user.publisherId = undefined
    }
    user.hasElopage = result.data.hasElopage
    // read additional settings from settings table
    const userRepository = getCustomRepository(UserRepository)
    let userEntity: void | DbUser
    userEntity = await userRepository.findByPubkeyHex(user.pubkey).catch(() => {
      userEntity = new DbUser()
      userEntity.firstName = user.firstName
      userEntity.lastName = user.lastName
      userEntity.username = user.username
      userEntity.email = user.email
      userEntity.pubkey = Buffer.from(user.pubkey, 'hex')

      userRepository.save(userEntity).catch(() => {
        throw new Error('error by save userEntity')
      })
    })
    if (!userEntity) {
      throw new Error('error with cannot happen')
    }

    // Save publisherId if Elopage is not yet registered
    if (!user.hasElopage && publisherId) {
      user.publisherId = publisherId
      await this.updateUserInfos(
        { publisherId },
        { sessionId: result.data.session_id, pubKey: result.data.user.public_hex },
      )
    }

    const userSettingRepository = getCustomRepository(UserSettingRepository)
    const coinanimation = await userSettingRepository
      .readBoolean(userEntity.id, Setting.COIN_ANIMATION)
      .catch((error) => {
        throw new Error(error)
      })
    user.coinanimation = coinanimation
    return user
  }

  @Query(() => LoginViaVerificationCode)
  async loginViaEmailVerificationCode(
    @Arg('optin') optin: string,
  ): Promise<LoginViaVerificationCode> {
    // I cannot use number as type here.
    // The value received is not the same as sent by the query
    const result = await apiGet(
      CONFIG.LOGIN_API_URL + 'loginViaEmailVerificationCode?emailVerificationCode=' + optin,
    )
    if (!result.success) {
      throw new Error(result.data)
    }
    return new LoginViaVerificationCode(result.data)
  }

  @Authorized()
  @Query(() => String)
  async logout(@Ctx() context: any): Promise<string> {
    const payload = { session_id: context.sessionId }
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'logout', payload)
    if (!result.success) {
      throw new Error(result.data)
    }
    return 'success'
  }

  @Mutation(() => String)
  async createUser(
    @Args() { email, firstName, lastName, password, language, publisherId }: CreateUserArgs,
  ): Promise<string> {
    const username = ''

    // TODO: wrong default value (should be null), how does graphql work here? Is it an required field?
    // default int publisher_id = 0;

    // Validate Language (no throw)
    if (!isLanguage(language)) {
      language = DEFAULT_LANGUAGE
    }

    // Validate Password
    if (!isPassword(password)) {
      throw new Error(
        'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
      )
    }

    // Validate username
    // TODO: never true
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
    const keyPair = KeyPairEd25519Create(passphrase)
    const passwordHash = SecretKeyCryptographyCreateKey(email, password)
    const emailHash = getEmailHash(email)

    // Table: login_users
    const loginUser = new LoginUser()
    loginUser.email = email
    loginUser.firstName = firstName
    loginUser.lastName = lastName
    loginUser.username = username
    loginUser.description = ''
    loginUser.password = passwordHash[0].readBigUInt64LE() // using the shorthash
    loginUser.emailHash = emailHash
    loginUser.language = language
    loginUser.groupId = 1
    loginUser.publisherId = publisherId
    loginUser.pubKey = keyPair[0]
    loginUser.privKey = keyPair[1]

    // TODO transaction
    const loginUserRepository = getCustomRepository(LoginUserRepository)
    const { id: loginUserId } = await loginUserRepository.save(loginUser).catch((error) => {
      // eslint-disable-next-line no-console
      console.log('insert user failed', error)
      throw new Error('insert user failed')
    })

    // Table: login_user_backups
    const loginUserBackup = new LoginUserBackup()
    loginUserBackup.userId = loginUserId
    loginUserBackup.passphrase = passphrase.join(' ')
    loginUserBackup.mnemonicType = 2 // ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER;

    // TODO transaction
    const loginUserBackupRepository = getCustomRepository(LoginUserBackupRepository)
    await loginUserBackupRepository.save(loginUserBackup).catch(() => {
      throw new Error('insert user backup failed')
    })

    // Table: state_users
    const dbUser = new DbUser()
    dbUser.pubkey = keyPair[0]
    dbUser.email = email
    dbUser.firstName = firstName
    dbUser.lastName = lastName
    dbUser.username = username

    // TDOO transaction
    await userRepository.save(dbUser).catch(() => {
      throw new Error('error saving user')
    })

    // TODO: send EMail (EMAIL_OPT_IN_REGISTER)
    // const emailType = 2
    // auto emailOptIn = controller::EmailVerificationCode::create(userModel->getID(), model::table::EMAIL_OPT_IN_REGISTER);
    // auto emailOptInModel = emailOptIn->getModel();
    // if (!emailOptInModel->insertIntoDB(false)) {
    //	emailOptInModel->sendErrorsAsEmail();
    //	return stateError("insert emailOptIn failed");
    // }
    // emailOptIn->setBaseUrl(user->getGroupBaseUrl() + ServerConfig::g_frontend_checkEmailPath);
    // em->addEmail(new model::Email(emailOptIn, user, model::Email::convertTypeFromInt(emailType)));

    return 'success'
  }

  @Query(() => SendPasswordResetEmailResponse)
  async sendResetPasswordEmail(
    @Arg('email') email: string,
  ): Promise<SendPasswordResetEmailResponse> {
    const payload = {
      email,
      email_text: 7,
      email_verification_code_type: 'resetPassword',
    }
    const response = await apiPost(CONFIG.LOGIN_API_URL + 'sendEmail', payload)
    if (!response.success) {
      throw new Error(response.data)
    }
    return new SendPasswordResetEmailResponse(response.data)
  }

  @Mutation(() => String)
  async resetPassword(
    @Args()
    { sessionId, email, password }: ChangePasswordArgs,
  ): Promise<string> {
    const payload = {
      session_id: sessionId,
      email,
      password,
    }
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'resetPassword', payload)
    if (!result.success) {
      throw new Error(result.data)
    }
    return 'success'
  }

  @Authorized()
  @Mutation(() => UpdateUserInfosResponse)
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
  ): Promise<UpdateUserInfosResponse> {
    const payload = {
      session_id: context.sessionId,
      update: {
        'User.first_name': firstName || undefined,
        'User.last_name': lastName || undefined,
        'User.description': description || undefined,
        'User.username': username || undefined,
        'User.language': language || undefined,
        'User.publisher_id': publisherId || undefined,
        'User.password': passwordNew || undefined,
        'User.password_old': password || undefined,
      },
    }
    let response: UpdateUserInfosResponse | undefined
    const userRepository = getCustomRepository(UserRepository)

    if (
      firstName ||
      lastName ||
      description ||
      username ||
      language ||
      publisherId ||
      passwordNew ||
      password
    ) {
      const result = await apiPost(CONFIG.LOGIN_API_URL + 'updateUserInfos', payload)
      if (!result.success) throw new Error(result.data)
      response = new UpdateUserInfosResponse(result.data)

      const userEntity = await userRepository.findByPubkeyHex(context.pubKey)
      let userEntityChanged = false
      if (firstName) {
        userEntity.firstName = firstName
        userEntityChanged = true
      }
      if (lastName) {
        userEntity.lastName = lastName
        userEntityChanged = true
      }
      if (username) {
        userEntity.username = username
        userEntityChanged = true
      }
      if (userEntityChanged) {
        userRepository.save(userEntity).catch((error) => {
          throw new Error(error)
        })
      }
    }
    if (coinanimation !== undefined) {
      // load user and balance

      const userEntity = await userRepository.findByPubkeyHex(context.pubKey)

      const userSettingRepository = getCustomRepository(UserSettingRepository)
      userSettingRepository
        .setOrUpdate(userEntity.id, Setting.COIN_ANIMATION, coinanimation.toString())
        .catch((error) => {
          throw new Error(error)
        })

      if (!response) {
        response = new UpdateUserInfosResponse({ valid_values: 1 })
      } else {
        response.validValues++
      }
    }
    if (!response) {
      throw new Error('no valid response')
    }
    return response
  }

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

    const usersFound = await LoginUser.count({ username })

    // Username already present?
    if (usersFound !== 0) {
      throw new Error(`Username "${username}" already taken.`)
    }

    return true
  }

  @Query(() => CheckEmailResponse)
  @UseMiddleware(klicktippRegistrationMiddleware)
  async checkEmail(@Arg('optin') optin: string): Promise<CheckEmailResponse> {
    const result = await apiGet(
      CONFIG.LOGIN_API_URL + 'loginViaEmailVerificationCode?emailVerificationCode=' + optin,
    )
    if (!result.success) {
      throw new Error(result.data)
    }
    return new CheckEmailResponse(result.data)
  }

  @Query(() => Boolean)
  async hasElopage(@Ctx() context: any): Promise<boolean> {
    const result = await apiGet(CONFIG.LOGIN_API_URL + 'hasElopage?session_id=' + context.sessionId)
    if (!result.success) {
      throw new Error(result.data)
    }
    return result.data.hasElopage
  }
}
