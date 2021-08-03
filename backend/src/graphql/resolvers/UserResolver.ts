// import jwt from 'jsonwebtoken'
import { Resolver, Query, /* Mutation, */ Args, Arg, Field } from 'type-graphql'
import CONFIG from '../../config'
import { ResetPasswordResponse } from '../models/ResetPasswordResponse'
import { CheckUsernameResponse } from '../models/CheckUsernameResponse'
import { CreateResponse } from '../models/CreateResponse'
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
  SendEmailArgs,
  UnsecureLoginArgs,
  UpdateUserInfosArgs,
} from '../inputs/LoginUserInput'
import { apiPost, apiGet } from '../../apis/loginAPI'

@Resolver()
export class UserResolver {
  @Query(() => LoginResponse)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  @Query(() => CreateResponse)
  async create(
    @Args() { email, firstName, lastName, password }: CreateUserArgs,
  ): Promise<CreateResponse> {
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
    return new CreateResponse(result.data)
  }

  // TODO
  @Query(() => SendPasswordResetEmailResponse)
  async sendResetPasswordEmail(
    @Args()
    { email, emailText = 7, emailVerificationCodeType = 'resetPassword' }: SendEmailArgs,
  ): Promise<SendPasswordResetEmailResponse> {
    const payload = {
      email,
      email_text: emailText,
      email_verification_code_type: emailVerificationCodeType,
    }
    const response = await apiPost(CONFIG.LOGIN_API_URL + 'sendEmail', payload)
    if (!response.success) throw new Error(response.data)
    return new SendPasswordResetEmailResponse(response.data)
  }

  @Query(() => GetUserInfoResponse)
  async getUserInfos(@Args() { sessionId, email }: GetUserInfoArgs): Promise<any> {
    const payload = {
      session_id: sessionId,
      email: email,
      ask: ['user.first_name', 'user.last_name'],
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'getUserInfos', payload)
  }

  @Query(() => ResetPasswordResponse)
  async resetPassword(
    @Args()
    { sessionId, email, password }: ChangePasswordArgs,
  ): Promise<ResetPasswordResponse> {
    const payload = {
      session_id: sessionId,
      email,
      password,
    }
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'resetPassword', payload)
    if (!result.success) throw new Error(result.data)
    return new ResetPasswordResponse(result.data)
  }

  @Query(() => UpdateUserInfosResponse)
  async updateUserInfos(
    @Args()
    {
      sessionId,
      email,
      firstName = '',
      lastName = '',
      username = '',
      language = '',
      password = '',
      passwordNew = '',
    }: UpdateUserInfosArgs,
  ): Promise<UpdateUserInfosResponse> {
    const payload = {
      session_id: sessionId,
      email,
      update: {
        'User.first_name': firstName.length > 0 ? firstName : undefined,
        'User.last_name': lastName.length > 0 ? lastName : undefined,
        'User.username': username.length > 0 ? username : undefined,
        'User.language': language.length > 0 ? language : undefined,
        'User.password': passwordNew.length > 0 ? passwordNew : undefined,
        'User.password_old': password.length > 0 ? password : undefined,
      },
    }
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'updateUserInfos', payload)
    if (!result.success) throw new Error(result.data)
    return new UpdateUserInfosResponse(result.data)
  }

  // TODO
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
