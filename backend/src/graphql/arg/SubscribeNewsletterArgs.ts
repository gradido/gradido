import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class SubscribeNewsletterArgs {
  @Field(() => String)
  email: string

  @Field(() => String)
  language: string
}
