import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class CommandResult {
  @Field(() => Boolean)
  success: boolean

  @Field(() => String, { nullable: true })
  data?: any

  @Field(() => String, { nullable: true })
  error?: string
}
