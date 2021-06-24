import { InputType, Field } from 'type-graphql'

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
