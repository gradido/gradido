import { SignJWT } from 'jose'
import { IRequestOptions, IRestResponse, RestClient } from 'typed-rest-client'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { PostUserLoggingView } from './logging/PostUserLogging.view'
import { GetUser } from './model/GetUser'
import { PostUser } from './model/PostUser'
import { UsersResponse } from './model/UsersResponse'

/**
 * HumHubClient as singleton class
 */
export class HumHubClient {
  // eslint-disable-next-line no-use-before-define
  private static instance: HumHubClient
  private restClient: RestClient

  // eslint-disable-next-line no-useless-constructor, @typescript-eslint/no-empty-function
  private constructor() {
    this.restClient = new RestClient('gradido-backend', CONFIG.HUMHUB_API_URL)
    logger.info('create rest client for', CONFIG.HUMHUB_API_URL)
  }

  public static getInstance(): HumHubClient | undefined {
    if (!CONFIG.HUMHUB_ACTIVE || !CONFIG.HUMHUB_API_URL) {
      logger.info(`humhub are disabled via config...`)
      return
    }
    if (!HumHubClient.instance) {
      HumHubClient.instance = new HumHubClient()
    }
    return HumHubClient.instance
  }

  protected async createRequestOptions(
    queryParams?: Record<string, string | number | (string | number)[]>,
  ): Promise<IRequestOptions> {
    const requestOptions: IRequestOptions = {
      additionalHeaders: { authorization: 'Bearer ' + (await this.createJWTToken()) },
    }
    if (queryParams) {
      requestOptions.queryParameters = { params: queryParams }
    }
    return requestOptions
  }

  private async createJWTToken(): Promise<string> {
    const secret = new TextEncoder().encode(CONFIG.HUMHUB_JWT_KEY)
    const token = await new SignJWT({ 'urn:gradido:claim': true, uid: 1 })
      .setProtectedHeader({ alg: 'HS512' })
      .setIssuedAt()
      .setIssuer('urn:gradido:issuer')
      .setAudience('urn:gradido:audience')
      .setExpirationTime('5m')
      .sign(secret)
    return token
  }

  public async createAutoLoginUrl(username: string) {
    const secret = new TextEncoder().encode(CONFIG.HUMHUB_JWT_KEY)
    logger.info(`user ${username} as username for humhub auto-login`)
    const token = await new SignJWT({ username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2m')
      .sign(secret)

    return `${CONFIG.HUMHUB_API_URL}user/auth/external?authclient=jwt&jwt=${token}`
  }

  /**
   * Get all users from humhub
   * https://marketplace.humhub.com/module/rest/docs/html/user.html#tag/User/paths/~1user/get
   * @param page The number of page of the result set >= 0
   * @param limit The numbers of items to return per page, Default: 20, [1 .. 50]
   * @returns list of users
   */
  public async users(page = 0, limit = 20): Promise<UsersResponse | null> {
    const options = await this.createRequestOptions({ page, limit })
    const response = await this.restClient.get<UsersResponse>('/api/v1/user', options)
    if (response.statusCode !== 200) {
      throw new LogError('error requesting users from humhub', response)
    }
    return response.result
  }

  /**
   * get user by email
   * https://marketplace.humhub.com/module/rest/docs/html/user.html#tag/User/paths/~1user~1get-by-email/get
   * @param email for user search
   * @returns user object if found
   */
  public async userByEmail(email: string): Promise<GetUser | null> {
    const options = await this.createRequestOptions({ email })
    const response = await this.restClient.get<GetUser>('/api/v1/user/get-by-email', options)
    // 404 = user not found
    if (response.statusCode === 404) {
      return null
    }
    return response.result
  }

  public async userByEmailAsync(email: string): Promise<IRestResponse<GetUser>> {
    const options = await this.createRequestOptions({ email })
    return this.restClient.get<GetUser>('/api/v1/user/get-by-email', options)
  }

  public async userByUsernameAsync(username: string): Promise<IRestResponse<GetUser>> {
    const options = await this.createRequestOptions({ username })
    return this.restClient.get<GetUser>('/api/v1/user/get-by-username', options)
  }

  /**
   * get user by username
   * https://marketplace.humhub.com/module/rest/docs/html/user.html#tag/User/paths/~1user~1get-by-username/get
   * @param username for user search
   * @returns user object if found
   */
  public async userByUsername(username: string): Promise<GetUser | null> {
    const options = await this.createRequestOptions({ username })
    const response = await this.restClient.get<GetUser>('/api/v1/user/get-by-username', options)
    if (response.statusCode === 404) {
      return null
    }
    return response.result
  }

  /**
   * create user
   * https://marketplace.humhub.com/module/rest/docs/html/user.html#tag/User/paths/~1user/post
   * @param user for saving on humhub instance
   */
  public async createUser(user: PostUser): Promise<void> {
    logger.info('create new humhub user', new PostUserLoggingView(user))
    const options = await this.createRequestOptions()
    try {
      const response = await this.restClient.create('/api/v1/user', user, options)
      if (response.statusCode !== 200) {
        throw new LogError('error creating user on humhub', { user, response })
      }
    } catch (error) {
      throw new LogError('error on creating new user', {
        user,
        error: JSON.stringify(error, null, 2),
      })
    }
  }

  /**
   * update user
   * https://marketplace.humhub.com/module/rest/docs/html/user.html#tag/User/operation/updateUser
   * @param user user object to update
   * @param humhubUserId humhub user id
   * @returns updated user object on success
   */
  public async updateUser(user: PostUser, humhubUserId: number): Promise<GetUser | null> {
    logger.info('update humhub user', new PostUserLoggingView(user))
    const options = await this.createRequestOptions()
    const response = await this.restClient.update<GetUser>(
      `/api/v1/user/${humhubUserId}`,
      user,
      options,
    )
    if (response.statusCode === 400) {
      throw new LogError('Invalid user supplied', { user, response })
    } else if (response.statusCode === 404) {
      throw new LogError('User not found', { user, response })
    }
    return response.result
  }

  public async deleteUser(humhubUserId: number): Promise<void> {
    logger.info('delete humhub user', { userId: humhubUserId })
    const options = await this.createRequestOptions()
    const response = await this.restClient.del(`/api/v1/user/${humhubUserId}`, options)
    if (response.statusCode === 400) {
      throw new LogError('invalid user supplied', { userId: humhubUserId, response })
    } else if (response.statusCode === 404) {
      throw new LogError('User not found', { userId: humhubUserId, response })
    } else if (response.statusCode !== 200) {
      throw new LogError('error deleting user', { userId: humhubUserId, response })
    }
  }
}

// new RestClient('gradido', 'api/v1/')
