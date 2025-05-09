import { User, UserContact } from 'database'

import { GetUser } from './model/GetUser'
import { ExecutedHumhubAction, syncUser } from './syncUser'

jest.mock('@/apis/humhub/HumHubClient')

const defaultUser = new User()
defaultUser.emailContact = new UserContact()
defaultUser.emailContact.email = 'email@gmail.com'

describe('syncUser function', () => {
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
    const humhubUser = new GetUser(defaultUser, 1)
    humhubUsers.set(humhubUser.account.username, humhubUser)

    defaultUser.humhubAllowed = false
    const result = await syncUser(defaultUser, humhubUsers)

    expect(result).toBe(ExecutedHumhubAction.DELETE)
  })

  it('When humhubUser exists and user.humhubAllowed is true and there are changes in user data, should return UPDATE action', async () => {
    const humhubUsers = new Map<string, GetUser>()
    const humhubUser = new GetUser(defaultUser, 1)
    humhubUsers.set(humhubUser.account.username, humhubUser)
    humhubUser.account.username = 'test username'

    defaultUser.humhubAllowed = true
    const result = await syncUser(defaultUser, humhubUsers)

    expect(result).toBe(ExecutedHumhubAction.UPDATE)
  })

  it('When humhubUser exists and user.humhubAllowed is true and there are no changes in user data, should return SKIP action', async () => {
    const humhubUsers = new Map<string, GetUser>()
    const humhubUser = new GetUser(defaultUser, 1)
    humhubUsers.set(humhubUser.account.username, humhubUser)

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
