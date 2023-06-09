import { UserContact as dbUserContact } from '@entity/UserContact'
import { ObjectType, Field, Int } from 'type-graphql'

@ObjectType()
export class UserContact {
  constructor(userContact: dbUserContact) {
    this.id = userContact.id
    this.type = userContact.type
    this.userId = userContact.userId
    this.email = userContact.email
    // this.emailVerificationCode = userContact.emailVerificationCode
    this.emailOptInTypeId = userContact.emailOptInTypeId
    this.emailResendCount = userContact.emailResendCount
    this.emailChecked = userContact.emailChecked
    this.phone = userContact.phone
    this.createdAt = userContact.createdAt
    this.updatedAt = userContact.updatedAt
    this.deletedAt = userContact.deletedAt
  }

  @Field(() => Int)
  id: number

  @Field(() => String)
  type: string

  @Field(() => Int)
  userId: number

  @Field(() => String)
  email: string

  // @Field(() => BigInt, { nullable: true })
  // emailVerificationCode: BigInt | null

  @Field(() => Int, { nullable: true })
  emailOptInTypeId: number | null

  @Field(() => Int, { nullable: true })
  emailResendCount: number | null

  @Field(() => Boolean)
  emailChecked: boolean

  @Field(() => String, { nullable: true })
  phone: string | null

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date, { nullable: true })
  updatedAt: Date | null

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null
}
