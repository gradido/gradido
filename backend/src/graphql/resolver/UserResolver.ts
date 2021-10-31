/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import fs from 'fs'
import { Resolver, Query, Args, Arg, Authorized, Ctx, UseMiddleware, Mutation } from 'type-graphql'
import {
  /* eslint-disable camelcase */
  randombytes_random,
  crypto_hash_sha512_instance,
  crypto_hash_sha512_BYTES,
  crypto_sign_seed_keypair,
  crypto_sign_PUBLICKEYBYTES,
  crypto_sign_SECRETKEYBYTES,
  /* eslint-enable camelcase */
} from 'sodium-native'
import { getCustomRepository, NoNeedToReleaseEntityManagerError } from 'typeorm'
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
import { LoginUser } from '@entity/LoginUser'
import { LoginUserBackup } from '@entity/LoginUserBackup'
import { bigintToBuf } from 'bigint-conversion'

// We will reuse this for changePassword
const isPassword = (password: string): boolean => {
  if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 \\t\\n\\r]).{8,}$/)) {
    return false
    // TODO we dont need this right, frontend does it?
    /*
    if(pwd.length < 8){
      throw new Error('Your password is to short!')
    }
    if(!pwd.match(/[a-z]/)){
      throw new Error('Your password does not contain lowercase letters!')
    }
    if(!pwd.match(/[A-Z]/)){
      throw new Error('Your password does not contain any capital letters!')
    }
    if(!pwd.match(/[0-9]/)){
      throw new Error('Your password does not contain any number!')
    }
    if(!pwd.match(/[^a-zA-Z0-9 \\t\\n\\r]/)){
      throw new Error('Your password does not contain special characters!')
    }
    */
  }
  return true
}

const LANGUAGES = ['de', 'en']
const DEFAULT_LANGUAGE = 'de'
// very likely to be reused
const isLanguage = (language: string): boolean => {
  return LANGUAGES.includes(language)
}

const PHRASE_WORD_COUNT = 24
const WORDS = fs.readFileSync('src/config/mnemonic.english.txt').toString().split('\n')
const PassphraseGenerate = (): string[] => {
  const result = []
  for (let i = 0; i < PHRASE_WORD_COUNT; i++) {
    result.push(WORDS[randombytes_random() % 2048])
  }
  return result
}

const KeyPairEd25519Create = (passphrase: string[]): Buffer[] => {
  if (!passphrase.length) {
    throw new Error('passphrase empty')
  }

  const wordIndicies = []
  for (let i = 0; i < PHRASE_WORD_COUNT; i++) {
    wordIndicies.push(WORDS.indexOf(passphrase[i]))
  }

  // TODO: wtf is this?
  // if (!wordIndicies || (!wordIndicies[0] && !wordIndicies[1] && !wordIndicies[2] && !wordIndicies[3])) {
  //	return null;
  // }
  const clearPassphrase = passphrase.join(' ')

  // Assuming this calls `crypto_hash_sha512_init`
  const hash = crypto_hash_sha512_instance()

  // ****  convert word indices into uint64  ****
  // To prevent breaking existing passphrase-hash combinations word indices will be put into 64 Bit Variable to mimic first implementation of algorithms
  for (let i = 0; i < PHRASE_WORD_COUNT; i++) {
    const value = BigInt(wordIndicies[i])
    hash.update(Buffer.from(bigintToBuf(value)))
  }
  // **** end converting into uint64 *****
  hash.update(Buffer.from(clearPassphrase))
  const outputHashBuffer = Buffer.alloc(crypto_hash_sha512_BYTES)
  hash.final(outputHashBuffer)

  const pubKey = Buffer.alloc(crypto_sign_PUBLICKEYBYTES)
  const privKey = Buffer.alloc(crypto_sign_SECRETKEYBYTES)

  crypto_sign_seed_keypair(pubKey, privKey, outputHashBuffer)

  return [pubKey, privKey]
}

const generateKeys = async (email: string, savePassphrase: boolean): Promise<Buffer[]> => {
  const mNewUser = await LoginUser.findOneOrFail({ email })
  // TODO figure mnemonic database
  // const lang = mNewUser.language
  /*
  if (LANG_DE == lang) {
		mnemonic_type = ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER_FIXED_CASES;
	}
  */

  const passphrase = PassphraseGenerate()

  if (savePassphrase) {
    const loginUserBackup = new LoginUserBackup()
    loginUserBackup.userId = mNewUser.id
    loginUserBackup.passphrase = passphrase.join(' ')
    loginUserBackup.mnemonicType = 2 // ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER;

    await loginUserBackup.save().catch(() => {
      throw new Error('insert user backup failed')
    })
  }

  // keys
  const gradidoKeyPair = KeyPairEd25519Create(passphrase)

  mNewUser.pubKey = gradidoKeyPair[0]
  mNewUser.privKey = gradidoKeyPair[1]

  await mNewUser.save().catch(() => {
    throw new Error(`Error saving new generated pub/priv keys, email: ${email}`)
  })

  return gradidoKeyPair
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

      userEntity.save().catch(() => {
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
    // TODO Login Server ignored this when he got an empty password?!
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
    const usersFound = await LoginUser.count({ email })
    if (usersFound !== 0) {
      // TODO: this is unsecure, but the current implementation of the login server. This way it can be queried if the user with given EMail is existent.
      throw new Error(`User already exists.`)
    }

    const loginUser = new LoginUser()
    loginUser.email = email
    loginUser.firstName = firstName
    loginUser.lastName = lastName
    loginUser.username = username
    loginUser.description = ''
    loginUser.password = BigInt(0)
    // TODO: This was never used according to my analysis. Therefore I consider it safe to set to 0
    loginUser.emailHash = Buffer.from([0])
    loginUser.language = language
    loginUser.groupId = 1
    loginUser.publisherId = publisherId

    // TODO: check if this insert method is correct, we had problems with that!
    await loginUser.save().catch(() => {
      // TODO: this triggered an EMail send
      throw new Error('insert user failed')
    })

    const keys = await generateKeys(email, true)
    const pubkey = keys[0]

    // TODO: we do not login the user as before, since session management is not yet ported
    // calculate encryption key, could need some time, will save encrypted privkey to db
    // UniLib::controller::TaskPtr create_authenticated_encrypten_key = new AuthenticatedEncryptionCreateKeyTask(user, password);
    // create_authenticated_encrypten_key->scheduleTask(create_authenticated_encrypten_key);

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

    // ------------------------------------------------------

    const dbuser = new DbUser()
    dbuser.pubkey = pubkey
    dbuser.email = email
    dbuser.firstName = firstName
    dbuser.lastName = lastName
    dbuser.username = username

    await dbuser.save().catch(() => {
      throw new Error('error saving user')
    })

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
        userEntity.save().catch((error) => {
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
