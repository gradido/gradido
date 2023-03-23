import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export default class UpdateUserInfosArgs {
  @Field({ nullable: true })
  firstName?: string

  @Field({ nullable: true })
  lastName?: string

  @Field({ nullable: true })
  language?: string

  @Field(() => Int, { nullable: true })
  publisherId?: number | null

  @Field({ nullable: true })
  password?: string

  @Field({ nullable: true })
  passwordNew?: string

  @Field({ nullable: true })
  hideAmountGDD?: boolean

  @Field({ nullable: true })
  hideAmountGDT?: boolean
}
