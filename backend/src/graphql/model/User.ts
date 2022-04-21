import { ObjectType, Field } from 'type-graphql'
import { KlickTipp } from './KlickTipp'
import { User as dbUser } from '@entity/User'

@ObjectType()
export class User {
  constructor(user: dbUser) {
    this.id = user.id
    this.email = user.email
    this.firstName = user.firstName
    this.lastName = user.lastName
    this.deletedAt = user.deletedAt
    this.createdAt = user.createdAt
    this.emailChecked = user.emailChecked
    this.language = user.language
    this.publisherId = user.publisherId
    this.isAdmin = user.isAdmin
    // TODO
    this.coinanimation = null
    this.klickTipp = null
    this.hasElopage = null
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

  // TODO this is a bit inconsistent with what we query from the database
  // therefore all those fields are now nullable with default value null
  @Field(() => Boolean, { nullable: true })
  coinanimation: boolean | null

  @Field(() => KlickTipp, { nullable: true })
  klickTipp: KlickTipp | null

  @Field(() => Boolean, { nullable: true })
  hasElopage: boolean | null
}
