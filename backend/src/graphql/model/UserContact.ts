import type { UserContact as DbUserContact } from '@entity/UserContact'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class UserContact {
  constructor(userContact: DbUserContact) {
    Object.assign(this, userContact)
  }

  @Field(() => Int)
  id: number

  @Field(() => Int)
  userId: number

  @Field(() => String)
  email: string

  @Field(() => Boolean)
  gmsPublishEmail: boolean

  @Field(() => Boolean)
  emailChecked: boolean

  @Field(() => String, { nullable: true })
  countryCode: string | null

  @Field(() => String, { nullable: true })
  phone: string | null

  @Field(() => Int)
  gmsPublishPhone: number

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date, { nullable: true })
  updatedAt: Date | null

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null
}
