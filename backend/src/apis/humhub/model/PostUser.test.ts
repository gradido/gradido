import { User, UserContact } from 'database'
import { v4 as uuidv4 } from 'uuid'

import { PublishNameType } from '@/graphql/enum/PublishNameType'

import { PostUser as HumhubUser } from './PostUser'

const gradidoUuid = uuidv4()
let user: User

/*
export enum PublishNameType {
  PUBLISH_NAME_ALIAS_OR_INITALS = 0,
  PUBLISH_NAME_INITIALS = 1,
  PUBLISH_NAME_FIRST = 2,
  PUBLISH_NAME_FIRST_INITIAL = 3,
  PUBLISH_NAME_FULL = 4,
}
*/

// Since NU-024 the publish-name setting steers ONLY account.username -- the key HumHub
// recognises the user by, which must never move underneath an existing account. The
// profile DISPLAY is the alias in every case (the full gradidoID without one). That is
// why every block below expects the same firstname while the username still varies.
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

  describe('for alias or initials', () => {
    it('with alias set', () => {
      user.humhubPublishName = PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS
      const humhubUser = new HumhubUser(user)

      expect(humhubUser.account.username).toBe('alias')
      expect(humhubUser.profile.firstname).toBe('alias')
      expect(humhubUser.profile.lastname).toBe('')
    })

    it('with empty alias', () => {
      user.alias = ''
      user.humhubPublishName = PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS
      const humhubUser = new HumhubUser(user)

      expect(humhubUser.account.username).toBe(gradidoUuid)
      expect(humhubUser.profile.firstname).toBe(gradidoUuid)
      expect(humhubUser.profile.lastname).toBe('')
    })
  })

  describe('for initials', () => {
    it('with alias set', () => {
      user.humhubPublishName = PublishNameType.PUBLISH_NAME_INITIALS
      const humhubUser = new HumhubUser(user)

      expect(humhubUser.account.username).toBe(gradidoUuid)
      expect(humhubUser.profile.firstname).toBe('alias')
      expect(humhubUser.profile.lastname).toBe('')
    })

    it('with empty alias', () => {
      user.alias = ''
      user.humhubPublishName = PublishNameType.PUBLISH_NAME_INITIALS
      const humhubUser = new HumhubUser(user)

      expect(humhubUser.account.username).toBe(gradidoUuid)
      expect(humhubUser.profile.firstname).toBe(gradidoUuid)
      expect(humhubUser.profile.lastname).toBe('')
    })
  })

  describe('for first name only', () => {
    it('with alias set', () => {
      user.humhubPublishName = PublishNameType.PUBLISH_NAME_FIRST
      const humhubUser = new HumhubUser(user)

      expect(humhubUser.account.username).toBe(gradidoUuid)
      expect(humhubUser.profile.firstname).toBe('alias')
      expect(humhubUser.profile.lastname).toBe('')
    })

    it('with empty alias', () => {
      user.alias = ''
      user.humhubPublishName = PublishNameType.PUBLISH_NAME_FIRST
      const humhubUser = new HumhubUser(user)

      expect(humhubUser.account.username).toBe(gradidoUuid)
      expect(humhubUser.profile.firstname).toBe(gradidoUuid)
      expect(humhubUser.profile.lastname).toBe('')
    })
  })

  describe('for first name and last name initial', () => {
    it('with alias set', () => {
      user.humhubPublishName = PublishNameType.PUBLISH_NAME_FIRST_INITIAL
      const humhubUser = new HumhubUser(user)

      expect(humhubUser.account.username).toBe(gradidoUuid)
      expect(humhubUser.profile.firstname).toBe('alias')
      expect(humhubUser.profile.lastname).toBe('')
    })

    it('with empty alias', () => {
      user.alias = ''
      user.humhubPublishName = PublishNameType.PUBLISH_NAME_FIRST_INITIAL
      const humhubUser = new HumhubUser(user)

      expect(humhubUser.account.username).toBe(gradidoUuid)
      expect(humhubUser.profile.firstname).toBe(gradidoUuid)
      expect(humhubUser.profile.lastname).toBe('')
    })
  })

  describe('for full name', () => {
    it('with alias set', () => {
      user.humhubPublishName = PublishNameType.PUBLISH_NAME_FULL
      const humhubUser = new HumhubUser(user)

      expect(humhubUser.account.username).toBe(gradidoUuid)
      expect(humhubUser.profile.firstname).toBe('alias')
      expect(humhubUser.profile.lastname).toBe('')
    })

    it('with empty alias', () => {
      user.alias = ''
      user.humhubPublishName = PublishNameType.PUBLISH_NAME_FULL
      const humhubUser = new HumhubUser(user)

      expect(humhubUser.account.username).toBe(gradidoUuid)
      expect(humhubUser.profile.firstname).toBe(gradidoUuid)
      expect(humhubUser.profile.lastname).toBe('')
    })
  })
})
