import { User } from '@entity/User'
import { UserContact } from '@entity/UserContact'

import { GetUser } from '@/apis/humhub/model/GetUser'
import { PostUser } from '@/apis/humhub/model/PostUser'
import { UsersResponse } from '@/apis/humhub/model/UsersResponse'

/**
 * HumHubClient as singleton class
 */
export class HumHubClient {
  // eslint-disable-next-line no-use-before-define
  private static instance: HumHubClient

  // eslint-disable-next-line no-useless-constructor, @typescript-eslint/no-empty-function
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
