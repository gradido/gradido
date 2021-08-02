// import jwt from 'jsonwebtoken'
import { Resolver, Query, /* Mutation, */ Args, Arg } from 'type-graphql'
import CONFIG from '../../config'
import { LoginResponse, LoginViaVerificationCode } from '../models/User'
import { UnsecureLoginArgs, ChangePasswordArgs } from '../inputs/LoginUserInput'
import { apiPost, apiGet } from '../../apis/loginAPI'

@Resolver()
export class UserResolver {
  /* @Query(() => [User])
  users(): Promise<User[]> {
    return User.find()
  } */

  /* @Query(() => User)
  user(@Arg('id') id: string): Promise<User | undefined> {
    return User.findOne({ where: { id } })
  } */

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

  // forgot password request
  @Query(() => String)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendEmail(@Arg('email') email: string): Promise<any> {
    const payload = {
      email,
      email_text: 7,
      email_verification_code_type: 'resetPassword',
    }
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'sendEmail', payload)
    if (result.success) return result.result.data.state
    return result.result
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

  @Query(() => String)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async changePassword(@Args() { sessionId, email, password }: ChangePasswordArgs): Promise<any> {
    const payload = {
      session_id: sessionId,
      email,
      password,
    }
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'resetPassword', payload)
    console.log(result)
    if (result.success) return result.result.data.state
    return result.result
  }
}
