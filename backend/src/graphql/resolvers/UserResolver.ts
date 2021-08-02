// import jwt from 'jsonwebtoken'
import { Resolver, Query, /* Mutation, */ Args, Arg } from 'type-graphql'
import CONFIG from '../../config'
import {
  ChangePasswordResponse,
  CheckUsernameResponse,
  CreateResponse,
  GetUserInfoResponse,
  LoginResponse,
  LoginViaVerificationCode,
  LogoutResponse,
  SendEmailResponse,
  UpdateUserInfosResponse,
} from '../models/User'
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
  async login(@Args() { email, password }: UnsecureLoginArgs): Promise<any> {
    email = email.trim().toLowerCase()
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'unsecureLogin', { email, password })

    // if there is no user, throw an authentication error
    if (!result.success) {
      throw new Error(result.result)
    }

    // temporary solution until we have JWT implemented
    return {
      sessionId: result.result.data.session_id,
      user: {
        email: result.result.data.user.email,
        language: result.result.data.user.language,
        username: result.result.data.user.username,
        firstName: result.result.data.user.first_name,
        lastName: result.result.data.user.last_name,
        description: result.result.data.user.description,
      },
    }

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
  async loginViaEmailVerificationCode(@Arg('optin') optin: string): Promise<any> {
    // I cannot use number as type here.
    // The value received is not the same as sent by the query
    const result = await apiGet(
      CONFIG.LOGIN_API_URL + 'loginViaEmailVerificationCode?emailVerificationCode=' + optin,
    )
    if (result.success)
      return {
        sessionId: result.result.data.session_id,
        email: result.result.data.user.email,
      }
    return result.result
  }

  @Query(() => LogoutResponse)
  async logout(@Arg('sessionId') sessionId: number): Promise<any> {
    const payload = { session_id: sessionId }
    const result = apiPost(CONFIG.LOGIN_API_URL + 'logout', payload);
    return result
  }

  @Query(() => CreateResponse)
  async create(@Args() { email, firstName, lastName, password }: CreateUserArgs): Promise<any> {
    const payload = {
      email,
      first_name: firstName,
      last_name: lastName,
      password,
      emailType: 2,
      login_after_register: true,
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'createUser', payload)
  }

  @Query(() => SendEmailResponse)
  async sendEmail(
    @Args()
    { email, emailText = 7, emailVerificationCodeType = 'resetPassword' }: SendEmailArgs,
  ): Promise<any> {
    const payload = {
      email,
      email_text: emailText,
      email_verification_code_type: emailVerificationCodeType,
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'sendEmail', payload)
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

  @Query(() => ChangePasswordResponse)
  async changePassword(@Args() { sessionId, email, password }: ChangePasswordArgs): Promise<any> {
    const payload = {
      session_id: sessionId,
      email,
      password,
    }
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'resetPassword', payload)
    if (result.success) return result.result.data.state
    return result.result
  }

  @Query(() => UpdateUserInfosResponse)
  async updateUserInfos(
    @Args()
    {
      sessionId,
      email,
      firstName,
      lastName,
      username,
      language,
      password,
      passwordNew,
    }: UpdateUserInfosArgs,
  ): Promise<any> {
    const payload = {
      session_id: sessionId,
      email,
      update: {
        'User.first_name': firstName,
        'User.last_name': lastName,
        // 'User.description': data.description,
        'User.username': username,
        'User.language': language,
        'User.password_old': password,
        'User.password': passwordNew,
      },
    }
    return apiPost(CONFIG.LOGIN_API_URL + 'updateUserInfos', payload)
  }

  @Query(() => CheckUsernameResponse)
  async checkUsername(@Args() { username, groupId = 1 }: CheckUsernameArgs): Promise<any> {
    return apiGet(CONFIG.LOGIN_API_URL + `checkUsername?username=${username}&group_id=${groupId}`)
  }
}
