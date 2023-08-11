/* eslint-disable type-graphql/invalid-nullable-input-type */
import { IsBoolean } from 'class-validator'
import { Field, InputType } from 'type-graphql'

@InputType()
export class TransactionLinkFilters {
  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  withDeleted?: boolean

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  withExpired?: boolean

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  withRedeemed?: boolean
}
