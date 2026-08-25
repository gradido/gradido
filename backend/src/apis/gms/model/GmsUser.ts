import { User as dbUser, MatchingEntrySelect } from 'database'

import { PublishNameLogic } from '@/data/PublishName.logic'
import { GmsPublishLocationType } from '@/graphql/enum/GmsPublishLocationType'
import { GmsPublishPhoneType } from '@/graphql/enum/GmsPublishPhoneType'

import { GmsMatchingEntry } from './GmsMatchingEntry'

export class GmsUser {
  /**
   * @param entries when given, they state this user's FULL set of entries: the GMS
   *   writes what is in the list and removes what is not. Leaving it out says
   *   nothing about entries, and the GMS keeps whatever it has.
   */
  constructor(user: dbUser, entries?: MatchingEntrySelect[]) {
    const pnLogic = new PublishNameLogic(user)

    this.uuid = user.gradidoID
    // this.communityUuid = user.communityUuid
    this.language = user.language
    // Everything a member writes about themselves only goes over there while they take
    // part - like the email, the phone and the name below. `null` rather than leaving it
    // out, because leaving it out lets the GMS keep what it has: a text written while
    // consent was on has to go when it is switched off.
    this.aboutMe = user.gmsAllowed ? user.aboutMe : null
    if (entries) {
      this.matchingEntries = entries.map((entry) => new GmsMatchingEntry(entry))
    }
    this.email = this.getGmsEmail(user)
    this.countryCode = this.getGmsCountryCode(user)
    this.mobile = this.getGmsPhone(user)
    // The alias, no longer steered by the publish-name setting (NU-024). The KEY the
    // GMS recognises the user by is this.uuid above and stays untouched; the next
    // upsert overwrites the display on its own.
    this.alias = pnLogic.getPublicAlias()
    if (user.location && user.location.type === 'Point') {
      this.location = user.location.coordinates
    }
    let publishLocationType: GmsPublishLocationType = user.gmsPublishLocation
    if (publishLocationType === GmsPublishLocationType.GMS_LOCATION_TYPE_RANDOM) {
      publishLocationType = GmsPublishLocationType.GMS_LOCATION_TYPE_APPROXIMATE
    }
    if (!this.location) {
      publishLocationType = GmsPublishLocationType.GMS_LOCATION_TYPE_RANDOM
    }
    // use string for http transfer to make sure the correct value reachs the target
    this.type = GmsPublishLocationType[publishLocationType]
  }

  id: number
  uuid: string
  communityUuid: string
  email: string | undefined
  countryCode: string | undefined
  mobile: string | undefined
  status: number
  createdAt: Date
  updatedAt: Date
  alias: string
  type: string
  address: string | undefined
  city: string | undefined
  state: string
  country: string | undefined
  zipCode: string | undefined
  language: string
  location: number[]
  aboutMe: string | null
  matchingEntries?: GmsMatchingEntry[]

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
}
