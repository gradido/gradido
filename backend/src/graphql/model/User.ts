import { GmsPublishLocationType } from '@enum/GmsPublishLocationType'
import { PublishNameType } from '@enum/PublishNameType'
import { User as DbUser } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'
import { Point } from 'typeorm'

import { PublishNameLogic } from '@/data/PublishName.logic'
import { Point2Location } from '@/graphql/resolver/util/Location2Point'

import { KlickTipp } from './KlickTipp'
import { Location } from './Location'
import { UserContact } from './UserContact'

@ObjectType()
export class User {
  constructor(dbUser: DbUser | null) {
    if (dbUser) {
      this.id = dbUser.id
      this.foreign = dbUser.foreign
      this.communityUuid = dbUser.communityUuid
      if (dbUser.community) {
        this.communityName = dbUser.community.name
      }
      this.gradidoID = dbUser.gradidoID
      this.alias = dbUser.alias

      const publishNameLogic = new PublishNameLogic(dbUser)
      const publishNameType = dbUser.humhubPublishName as PublishNameType
      this.publicName = publishNameLogic.getPublicName(publishNameType)
      this.userIdentifier = publishNameLogic.getUserIdentifier(publishNameType)

      if (dbUser.emailContact) {
        this.emailChecked = dbUser.emailContact.emailChecked
        this.emailContact = new UserContact(dbUser.emailContact)
      }
      this.firstName = dbUser.firstName
      this.lastName = dbUser.lastName
      this.deletedAt = dbUser.deletedAt
      this.createdAt = dbUser.createdAt
      this.language = dbUser.language
      this.publisherId = dbUser.publisherId
      this.roles = dbUser.userRoles?.map((userRole) => userRole.role) ?? []
      this.klickTipp = null
      this.hasElopage = null
      this.hideAmountGDD = dbUser.hideAmountGDD
      this.hideAmountGDT = dbUser.hideAmountGDT
      this.humhubAllowed = dbUser.humhubAllowed
      this.gmsAllowed = dbUser.gmsAllowed
      this.gmsPublishName = dbUser.gmsPublishName
      this.humhubPublishName = dbUser.humhubPublishName
      this.gmsPublishLocation = dbUser.gmsPublishLocation
      this.userLocation = dbUser.location ? Point2Location(dbUser.location as Point) : null
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
  userIdentifier: string | null

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
