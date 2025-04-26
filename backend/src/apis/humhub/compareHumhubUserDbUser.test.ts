import { communityDbUser } from '@/util/communityUser'

import { isHumhubUserIdenticalToDbUser } from './compareHumhubUserDbUser'
import { GetUser } from './model/GetUser'

const defaultUser = communityDbUser

describe('isHumhubUserIdenticalToDbUser', () => {
  beforeEach(() => {
    defaultUser.firstName = 'first name'
    defaultUser.lastName = 'last name'
    defaultUser.alias = 'alias'
    defaultUser.emailContact.email = 'email@gmail.com'
    defaultUser.language = 'en'
  })

  it('Should return true because humhubUser was created from entity user', () => {
    const humhubUser = new GetUser(defaultUser, 1)
    const result = isHumhubUserIdenticalToDbUser(humhubUser, defaultUser)
    expect(result).toBe(true)
  })

  it('Should return false because first name differ', () => {
    const humhubUser = new GetUser(defaultUser, 1)
    humhubUser.profile.firstname = 'changed first name'
    const result = isHumhubUserIdenticalToDbUser(humhubUser, defaultUser)
    expect(result).toBe(false)
  })
  it('Should return false because last name differ', () => {
    const humhubUser = new GetUser(defaultUser, 1)
    humhubUser.profile.lastname = 'changed last name'
    const result = isHumhubUserIdenticalToDbUser(humhubUser, defaultUser)
    expect(result).toBe(false)
  })
  it('Should return false because username differ', () => {
    const humhubUser = new GetUser(defaultUser, 1)
    humhubUser.account.username = 'changed username'
    const result = isHumhubUserIdenticalToDbUser(humhubUser, defaultUser)
    expect(result).toBe(false)
  })

  it('Should return false because email differ', () => {
    const humhubUser = new GetUser(defaultUser, 1)
    humhubUser.account.email = 'new@gmail.com'
    const result = isHumhubUserIdenticalToDbUser(humhubUser, defaultUser)
    expect(result).toBe(false)
  })

  it('Should return false because language differ', () => {
    const humhubUser = new GetUser(defaultUser, 1)
    humhubUser.account.language = 'de'
    const result = isHumhubUserIdenticalToDbUser(humhubUser, defaultUser)
    expect(result).toBe(false)
  })

  it('Should return false because gradido_address differ', () => {
    const humhubUser = new GetUser(defaultUser, 1)

    humhubUser.profile.gradido_address = 'changed gradido address'
    const result = isHumhubUserIdenticalToDbUser(humhubUser, defaultUser)
    expect(result).toBe(false)
  })
})
