import { User } from '@entity/User'
import { UserContact } from '@entity/UserContact'
import { IRestResponse } from 'typed-rest-client'

import { GetUser } from '@/apis/humhub/model/GetUser'
import { PostUser } from '@/apis/humhub/model/PostUser'
import { UsersResponse } from '@/apis/humhub/model/UsersResponse'

function createUserWithEmail(email: string): User {
  const user = new User()
  const userContact = new UserContact()
  userContact.isPrimary = true
  userContact.email = email
  user.userContacts = [userContact]
  return user
}

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
    return Promise.resolve(new GetUser(createUserWithEmail(email), 1))
  }

  public async userByEmailAsync(email: string): Promise<IRestResponse<GetUser>> {
    return Promise.resolve({
      statusCode: 200,
      result: new GetUser(createUserWithEmail(email), 1),
      headers: {},
    })
  }

  public async userByUsername(username: string): Promise<GetUser | null> {
    const user = createUserWithEmail('testemail@gmail.com')
    user.alias = username
    return Promise.resolve(new GetUser(user, 1))
  }

  public async createUser(): Promise<void> {
    return Promise.resolve()
  }

  public async updateUser(inputUser: PostUser, humhubUserId: number): Promise<GetUser | null> {
    return Promise.resolve(new GetUser(createUserWithEmail(inputUser.account.email), humhubUserId))
  }

  public async deleteUser(): Promise<void> {
    return Promise.resolve()
  }
}
