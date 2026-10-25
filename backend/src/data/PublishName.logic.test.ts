import { User } from 'database'
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

  describe('test isUsernameFromAlias', () => {
    it('for publish name initials', () => {
      expect(logic.isUsernameFromAlias(PublishNameType.PUBLISH_NAME_INITIALS)).toBe(false)
    })
    it('for publish name alias or initials with alias set', () => {
      expect(logic.isUsernameFromAlias(PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS)).toBe(true)
    })
    it('for publish name first', () => {
      expect(logic.isUsernameFromAlias(PublishNameType.PUBLISH_NAME_FIRST)).toBe(false)
    })
    it('for publish name first initial', () => {
      expect(logic.isUsernameFromAlias(PublishNameType.PUBLISH_NAME_FIRST_INITIAL)).toBe(false)
    })
    it('for publish name full', () => {
      expect(logic.isUsernameFromAlias(PublishNameType.PUBLISH_NAME_FULL)).toBe(false)
    })
  })

  describe('test user identifier ', () => {
    it('for alias or initials with alias set', () => {
      expect(logic.getUserIdentifier(PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS)).toBe('alias')
    })
    it('for publish name initials', () => {
      expect(logic.getUserIdentifier(PublishNameType.PUBLISH_NAME_INITIALS)).toBe(gradidoUuid)
    })
    it('for publish name first', () => {
      expect(logic.getUserIdentifier(PublishNameType.PUBLISH_NAME_FIRST)).toBe(gradidoUuid)
    })
    it('for publish name first initial', () => {
      expect(logic.getUserIdentifier(PublishNameType.PUBLISH_NAME_FIRST_INITIAL)).toBe(gradidoUuid)
    })
    it('for publish name full', () => {
      expect(logic.getUserIdentifier(PublishNameType.PUBLISH_NAME_FULL)).toBe(gradidoUuid)
    })
  })
})
