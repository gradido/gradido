import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class SubscribeNewsletterArguments {
  @Field(() => String)
  email: string

  @Field(() => String)
  language: string
}
