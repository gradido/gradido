import { User as dbUser } from '@entity/User'

import { GmsPublishLocationType } from '@/graphql/enum/GmsPublishLocationType'
import { GmsPublishPhoneType } from '@/graphql/enum/GmsPublishPhoneType'
import { PublishNameType } from '@/graphql/enum/PublishNameType'

export class GmsUser {

  constructor(user: dbUser) {
    this.userUuid = user.gradidoID
    // this.communityUuid = user.communityUuid
    this.language = user.language
    this.email = this.getGmsEmail(user)
    this.countryCode = this.getGmsCountryCode(user)
    this.mobile = this.getGmsPhone(user)
    this.firstName = this.getGmsFirstName(user)
    this.lastName = this.getGmsLastName(user)
    this.alias = this.getGmsAlias(user)
    this.type = GmsPublishLocationType.GMS_LOCATION_TYPE_RANDOM
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

  private getGmsAlias(user: dbUser): string | undefined {
    if (
      user.gmsAllowed &&
      user.alias &&
      user.gmsPublishName === PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS
    ) {
      return user.alias
    }
  }

  private getGmsFirstName(user: dbUser): string | undefined {
    if (
      user.gmsAllowed &&
      (user.gmsPublishName === PublishNameType.PUBLISH_NAME_FIRST ||
        user.gmsPublishName === PublishNameType.PUBLISH_NAME_FIRST_INITIAL ||
        user.gmsPublishName === PublishNameType.PUBLISH_NAME_FULL)
    ) {
      return user.firstName
    }
    if (
      user.gmsAllowed &&
      ((!user.alias && user.gmsPublishName === PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS) ||
        user.gmsPublishName === PublishNameType.PUBLISH_NAME_INITIALS)
    ) {
      return this.firstUpperCaseSecondLowerCase(user.firstName)
    }
  }

  private getGmsLastName(user: dbUser): string | undefined {
    if (user.gmsAllowed && user.gmsPublishName === PublishNameType.PUBLISH_NAME_FULL) {
      return user.lastName
    }
    if (
      user.gmsAllowed &&
      ((!user.alias && user.gmsPublishName === PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS) ||
        user.gmsPublishName === PublishNameType.PUBLISH_NAME_FIRST_INITIAL ||
        user.gmsPublishName === PublishNameType.PUBLISH_NAME_INITIALS)
    ) {
      return this.firstUpperCaseSecondLowerCase(user.lastName)
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

  private firstUpperCaseSecondLowerCase(name: string) {
    if (name && name.length >= 2) {
      return name.charAt(0).toUpperCase() + name.charAt(1).toLocaleLowerCase()
    }
    return name
  }
}
