import { User } from '@entity/User'

import { PublishNameType } from '@/graphql/enum/PublishNameType'

import { PublishNameLogic } from './PublishName.logic'

describe('test publish name logic', () => {
  describe('test username', () => {
    it('alias or initials with alias set', () => {
      const user = new User()
      user.alias = 'alias'
      const logic = new PublishNameLogic(user)
      expect(logic.getUsername(PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS)).toBe(user.alias)
    })
    it('alias or initials with empty alias', () => {
      const user = new User()
      user.firstName = 'John'
      user.lastName = 'Smith'
      const logic = new PublishNameLogic(user)
      expect(logic.getUsername(PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS)).toBe('JoSm')
    })
  })
})
