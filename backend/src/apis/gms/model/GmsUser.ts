import { User as dbUser } from '@entity/User'

import { GmsLocationType, GmsPublishNameType, GmsPublishPhoneType } from './GmsEnums'

export class GmsUser {
  constructor(user: dbUser) {
    this.userUuid = user.gradidoID
    // this.communityUuid = user.communityUuid
    this.email = this.getGmsEmail(user)
    this.countryCode = this.getGmsCountryCode(user)
    this.mobile = this.getGmsPhone(user)
    this.firstName = this.getGmsFirstName(user)
    this.lastName = this.getGmsLastName(user)
    this.alias = user.alias ? user.alias : undefined
    this.type = GmsLocationType.GMS_LOCATION_TYPE_RANDOM
    this.location = null
  }

  id: number
  userUuid: string
  communityUuid: string
  email: string | undefined
  countryCode: string | undefined
  mobile: string | undefined
  status: number
  createdAt: Date
  updatedAt: Date
  firstName: string | undefined
  lastName: string | undefined
  alias: string | undefined
  type: number
  address: string | undefined
  city: string | undefined
  state: string
  country: string | undefined
  zipCode: string | undefined
  language: string
  location: unknown

  private getGmsFirstName(user: dbUser): string | undefined {
    if (
      user.gmsAllowed &&
      (user.gmsPublishName === GmsPublishNameType.GMS_PUBLISH_NAME_FIRST ||
        user.gmsPublishName === GmsPublishNameType.GMS_PUBLISH_NAME_FIRST_INITIAL ||
        user.gmsPublishName === GmsPublishNameType.GMS_PUBLISH_NAME_FULL)
    ) {
      return user.firstName
    }
    if (user.gmsAllowed && user.gmsPublishName === GmsPublishNameType.GMS_PUBLISH_NAME_INITIALS) {
      return user.firstName.substring(0, 1) + '.'
    }
  }

  private getGmsLastName(user: dbUser): string | undefined {
    if (user.gmsAllowed && user.gmsPublishName === GmsPublishNameType.GMS_PUBLISH_NAME_FULL) {
      return user.lastName
    }
    if (
      user.gmsAllowed &&
      (user.gmsPublishName === GmsPublishNameType.GMS_PUBLISH_NAME_FIRST_INITIAL ||
        user.gmsPublishName === GmsPublishNameType.GMS_PUBLISH_NAME_INITIALS)
    ) {
      return user.lastName.substring(0, 1) + '.'
    }
  }

  private getGmsEmail(user: dbUser): string | undefined {
    if (user.gmsAllowed && user.emailContact.gmsPublishEmail) {
      return user.emailContact.email
    }
  }

  private getGmsCountryCode(user: dbUser): string | undefined {
    if (
      user.gmsAllowed &&
      (user.emailContact.gmsPublishPhone === GmsPublishPhoneType.GMS_PUBLISH_PHONE_COUNTRY ||
        user.emailContact.gmsPublishPhone === GmsPublishPhoneType.GMS_PUBLISH_PHONE_FULL)
    ) {
      return user.emailContact.countryCode
    }
  }

  private getGmsPhone(user: dbUser): string | undefined {
    if (
      user.gmsAllowed &&
      user.emailContact.gmsPublishPhone === GmsPublishPhoneType.GMS_PUBLISH_PHONE_FULL
    ) {
      return user.emailContact.phone
    }
  }
}
