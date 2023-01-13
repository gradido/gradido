import { ObjectType, Field } from 'type-graphql'
import { KlickTipp } from './KlickTipp'
import { User as dbUser } from '@entity/User'
import { UserContact } from './UserContact'

@ObjectType()
export class User {
  constructor(user: dbUser) {
    this.id = user.id
    this.gradidoID = user.gradidoID
    this.alias = user.alias
    this.emailId = user.emailId
    if (user.emailContact) {
      this.email = user.emailContact.email
      this.emailContact = new UserContact(user.emailContact)
      this.emailChecked = user.emailContact.emailChecked
    }
    this.firstName = user.firstName
    this.lastName = user.lastName
    this.deletedAt = user.deletedAt
    this.createdAt = user.createdAt
    this.language = user.language
    this.publisherId = user.publisherId
    this.isAdmin = user.isAdmin
    this.klickTipp = null
    this.hasElopage = null
    this.hideAmountGDD = user.hideAmountGDD
    this.hideAmountGDT = user.hideAmountGDT
  }

  @Field(() => Number)
  id: number

  @Field(() => String)
  gradidoID: string

  @Field(() => String, { nullable: true })
  alias?: string

  @Field(() => Number, { nullable: true })
  emailId: number | null

  // TODO privacy issue here
  @Field(() => String, { nullable: true })
  email: string

  @Field(() => UserContact)
  emailContact: UserContact

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
  @Field(() => Number, { nullable: true })
  publisherId: number | null

  @Field(() => Date, { nullable: true })
  isAdmin: Date | null

  @Field(() => KlickTipp, { nullable: true })
  klickTipp: KlickTipp | null

  @Field(() => Boolean, { nullable: true })
  hasElopage: boolean | null
}
