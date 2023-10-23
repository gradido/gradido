import { Field, InputType } from 'type-graphql'

@InputType()
export class OpenConnectionCallbackArgs {
  @Field(() => String)
  oneTimeCode: string

  @Field(() => String)
  url: string
}
