import { User, UserContact } from 'database'
import { v4 as uuidv4 } from 'uuid'

import { PublishNameType } from '@/graphql/enum/PublishNameType'

import { PostUser as HumhubUser } from './PostUser'

const gradidoUuid = uuidv4()
let user: User

// Since NU-024 the publish-name setting steers ONLY account.username -- the key HumHub
// recognises the user by, which must never move underneath an existing account. The
// profile DISPLAY is the alias in every case. That is why every row below expects the same
// firstname while the username still varies.
describe('test creation of a humhub user from db user', () => {
  beforeEach(() => {
    const emailContact = new UserContact()
    emailContact.email = 'john.smith@gradido.de'

    user = new User()
    user.alias = 'alias'
    user.firstName = 'John'
    user.lastName = 'Smith'
    user.emailContact = emailContact
    user.gradidoID = gradidoUuid
  })

  it.each([
    ['alias or initials', PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS, 'alias'],
    ['initials', PublishNameType.PUBLISH_NAME_INITIALS, gradidoUuid],
    ['first name only', PublishNameType.PUBLISH_NAME_FIRST, gradidoUuid],
    ['first name and last name initial', PublishNameType.PUBLISH_NAME_FIRST_INITIAL, gradidoUuid],
    ['full name', PublishNameType.PUBLISH_NAME_FULL, gradidoUuid],
  ])('for %s', (_setting, publishName, username) => {
    user.humhubPublishName = publishName
    const humhubUser = new HumhubUser(user)

    expect(humhubUser.account.username).toBe(username)
    expect(humhubUser.profile.firstname).toBe('alias')
    expect(humhubUser.profile.lastname).toBe('')
  })
})
