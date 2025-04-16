import { User } from '@entity/User'
import { v4 as uuidv4 } from 'uuid'

import { PublishNameType } from '@/graphql/enum/PublishNameType'

import { PublishNameLogic } from './PublishName.logic'

const gradidoUuid = uuidv4()
let user: User
let logic: PublishNameLogic

/*
export enum PublishNameType {
  PUBLISH_NAME_ALIAS_OR_INITALS = 0,
  PUBLISH_NAME_INITIALS = 1,
  PUBLISH_NAME_FIRST = 2,
  PUBLISH_NAME_FIRST_INITIAL = 3,
  PUBLISH_NAME_FULL = 4,
}
*/

describe('test publish name logic', () => {
  beforeEach(() => {
    user = new User()
    user.alias = 'alias'
    user.firstName = 'John'
    user.lastName = 'Smith'
    user.gradidoID = gradidoUuid
    logic = new PublishNameLogic(user)
  })
  describe('test unique username', () => {
    it('for alias or initials with alias set', () => {
      expect(logic.getUniqueUsername(PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS)).toBe('alias')
    })
    it('for alias or initials with empty alias', () => {
      user.alias = ''
      expect(logic.getUniqueUsername(PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS)).toBe(
        gradidoUuid,
      )
    })
    it('for publish name initials', () => {
      expect(logic.getUniqueUsername(PublishNameType.PUBLISH_NAME_INITIALS)).toBe(gradidoUuid)
    })
    it('for publish name first', () => {
      expect(logic.getUniqueUsername(PublishNameType.PUBLISH_NAME_FIRST)).toBe(gradidoUuid)
    })
    it('for publish name first initial', () => {
      expect(logic.getUniqueUsername(PublishNameType.PUBLISH_NAME_FIRST_INITIAL)).toBe(gradidoUuid)
    })
    it('for publish name full', () => {
      expect(logic.getUniqueUsername(PublishNameType.PUBLISH_NAME_FULL)).toBe(gradidoUuid)
    })
  })

  describe('test public name', () => {
    it('for alias or initials with alias set', () => {
      expect(logic.getPublicName(PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS)).toBe('alias')
    })
    it('for alias or initials with empty alias', () => {
      user.alias = ''
      expect(logic.getPublicName(PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS)).toBe('JoSm')
    })
    it('for alias or initials with empty alias and lower case written names', () => {
      user.alias = ''
      user.firstName = 'john'
      user.lastName = 'smith'
      expect(logic.getPublicName(PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS)).toBe('JoSm')
    })
    it('for publish name initials', () => {
      expect(logic.getPublicName(PublishNameType.PUBLISH_NAME_INITIALS)).toBe('JoSm')
    })
    it('for publish name initials with lower case written names', () => {
      user.firstName = 'john'
      user.lastName = 'smith'
      expect(logic.getPublicName(PublishNameType.PUBLISH_NAME_INITIALS)).toBe('JoSm')
    })
    it('for publish name first', () => {
      expect(logic.getPublicName(PublishNameType.PUBLISH_NAME_FIRST)).toBe('John')
    })
    it('for publish name first initial', () => {
      expect(logic.getPublicName(PublishNameType.PUBLISH_NAME_FIRST_INITIAL)).toBe('John S')
    })
    it('for publish name full', () => {
      expect(logic.getPublicName(PublishNameType.PUBLISH_NAME_FULL)).toBe('John Smith')
    })
  })
})
