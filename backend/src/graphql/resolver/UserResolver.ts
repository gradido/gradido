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
import { User as DbUser } from '../../typeorm/entity/User'
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

@Resolver()
export class UserResolver {
  @Query(() => User)
  @UseMiddleware(klicktippNewsletterStateMiddleware)
  async login(@Args() { email, password }: UnsecureLoginArgs, @Ctx() context: any): Promise<User> {
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
    // read additional settings from settings table
    const userRepository = getCustomRepository(UserRepository)
    const userEntity = await userRepository.findByPubkeyHex(user.pubkey)

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
    @Args() { email, firstName, lastName, password, language }: CreateUserArgs,
  ): Promise<string> {
    const payload = {
      email,
      first_name: firstName,
      last_name: lastName,
      password,
      emailType: 2,
      login_after_register: true,
      language: language,
      publisher_id: 0,
    }
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'createUser', payload)
    if (!result.success) {
      throw new Error(result.data)
    }

    const user = new User(result.data.user)
    const dbuser = new DbUser()
    dbuser.pubkey = Buffer.from(fromHex(user.pubkey))
    dbuser.email = user.email
    dbuser.firstName = user.firstName
    dbuser.lastName = user.lastName
    dbuser.username = user.username

    dbuser.save().catch(() => {
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
    }
    if (coinanimation !== undefined) {
      // load user and balance
      const userRepository = getCustomRepository(UserRepository)
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
}
