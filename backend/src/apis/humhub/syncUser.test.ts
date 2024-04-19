/* eslint-disable @typescript-eslint/no-empty-function */
import { User } from '@entity/User'
import { UserContact } from '@entity/UserContact'

import { CONFIG } from '@/config'

import { HumHubClient } from './HumHubClient'
import { GetUser } from './model/GetUser'
import { syncUser, ExecutedHumhubAction } from './syncUser'

const defaultUser = new User()
defaultUser.emailContact = new UserContact()
defaultUser.emailContact.email = 'email@gmail.com'

CONFIG.HUMHUB_ACTIVE = true
CONFIG.HUMHUB_API_URL = 'http://localhost'

let humhubClient: HumHubClient | undefined
let humhubClientSpy: {
  createUser: jest.SpyInstance
  updateUser: jest.SpyInstance
  deleteUser: jest.SpyInstance
}

describe('syncUser function', () => {
  beforeAll(() => {
    humhubClient = HumHubClient.getInstance()
    if (!humhubClient) {
      throw new Error('error creating humhub client')
    }
    humhubClientSpy = {
      createUser: jest.spyOn(humhubClient, 'createUser'),
      updateUser: jest.spyOn(humhubClient, 'updateUser'),
      deleteUser: jest.spyOn(humhubClient, 'deleteUser'),
    }
    humhubClientSpy.createUser.mockImplementation(() => Promise.resolve())
    humhubClientSpy.updateUser.mockImplementation(() => Promise.resolve())
    humhubClientSpy.deleteUser.mockImplementation(() => Promise.resolve())
  })

  afterEach(() => {
    humhubClientSpy.createUser.mockClear()
    humhubClientSpy.updateUser.mockClear()
    humhubClientSpy.deleteUser.mockClear()
  })
  afterAll(() => {
    jest.resetAllMocks()
  })

  /*
   * Trigger action according to conditions
   * | User exist on humhub | export to humhub allowed | changes in user data | ACTION
   * |      true            |         false            |       ignored        | DELETE
   * |      true            |         true             |        true          | UPDATE
   * |      true            |         true             |        false         | SKIP
   * |      false           |         false            |       ignored        | SKIP
   * |      false           |         true             |       ignored        | CREATE
   * */

  it('When humhubUser exists and user.humhubAllowed is false, should return DELETE action', async () => {
    const humhubUsers = new Map<string, GetUser>()
    humhubUsers.set(defaultUser.emailContact.email, new GetUser(defaultUser, 1))

    defaultUser.humhubAllowed = false
    const result = await syncUser(defaultUser, humhubUsers)

    expect(result).toBe(ExecutedHumhubAction.DELETE)
  })

  it('When humhubUser exists and user.humhubAllowed is true and there are changes in user data, should return UPDATE action', async () => {
    const humhubUsers = new Map<string, GetUser>()
    const humhubUser = new GetUser(defaultUser, 1)
    humhubUser.account.username = 'test username'
    humhubUsers.set(defaultUser.emailContact.email, humhubUser)

    defaultUser.humhubAllowed = true
    const result = await syncUser(defaultUser, humhubUsers)

    expect(result).toBe(ExecutedHumhubAction.UPDATE)
  })

  it('When humhubUser exists and user.humhubAllowed is true and there are no changes in user data, should return SKIP action', async () => {
    const humhubUsers = new Map<string, GetUser>()
    const humhubUser = new GetUser(defaultUser, 1)
    humhubUsers.set(defaultUser.emailContact.email, humhubUser)

    defaultUser.humhubAllowed = true
    const result = await syncUser(defaultUser, humhubUsers)

    expect(result).toBe(ExecutedHumhubAction.SKIP)
  })

  it('When humhubUser not exists and user.humhubAllowed is false, should return SKIP action', async () => {
    const humhubUsers = new Map<string, GetUser>()

    defaultUser.humhubAllowed = false
    const result = await syncUser(defaultUser, humhubUsers)

    expect(result).toBe(ExecutedHumhubAction.SKIP)
  })

  it('When humhubUser not exists and user.humhubAllowed is true, should return CREATE action', async () => {
    const humhubUsers = new Map<string, GetUser>()

    defaultUser.humhubAllowed = true
    const result = await syncUser(defaultUser, humhubUsers)

    expect(result).toBe(ExecutedHumhubAction.CREATE)
  })
})
