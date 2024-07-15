import { Point } from '@dbTools/typeorm'
import { User as dbUser } from '@entity/User'

import { GmsPublishPhoneType } from '@/graphql/enum/GmsPublishPhoneType'
import { PublishNameType } from '@/graphql/enum/PublishNameType'
import { Point2StringArray } from '@/graphql/resolver/util/Location2Point'

export class GmsUser {
  constructor(user: dbUser) {
    this.userUuid = user.gradidoID
    this.communityUuid = user.communityUuid
    this.language = user.language
    this.email = this.getGmsEmail(user)
    this.countryCode = this.getGmsCountryCode(user)
    this.mobile = this.getGmsPhone(user)
    this.firstName = this.getGmsFirstName(user)
    this.lastName = this.getGmsLastName(user)
    this.alias = this.getGmsAlias(user)
    this.type = user.gmsPublishLocation // GmsPublishLocationType.GMS_LOCATION_TYPE_RANDOM
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.location = Point2StringArray(user.location as Point)
  }

  id: number
  userUuid: string
  communityUuid: string | undefined
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
      return user.firstName.substring(0, 1)
    }
    if (
      user.gmsAllowed &&
      user.alias &&
      user.firstName === null &&
      user.gmsPublishName === PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS
    ) {
      // return alias as firstname, because firstname is mandatory in gms api
      return user.alias
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
      return user.lastName.substring(0, 1)
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
