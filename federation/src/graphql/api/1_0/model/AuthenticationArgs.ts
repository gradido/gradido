import { Field, InputType } from 'type-graphql'

@InputType()
export class AuthenticationArgs {
  @Field(() => String)
  oneTimeCode: string

  @Field(() => String)
  uuid: string
}
