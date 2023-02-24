import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class UpdateUserInfosArgs {
  @Field({ nullable: true })
  firstName?: string

  @Field({ nullable: true })
  lastName?: string

  @Field({ nullable: true })
  alias?: string

  @Field({ nullable: true })
  language?: string

  @Field({ nullable: true })
  publisherId?: number

  @Field({ nullable: true })
  password?: string

  @Field({ nullable: true })
  passwordNew?: string

  @Field({ nullable: true })
  hideAmountGDD?: boolean

  @Field({ nullable: true })
  hideAmountGDT?: boolean
}
