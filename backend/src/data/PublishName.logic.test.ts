import { User } from '@entity/User'

import { PublishNameType } from '@/graphql/enum/PublishNameType'

import { PublishNameLogic } from './PublishName.logic'

describe('test publish name logic', () => {
  describe('test username', () => {
    it('alias or initials with alias set', () => {
      const user = new User()
      user.alias = 'alias'
      user.humhubPublishName = PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS
      const logic = new PublishNameLogic(user)
      expect(logic.getUsername()).toBe(user.alias)
    })
    it('alias or initials with empty alias', () => {
      const user = new User()
      user.firstName = 'John'
      user.lastName = 'Smith'
      user.humhubPublishName = PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS
      const logic = new PublishNameLogic(user)
      expect(logic.getUsername()).toBe('JoSm')
    })
  })
})
