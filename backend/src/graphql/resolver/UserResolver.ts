/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Args, Arg, Authorized, Ctx, UseMiddleware, Mutation } from 'type-graphql'
import { from_hex as fromHex } from 'libsodium-wrappers'
import CONFIG from '../../config'
import { CheckUsernameResponse } from '../model/CheckUsernameResponse'
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
import { getCustomRepository } from 'typeorm'
import { UserSettingRepository } from '../../typeorm/repository/UserSettingRepository'
import { Setting } from '../enum/Setting'
import { UserRepository } from '../../typeorm/repository/User'
import { UserSetting } from '@entity/UserSetting'

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
      userEntity.pubkey = Buffer.from(fromHex(user.pubkey))

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
    // const payload = {
    //   email,
    //   first_name: firstName,
    //   last_name: lastName,
    //   password,
    //   emailType: 2,
    //   login_after_register: true,
    //   language: language,
    //   publisher_id: publisherId,
    // }
    // const result = await apiPost(CONFIG.LOGIN_API_URL + 'createUser', payload)
    // if (!result.success) {
    //   throw new Error(result.data)
    // }

    // this.email = json.email
    // this.firstName = json.first_name
    // this.lastName = json.last_name
    // this.username = json.username
    // this.description = json.description
    // this.pubkey = json.public_hex
    // this.language = json.language
    // this.publisherId = json.publisher_id
    const userJson = {
      email,
      firstName,
      lastName,
      password,
      emailType: 2,
      login_after_register: false,
      language: language,
      publisherId,
    }
    const dbUser: DbUser = new DbUser()
    dbUser.email = email
    dbUser.firstName = firstName
    dbUser.lastName = firstName
    


    const user = new User(userJson)
    const dbuser = new DbUser()
    dbuser.pubkey = Buffer.from(fromHex(user.pubkey))
    dbuser.email = user.email
    dbuser.firstName = user.firstName
    dbuser.lastName = user.lastName
    dbuser.username = user.username

    dbuser.save().catch(() => {
      throw new Error('error saving user')
    })

    // const emailOptIn: EmailOptIn = 
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

  @Query(() => CheckUsernameResponse)
  async checkUsername(
    @Args() { username, groupId = 1 }: CheckUsernameArgs,
  ): Promise<CheckUsernameResponse> {
    const response = await apiGet(
      CONFIG.LOGIN_API_URL + `checkUsername?username=${username}&group_id=${groupId}`,
    )
    if (!response.success) throw new Error(response.data)
    return new CheckUsernameResponse(response.data)
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
