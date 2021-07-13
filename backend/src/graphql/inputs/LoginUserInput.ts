import { ArgsType, Field } from 'type-graphql'

/*
@InputType()
export class LoginUserInput {
  @Field({ nullable: true })
  username?: string

  @Field({ nullable: true })
  email?: string

  @Field({ nullable: true })
  pubkey?: string

  @Field()
  password: string
}
*/

@ArgsType()
export class UnsecureLoginArgs {
  @Field(() => String)
  email: string

  @Field(() => String)
  password: string
}
