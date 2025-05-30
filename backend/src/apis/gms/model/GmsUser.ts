import { User as dbUser } from 'database'

import { PublishNameLogic } from '@/data/PublishName.logic'
// import { GmsPublishLocationType } from '@/graphql/enum/GmsPublishLocationType'
import { GmsPublishLocationType } from '@/graphql/enum/GmsPublishLocationType'
import { GmsPublishPhoneType } from '@/graphql/enum/GmsPublishPhoneType'
import { PublishNameType } from '@/graphql/enum/PublishNameType'

export class GmsUser {
  constructor(user: dbUser) {
    const pnLogic = new PublishNameLogic(user)

    this.userUuid = user.gradidoID
    // this.communityUuid = user.communityUuid
    this.language = user.language
    this.email = this.getGmsEmail(user)
    this.countryCode = this.getGmsCountryCode(user)
    this.mobile = this.getGmsPhone(user)
    const fn = pnLogic.getFirstName(user.gmsPublishName as PublishNameType)
    this.firstName = fn !== '' ? fn : null // getGmsFirstName(user)
    const ln = pnLogic.getLastName(user.gmsPublishName as PublishNameType)
    this.lastName = ln !== '' ? ln : null // getGmsLastName(user)
    this.alias = pnLogic.getPublicName(user.gmsPublishName as PublishNameType)
    this.type = user.gmsPublishLocation // GmsPublishLocationType.GMS_LOCATION_TYPE_RANDOM
    this.location = user.location
    if ((this.type as GmsPublishLocationType) === GmsPublishLocationType.GMS_LOCATION_TYPE_RANDOM) {
      this.type = GmsPublishLocationType.GMS_LOCATION_TYPE_APPROXIMATE
    }
    if (!this.location) {
      this.type = GmsPublishLocationType.GMS_LOCATION_TYPE_RANDOM
    }
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
  firstName: string | null | undefined
  lastName: string | null | undefined
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
      (user.gmsPublishName as PublishNameType) === PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS
    ) {
      return user.alias
    }
    if (
      user.gmsAllowed &&
      ((!user.alias &&
        (user.gmsPublishName as PublishNameType) ===
          PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS) ||
        (user.gmsPublishName as PublishNameType) === PublishNameType.PUBLISH_NAME_INITIALS)
    ) {
      return (
        this.firstUpperCaseSecondLowerCase(user.firstName) +
        this.firstUpperCaseSecondLowerCase(user.lastName)
      )
    }
  }

  private getGmsFirstName(user: dbUser): string | null | undefined {
    if (
      user.gmsAllowed &&
      ((user.gmsPublishName as PublishNameType) === PublishNameType.PUBLISH_NAME_FIRST ||
        (user.gmsPublishName as PublishNameType) === PublishNameType.PUBLISH_NAME_FIRST_INITIAL ||
        (user.gmsPublishName as PublishNameType) === PublishNameType.PUBLISH_NAME_FULL)
    ) {
      return user.firstName
    }
    if (
      user.gmsAllowed &&
      ((!user.alias &&
        (user.gmsPublishName as PublishNameType) ===
          PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS) ||
        (user.gmsPublishName as PublishNameType) === PublishNameType.PUBLISH_NAME_INITIALS)
    ) {
      // return this.firstUpperCaseSecondLowerCase(user.firstName)
      return null // cause to delete firstname in gms
    }
  }

  private getGmsLastName(user: dbUser): string | null | undefined {
    if (
      user.gmsAllowed &&
      (user.gmsPublishName as PublishNameType) === PublishNameType.PUBLISH_NAME_FULL
    ) {
      return user.lastName
    }
    if (
      user.gmsAllowed &&
      (user.gmsPublishName as PublishNameType) === PublishNameType.PUBLISH_NAME_FIRST_INITIAL
    ) {
      return this.firstUpperCaseSecondLowerCase(user.lastName)
    }
    return null // cause to delete lastname in gms

    /*
    if (
      user.gmsAllowed &&
      ((!user.alias && user.gmsPublishName === PublishNameType.PUBLISH_NAME_ALIAS_OR_INITALS) ||
        user.gmsPublishName === PublishNameType.PUBLISH_NAME_FIRST_INITIAL ||
        user.gmsPublishName === PublishNameType.PUBLISH_NAME_INITIALS)
    ) {
      return this.firstUpperCaseSecondLowerCase(user.lastName)
    }
    */
  }

  private getGmsEmail(user: dbUser): string | undefined {
    if (user.gmsAllowed && user.emailContact?.gmsPublishEmail) {
      return user.emailContact.email
    }
  }

  private getGmsCountryCode(user: dbUser): string | undefined {
    if (
      user.gmsAllowed &&
      ((user.emailContact?.gmsPublishPhone as GmsPublishPhoneType) ===
        GmsPublishPhoneType.GMS_PUBLISH_PHONE_COUNTRY ||
        (user.emailContact?.gmsPublishPhone as GmsPublishPhoneType) ===
          GmsPublishPhoneType.GMS_PUBLISH_PHONE_FULL)
    ) {
      return user.emailContact?.countryCode
    }
  }

  private getGmsPhone(user: dbUser): string | undefined {
    if (
      user.gmsAllowed &&
      (user.emailContact?.gmsPublishPhone as GmsPublishPhoneType) ===
        GmsPublishPhoneType.GMS_PUBLISH_PHONE_FULL
    ) {
      return user.emailContact?.phone
    }
  }

  private firstUpperCaseSecondLowerCase(name: string) {
    if (name && name.length >= 2) {
      return name.charAt(0).toUpperCase() + name.charAt(1).toLocaleLowerCase()
    }
    return name
  }
}
