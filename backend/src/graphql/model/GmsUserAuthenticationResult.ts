import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class GmsUserAuthenticationResult {
  @Field(() => String)
  url: string

  @Field(() => String)
  token: string
}
