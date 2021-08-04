// import jwt from 'jsonwebtoken'
import { Resolver, Query, Args, Arg } from 'type-graphql'
import CONFIG from '../../config'
import { CheckUsernameResponse } from '../models/CheckUsernameResponse'
import { GetUserInfoResponse } from '../models/UserInfoData'
import { LoginResponse } from '../models/LoginResponse'
import { LoginViaVerificationCode } from '../models/LoginViaVerificationCode'
import { SendPasswordResetEmailResponse } from '../models/SendPasswordResetEmailResponse'
import { UpdateUserInfosResponse } from '../models/UpdateUserInfosResponse'
import {
  ChangePasswordArgs,
  CheckUsernameArgs,
  CreateUserArgs,
  GetUserInfoArgs,
  UnsecureLoginArgs,
  UpdateUserInfosArgs,
} from '../inputs/LoginUserInput'
import { apiPost, apiGet } from '../../apis/loginAPI'

@Resolver()
export class UserResolver {
  @Query(() => LoginResponse)
  async login(@Args() { email, password }: UnsecureLoginArgs): Promise<LoginResponse> {
    email = email.trim().toLowerCase()
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'unsecureLogin', { email, password })

    // if there is no user, throw an authentication error
    if (!result.success) {
      throw new Error(result.data)
    }

    // temporary solution until we have JWT implemented
    return new LoginResponse(result.data)

    // create and return the json web token
    // The expire doesn't help us here. The client needs to track when the token expires on its own,
    // since every action prolongs the time the session is valid.
    /*
    return jwt.sign(
      { result, role: 'todo' },
      CONFIG.JWT_SECRET, // * , { expiresIn: CONFIG.JWT_EXPIRES_IN } ,
    )
    */
    // return (await apiPost(CONFIG.LOGIN_API_URL + 'unsecureLogin', login)).result.data
    // const loginResult: LoginResult = await loginAPI.login(data)
    // return loginResult.user ? loginResult.user : new User()
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

  @Query(() => String)
  async logout(@Arg('sessionId') sessionId: number): Promise<string> {
    const payload = { session_id: sessionId }
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'logout', payload)
    if (!result.success) {
      throw new Error(result.data)
    }
    return 'success'
  }

  @Query(() => String)
  async create(@Args() { email, firstName, lastName, password }: CreateUserArgs): Promise<string> {
    const payload = {
      email,
      first_name: firstName,
      last_name: lastName,
      password,
      emailType: 2,
      login_after_register: true,
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
    if (!response.success) throw new Error(response.data)
    return new SendPasswordResetEmailResponse(response.data)
  }

  @Query(() => GetUserInfoResponse)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserInfos(@Args() { sessionId, email }: GetUserInfoArgs): Promise<any> {
    const payload = {
      session_id: sessionId,
      email: email,
      ask: ['user.first_name', 'user.last_name'],
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'getUserInfos', payload)
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
    if (!result.success) throw new Error(result.data)
    return 'sucess'
  }

  @Query(() => UpdateUserInfosResponse)
  async updateUserInfos(
    @Args()
    {
      sessionId,
      email,
      firstName,
      lastName,
      description,
      username,
      language,
      password,
      passwordNew,
    }: UpdateUserInfosArgs,
  ): Promise<UpdateUserInfosResponse> {
    const payload = {
      session_id: sessionId,
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
}
