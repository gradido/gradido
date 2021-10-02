/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Args, Arg, Authorized, Ctx, UseMiddleware, Mutation } from 'type-graphql'
import CONFIG from '../../config'
import { CheckUsernameResponse } from '../models/CheckUsernameResponse'
import { LoginViaVerificationCode } from '../models/LoginViaVerificationCode'
import { SendPasswordResetEmailResponse } from '../models/SendPasswordResetEmailResponse'
import { UpdateUserInfosResponse } from '../models/UpdateUserInfosResponse'
import { User } from '../models/User'
import encode from '../../jwt/encode'
import ChangePasswordArgs from '../args/ChangePasswordArgs'
import CheckUsernameArgs from '../args/CheckUsernameArgs'
import CreateUserArgs from '../args/CreateUserArgs'
import UnsecureLoginArgs from '../args/UnsecureLoginArgs'
import UpdateUserInfosArgs from '../args/UpdateUserInfosArgs'
import { apiPost, apiGet } from '../../apis/HttpRequest'
import {
  klicktippRegistrationMiddleware,
  klicktippNewsletterStateMiddleware,
} from '../../middleware/klicktippMiddleware'
import { CheckEmailResponse } from '../models/CheckEmailResponse'
import { getCustomRepository } from 'typeorm'
import { UserSettingRepository } from '../../typeorm/repository/UserSettingRepository'
import { Setting } from '../../graphql/enum/Setting'
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
    console.log("before coinaimation, coinanimation: %o", coinanimation)
    if (coinanimation !== undefined) {
      // load user and balance
      const userRepository = getCustomRepository(UserRepository)
      console.log("get user repository")
      console.log("try to find: %o", context.pubKey)
      const userEntity = await userRepository.findByPubkeyHex(context.pubKey)
      console.log("user entity: %o", userEntity )
      const userSettingRepository = getCustomRepository(UserSettingRepository)
      userSettingRepository
        .setOrUpdate(userEntity.id, Setting.COIN_ANIMATION, coinanimation.toString())
        .catch((error) => {
          throw new Error(error)
        })
      
      if (!response) {
        console.log("new response")
        response = new UpdateUserInfosResponse({ valid_values: 1 })
      } else {
        response.validValues++
      }
      console.log("response should be set")
    }
    if (!response) {
      throw new Error('no valid response')
    }
    console.log(response)
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
