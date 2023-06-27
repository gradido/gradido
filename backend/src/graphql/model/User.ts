import { ROLE_NAMES } from '@/auth/ROLES'
import { User as dbUser } from '@entity/User'
import { ObjectType, Field, Int } from 'type-graphql'

import { KlickTipp } from './KlickTipp'

@ObjectType()
export class User {
  constructor(user: dbUser) {
    this.id = user.id
    this.gradidoID = user.gradidoID
    this.alias = user.alias
    if (user.emailContact) {
      this.emailChecked = user.emailContact.emailChecked
    }
    this.firstName = user.firstName
    this.lastName = user.lastName
    this.deletedAt = user.deletedAt
    this.createdAt = user.createdAt
    this.language = user.language
    this.publisherId = user.publisherId
    if (user.userRole) {
      switch (user.userRole.role) {
        case ROLE_NAMES.ROLE_NAME_ADMIN:
          this.isAdmin = user.userRole.createdAt
          break
        case ROLE_NAMES.ROLE_NAME_MODERATOR:
          this.isModerator = user.userRole.createdAt
          break
        default:
          this.isAdmin = null
          this.isModerator = null
      }
    }
    this.klickTipp = null
    this.hasElopage = null
    this.hideAmountGDD = user.hideAmountGDD
    this.hideAmountGDT = user.hideAmountGDT
  }

  @Field(() => Int)
  id: number

  @Field(() => String)
  gradidoID: string

  @Field(() => String, { nullable: true })
  alias: string | null

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

  // This is not the users publisherId, but the one of the users who recommend him
  @Field(() => Int, { nullable: true })
  publisherId: number | null

  @Field(() => Date, { nullable: true })
  isAdmin: Date | null

  @Field(() => Date, { nullable: true })
  isModerator: Date | null

  @Field(() => KlickTipp, { nullable: true })
  klickTipp: KlickTipp | null

  @Field(() => Boolean, { nullable: true })
  hasElopage: boolean | null
}
