import { User } from '@entity/User'

import { PublishNameType } from '@/graphql/enum/PublishNameType'

export class PublishNameLogic {
  constructor(private user: User) {}

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
    if (
      [PublishNameType.PUBLISH_NAME_INITIALS, PublishNameType.PUBLISH_NAME_INITIAL_LAST].includes(
        publishNameType,
      )
    ) {
      return this.user.firstName.substring(0, 1)
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
    if (
      [
        PublishNameType.PUBLISH_NAME_LAST,
        PublishNameType.PUBLISH_NAME_INITIAL_LAST,
        PublishNameType.PUBLISH_NAME_FULL,
      ].includes(publishNameType)
    ) {
      return this.user.lastName
    }
    if (
      [PublishNameType.PUBLISH_NAME_FIRST_INITIAL, PublishNameType.PUBLISH_NAME_INITIALS].includes(
        publishNameType,
      )
    ) {
      return this.user.lastName.substring(0, 1)
    }
    return ''
  }
}
