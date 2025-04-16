import { Point } from '@dbTools/typeorm'
import { User as dbUser } from '@entity/User'
import { ObjectType, Field, Int } from 'type-graphql'

import { GmsPublishLocationType } from '@enum/GmsPublishLocationType'
import { PublishNameType } from '@enum/PublishNameType'

import { PublishNameLogic } from '@/data/PublishName.logic'
import { Point2Location } from '@/graphql/resolver/util/Location2Point'

import { KlickTipp } from './KlickTipp'
import { Location } from './Location'
import { UserContact } from './UserContact'

@ObjectType()
export class User {
  constructor(user: dbUser | null) {
    if (user) {
      this.id = user.id
      this.foreign = user.foreign
      this.communityUuid = user.communityUuid
      if (user.community) {
        this.communityName = user.community.name
      }
      this.gradidoID = user.gradidoID
      this.alias = user.alias

      const publishNameLogic = new PublishNameLogic(user)
      const publishNameType = user.humhubPublishName as PublishNameType
      this.publicName = publishNameLogic.getPublicName(publishNameType)
      this.uniqueUsername = publishNameLogic.getUniqueUsername(publishNameType)

      if (user.emailContact) {
        this.emailChecked = user.emailContact.emailChecked
        this.emailContact = new UserContact(user.emailContact)
      }
      this.firstName = user.firstName
      this.lastName = user.lastName
      this.deletedAt = user.deletedAt
      this.createdAt = user.createdAt
      this.language = user.language
      this.publisherId = user.publisherId
      this.roles = user.userRoles?.map((userRole) => userRole.role) ?? []
      this.klickTipp = null
      this.hasElopage = null
      this.hideAmountGDD = user.hideAmountGDD
      this.hideAmountGDT = user.hideAmountGDT
      this.humhubAllowed = user.humhubAllowed
      this.gmsAllowed = user.gmsAllowed
      this.gmsPublishName = user.gmsPublishName
      this.humhubPublishName = user.humhubPublishName
      this.gmsPublishLocation = user.gmsPublishLocation
      this.userLocation = user.location ? Point2Location(user.location as Point) : null
    }
  }

  @Field(() => Int)
  id: number

  @Field(() => Boolean)
  foreign: boolean

  @Field(() => String)
  communityUuid: string

  @Field(() => String, { nullable: true })
  communityName: string | null

  @Field(() => String)
  gradidoID: string

  @Field(() => String, { nullable: true })
  alias: string | null

  @Field(() => String, { nullable: true })
  publicName: string | null

  @Field(() => String, { nullable: true })
  uniqueUsername: string | null

  @Field(() => String, { nullable: true })
  firstName: string | null

  @Field(() => String, { nullable: true })
  lastName: string | null

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null

  @Field(() => Date)
  createdAt: Date

  @Field(() => Boolean)
  emailChecked: boolean

  @Field(() => String)
  language: string

  @Field(() => Boolean)
  hideAmountGDD: boolean

  @Field(() => Boolean)
  hideAmountGDT: boolean

  @Field(() => Boolean)
  humhubAllowed: boolean

  @Field(() => Boolean)
  gmsAllowed: boolean

  @Field(() => PublishNameType, { nullable: true })
  gmsPublishName: PublishNameType | null

  @Field(() => PublishNameType, { nullable: true })
  humhubPublishName: PublishNameType | null

  @Field(() => GmsPublishLocationType, { nullable: true })
  gmsPublishLocation: GmsPublishLocationType | null

  // This is not the users publisherId, but the one of the users who recommend him
  @Field(() => Int, { nullable: true })
  publisherId: number | null

  @Field(() => KlickTipp, { nullable: true })
  klickTipp: KlickTipp | null

  @Field(() => Boolean, { nullable: true })
  hasElopage: boolean | null

  @Field(() => [String])
  roles: string[]

  @Field(() => UserContact, { nullable: true })
  emailContact: UserContact | null

  @Field(() => Location, { nullable: true })
  userLocation: Location | null
}
