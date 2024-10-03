import { User } from '@entity/User'

import { PublishNameType } from '@/graphql/enum/PublishNameType'
import { LogError } from '@/server/LogError'

export class PublishNameLogic {
  constructor(private user: User) {}

  private firstUpperCaseSecondLowerCase(substring: string) {
    if(substring.length != 2) {
      throw new LogError("substring hasn't expected length of 2")
    }
    return substring.charAt(0).toUpperCase() + substring.charAt(1).toLocaleLowerCase()
  }

  /**
   * get first name based on publishNameType: PublishNameType value
   * @param publishNameType
   * @returns user.firstName for PUBLISH_NAME_FIRST, PUBLISH_NAME_FIRST_INITIAL or PUBLISH_NAME_FULL
   *   first initial from user.firstName for PUBLISH_NAME_INITIALS or PUBLISH_NAME_INITIAL_LAST
   */
  public getFirstName(publishNameType: PublishNameType): string {
    if (
      [
        PublishNameType.PUBLISH_NAME_FIRST,
        PublishNameType.PUBLISH_NAME_FIRST_INITIAL,
        PublishNameType.PUBLISH_NAME_FULL,
      ].includes(publishNameType)
    ) {
      return this.user.firstName
    }
    if (PublishNameType.PUBLISH_NAME_INITIALS === publishNameType) {
      return this.user.firstName.substring(0, 1)
    }
    if (PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS === publishNameType) {
      if (this.user.alias) {
        return this.user.alias
      } else {
        return this.firstUpperCaseSecondLowerCase(this.user.firstName.substring(0, 2))
      }
    }
    return ''
  }

  /**
   * get last name based on publishNameType: GmsPublishNameType value
   * @param publishNameType
   * @returns user.lastName for PUBLISH_NAME_LAST, PUBLISH_NAME_INITIAL_LAST, PUBLISH_NAME_FULL
   *   first initial from user.lastName for PUBLISH_NAME_FIRST_INITIAL, PUBLISH_NAME_INITIALS
   */
  public getLastName(publishNameType: PublishNameType): string {
    if (PublishNameType.PUBLISH_NAME_FULL === publishNameType) {
      return this.user.lastName
    } else if (
      [PublishNameType.PUBLISH_NAME_FIRST_INITIAL, PublishNameType.PUBLISH_NAME_INITIALS].includes(
        publishNameType,
      )
    ) {
      return this.user.lastName.substring(0, 1)
    } else if (
      PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS === publishNameType &&
      !this.user.alias
    ) {
      return this.firstUpperCaseSecondLowerCase(this.user.lastName.substring(0, 2))
    }

    return ''
  }
}
