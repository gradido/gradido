import { User } from '@entity/User'

import { PublishNameType } from '@/graphql/enum/PublishNameType'
import { LogError } from '@/server/LogError'

export class PublishNameLogic {
  constructor(private user: User) {}

  private firstUpperCaseSecondLowerCase(substring: string) {
    if (!substring || substring.length < 2) {
      throw new LogError('substring is to small, it need at least two characters', { substring })
    }
    return substring.charAt(0).toUpperCase() + substring.charAt(1).toLocaleLowerCase()
  }

  /**
   * get first name based on publishNameType: PublishNameType value
   * @param publishNameType
   * @returns user.firstName for PUBLISH_NAME_FIRST, PUBLISH_NAME_FIRST_INITIAL or PUBLISH_NAME_FULL
   */
  public getFirstName(publishNameType: PublishNameType): string {
    return [
      PublishNameType.PUBLISH_NAME_FIRST,
      PublishNameType.PUBLISH_NAME_FIRST_INITIAL,
      PublishNameType.PUBLISH_NAME_FULL,
    ].includes(publishNameType)
      ? this.user.firstName
      : ''
  }

  /**
   * get last name based on publishNameType: GmsPublishNameType value
   * @param publishNameType
   * @returns user.lastName for PUBLISH_NAME_LAST, PUBLISH_NAME_FULL
   *   first initial from user.lastName for PUBLISH_NAME_FIRST_INITIAL
   */
  public getLastName(publishNameType: PublishNameType): string {
    return publishNameType === PublishNameType.PUBLISH_NAME_FULL
      ? this.user.lastName
      : publishNameType === PublishNameType.PUBLISH_NAME_FIRST_INITIAL
      ? this.user.lastName.charAt(0)
      : ''
  }

  /**
   * get username from user.alias for PUBLISH_NAME_ALIAS_OR_INITALS and if user has alias
   * get first name first two characters and last name first two characters for PUBLISH_NAME_ALIAS_OR_INITALS
   * if no alias or PUBLISH_NAME_INITIALS
   * @param publishNameType
   * @returns user.alias for publishNameType = PUBLISH_NAME_ALIAS_OR_INITALS and user has alias
   *   else return user.firstName[0,2] + user.lastName[0,2] for publishNameType = [PUBLISH_NAME_ALIAS_OR_INITALS, PUBLISH_NAME_INITIALS]
   */
  public getUsername(publishNameType: PublishNameType): string {
    if (
      [
        PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS,
        PublishNameType.PUBLISH_NAME_INITIALS,
      ].includes(publishNameType)
    ) {
      return publishNameType === PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS && this.user.alias
        ? this.user.alias
        : this.firstUpperCaseSecondLowerCase(this.user.firstName) +
            this.firstUpperCaseSecondLowerCase(this.user.lastName)
    }
    return this.user.alias ? this.user.alias : this.user.gradidoID
  }
}
