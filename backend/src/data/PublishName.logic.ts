import { User } from 'database'
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
   * get unique username
   * @param publishNameType
   * @return when alias if exist and publishNameType = [PUBLISH_NAME_ALIAS_OR_INITALS, PUBLISH_NAME_INITIALS]
   * return alias
   * else return gradido id
   */
  public getUserIdentifier(publishNameType: PublishNameType): string {
    return this.isUsernameFromAlias(publishNameType)
      ? this.getUsernameFromAlias()
      : this.user.gradidoID
  }

  /**
   * get public name based on publishNameType: PublishNameType value
   * @param publishNameType: PublishNameType
   * @return alias if exist and type = PUBLISH_NAME_ALIAS_OR_INITALS
   *         initials if type = PUBLISH_NAME_INITIALS
   *         full first name if type = PUBLISH_NAME_FIRST
   *         full first name and last name initial if type = PUBLISH_NAME_FIRST_INITIAL
   *         full first name and full last name if type = PUBLISH_NAME_FULL
   */
  public getPublicName(publishNameType: PublishNameType): string {
    return this.isUsernameFromAlias(publishNameType)
      ? this.getUsernameFromAlias()
      : this.isUsernameFromInitials(publishNameType)
        ? this.getUsernameFromInitials()
        : (this.getFirstName(publishNameType) + ' ' + this.getLastName(publishNameType)).trim()
  }

  public getUsernameFromInitials(): string {
    return (
      this.firstUpperCaseSecondLowerCase(this.user.firstName) +
      this.firstUpperCaseSecondLowerCase(this.user.lastName)
    ).trim()
  }

  public getUsernameFromAlias(): string {
    return this.filterOutInvalidChar(this.user.alias)
  }

  public isUsernameFromInitials(publishNameType: PublishNameType): boolean {
    return (
      PublishNameType.PUBLISH_NAME_INITIALS === publishNameType ||
      (PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS === publishNameType && !this.hasAlias())
    )
  }

  public isUsernameFromAlias(publishNameType: PublishNameType): boolean {
    return PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS === publishNameType && this.hasAlias()
  }
}
