/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Args, Arg, Authorized, Ctx, UseMiddleware } from 'type-graphql'
import CONFIG from '../../config'
import { CheckUsernameResponse } from '../models/CheckUsernameResponse'
import { LoginViaVerificationCode } from '../models/LoginViaVerificationCode'
import { SendPasswordResetEmailResponse } from '../models/SendPasswordResetEmailResponse'
import { UpdateUserInfosResponse } from '../models/UpdateUserInfosResponse'
import { User } from '../models/User'
import encode from '../../jwt/encode'
import {
  ChangePasswordArgs,
  CheckUsernameArgs,
  CreateUserArgs,
  UnsecureLoginArgs,
  UpdateUserInfosArgs,
} from '../inputs/LoginUserInput'
import { apiPost, apiGet } from '../../apis/HttpRequest'
import {
  klicktippRegistrationMiddleware,
  klicktippNewsletterStateMiddleware,
} from '../../middleware/klicktippMiddleware'
import { CheckEmailResponse } from '../models/CheckEmailResponse'
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

    context.setHeaders.push({ key: 'token', value: encode(result.data.session_id) })

    return new User(result.data.user)
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

  @Query(() => String)
  async create(
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

  @Query(() => String)
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
    return 'sucess'
  }

  @Authorized()
  @Query(() => UpdateUserInfosResponse)
  async updateUserInfos(
    @Args()
    {
      email,
      firstName,
      lastName,
      description,
      username,
      language,
      password,
      passwordNew,
    }: UpdateUserInfosArgs,
    @Ctx() context: any,
  ): Promise<UpdateUserInfosResponse> {
    const payload = {
      session_id: context.sessionId,
      email,
      update: {
        'User.first_name': firstName || undefined,
        'User.last_name': lastName || undefined,
        'User.description': description || undefined,
        'User.username': username || undefined,
        'User.language': language || undefined,
        'User.password': passwordNew || undefined,
        'User.password_old': password || undefined,
      },
    }
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'updateUserInfos', payload)
    if (!result.success) throw new Error(result.data)
    return new UpdateUserInfosResponse(result.data)
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
