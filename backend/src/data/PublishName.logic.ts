import { User } from '@entity/User'
import XRegExp from 'xregexp'

import { PublishNameType } from '@/graphql/enum/PublishNameType'

export class PublishNameLogic {
  // allowed characters for humhub usernames
  private usernameRegex: RegExp = XRegExp('[\\p{L}\\d_\\-@\\.]', 'g')

  constructor(private user: User) {}

  private firstUpperCaseSecondLowerCase(name: string) {
    if (name && name.length >= 2) {
      return name.charAt(0).toUpperCase() + name.charAt(1).toLocaleLowerCase()
    }
    return name
  }

  // remove character which are invalid for humhub username
  private filterOutInvalidChar(name: string) {
    // eslint-disable-next-line import/no-named-as-default-member
    return XRegExp.match(name, this.usernameRegex, 'all').join('')
  }

  public hasAlias(): boolean {
    if (this.user.alias && this.user.alias.length >= 3) {
      return true
    }
    return false
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
  public getUsername(): string {
    const publishNameType = this.user.humhubPublishName as PublishNameType
    if (
      [
        PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS,
        PublishNameType.PUBLISH_NAME_INITIALS,
      ].includes(publishNameType)
    ) {
      return publishNameType === PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS && this.hasAlias()
        ? this.filterOutInvalidChar(this.user.alias)
        : this.firstUpperCaseSecondLowerCase(this.filterOutInvalidChar(this.user.firstName)) +
            this.firstUpperCaseSecondLowerCase(this.filterOutInvalidChar(this.user.lastName))
    }
    return this.hasAlias() ? this.user.alias : this.user.gradidoID
  }
}
