import { ObjectType, Field } from 'type-graphql'
import { KlickTipp } from './KlickTipp'
import { User as dbUser } from '@entity/User'
import Decimal from 'decimal.js-light'
import { FULL_CREATION_AVAILABLE } from '../resolver/const/const'

@ObjectType()
export class User {
  constructor(user: dbUser, creation: Decimal[] = FULL_CREATION_AVAILABLE) {
    this.id = user.id
    this.email = user.emailContact.email
    this.firstName = user.firstName
    this.lastName = user.lastName
    this.deletedAt = user.deletedAt
    this.createdAt = user.createdAt
    this.emailChecked = user.emailContact.emailChecked
    this.language = user.language
    this.publisherId = user.publisherId
    this.isAdmin = user.isAdmin
    this.klickTipp = null
    this.hasElopage = null
    this.creation = creation
  }

  @Field(() => Number)
  id: number

  // `public_key` binary(32) DEFAULT NULL,
  // `privkey` binary(80) DEFAULT NULL,

  // TODO privacy issue here
  @Field(() => String)
  email: string

  @Field(() => String, { nullable: true })
  firstName: string | null

  @Field(() => String, { nullable: true })
  lastName: string | null

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null

  // `password` bigint(20) unsigned DEFAULT 0,
  // `email_hash` binary(32) DEFAULT NULL,

  @Field(() => Date)
  createdAt: Date

  @Field(() => Boolean)
  emailChecked: boolean

  @Field(() => String)
  language: string

  // This is not the users publisherId, but the one of the users who recommend him
  @Field(() => Number, { nullable: true })
  publisherId: number | null

  // `passphrase` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,

  @Field(() => Date, { nullable: true })
  isAdmin: Date | null

  @Field(() => KlickTipp, { nullable: true })
  klickTipp: KlickTipp | null

  @Field(() => Boolean, { nullable: true })
  hasElopage: boolean | null

  @Field(() => [Decimal])
  creation: Decimal[]
}
