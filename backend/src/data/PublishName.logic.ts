import { User } from '@entity/User'

import { GmsPublishNameType } from '@/graphql/enum/GmsPublishNameType';

export class PublishNameLogic {
  constructor(private user: User) {}

  /**
   * get first name based on publishNameType: GmsPublishNameType value
   * @param publishNameType
   * @returns user.firstName for GMS_PUBLISH_NAME_FIRST, GMS_PUBLISH_NAME_FIRST_INITIAL or GMS_PUBLISH_NAME_FULL
   *   first initial from user.firstName for GMS_PUBLISH_NAME_INITIALS or GMS_PUBLISH_NAME_ALIAS_OR_INITALS and empty alias
   */
  public getFirstName(publishNameType: GmsPublishNameType): string | undefined {
    if (
      [
        GmsPublishNameType.GMS_PUBLISH_NAME_FIRST,
        GmsPublishNameType.GMS_PUBLISH_NAME_FIRST_INITIAL,
        GmsPublishNameType.GMS_PUBLISH_NAME_FULL,
      ].includes(publishNameType)
    ) {
      return this.user.firstName
    }
    if (
      (!this.user.alias &&
        publishNameType === GmsPublishNameType.GMS_PUBLISH_NAME_ALIAS_OR_INITALS) ||
      publishNameType === GmsPublishNameType.GMS_PUBLISH_NAME_INITIALS
    ) {
      return this.user.firstName.substring(0, 1)
    }
  }

  /**
   * get last name based on publishNameType: GmsPublishNameType value
   * @param publishNameType
   * @returns user.lastName for GMS_PUBLISH_NAME_FULL
   *   first initial from user.lastName for GMS_PUBLISH_NAME_FIRST_INITIAL, GMS_PUBLISH_NAME_INITIALS or GMS_PUBLISH_NAME_ALIAS_OR_INITALS and empty alias
   */
  public getLastName(publishNameType: GmsPublishNameType): string | undefined {
    if (publishNameType === GmsPublishNameType.GMS_PUBLISH_NAME_FULL) {
      return this.user.lastName
    }
    if (
      (!this.user.alias &&
        publishNameType === GmsPublishNameType.GMS_PUBLISH_NAME_ALIAS_OR_INITALS) ||
      publishNameType === GmsPublishNameType.GMS_PUBLISH_NAME_FIRST_INITIAL ||
      publishNameType === GmsPublishNameType.GMS_PUBLISH_NAME_INITIALS
    ) {
      return this.user.lastName.substring(0, 1)
    }
  }

  public getUsername(publishNameType: GmsPublishNameType): string {
    if (
      this.user.alias &&
      publishNameType === GmsPublishNameType.GMS_PUBLISH_NAME_ALIAS_OR_INITALS
    ) {
      return this.user.alias
    }
    const firstName = this.getFirstName(publishNameType)
    const lastName = this.getLastName(publishNameType)
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }
    return this.user.gradidoID
  }
}
