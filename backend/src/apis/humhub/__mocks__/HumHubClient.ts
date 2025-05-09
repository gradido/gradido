import { User, UserContact } from 'database'
import { IRestResponse } from 'typed-rest-client'

import { GetUser } from '@/apis/humhub/model/GetUser'
import { PostUser } from '@/apis/humhub/model/PostUser'
import { UsersResponse } from '@/apis/humhub/model/UsersResponse'

/**
 * HumHubClient as singleton class
 */
export class HumHubClient {
  private static instance: HumHubClient

  private constructor() {}

  public static getInstance(): HumHubClient {
    if (!HumHubClient.instance) {
      HumHubClient.instance = new HumHubClient()
    }
    return HumHubClient.instance
  }

  public async users(): Promise<UsersResponse | null> {
    return Promise.resolve(new UsersResponse())
  }

  public async userByEmail(email: string): Promise<GetUser | null> {
    const user = new User()
    user.emailContact = new UserContact()
    user.emailContact.email = email
    return Promise.resolve(new GetUser(user, 1))
  }

  public async userByEmailAsync(email: string): Promise<IRestResponse<GetUser>> {
    const user = new User()
    user.emailContact = new UserContact()
    user.emailContact.email = email
    return Promise.resolve({
      statusCode: 200,
      result: new GetUser(user, 1),
      headers: {},
    })
  }

  public async userByUsername(username: string): Promise<GetUser | null> {
    const user = new User()
    user.alias = username
    user.emailContact = new UserContact()
    user.emailContact.email = 'testemail@gmail.com'
    return Promise.resolve(new GetUser(user, 1))
  }

  public async createUser(): Promise<void> {
    return Promise.resolve()
  }

  public async updateUser(inputUser: PostUser, humhubUserId: number): Promise<GetUser | null> {
    const user = new User()
    user.emailContact = new UserContact()
    user.emailContact.email = inputUser.account.email
    return Promise.resolve(new GetUser(user, humhubUserId))
  }

  public async deleteUser(): Promise<void> {
    return Promise.resolve()
  }
}
