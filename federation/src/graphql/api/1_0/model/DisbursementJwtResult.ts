import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class DisbursementJwtResult {
  constructor() {
    this.accepted = false
    this.acceptedAt = null
    this.transactionId = null
    this.message = null
  }

  @Field(() => String, { nullable: true })
  message: string | null

  @Field(() => Boolean)
  accepted: boolean

  @Field(() => Date, { nullable: true })
  acceptedAt: Date | null

  @Field(() => Number, { nullable: true })
  transactionId: number | null
}
