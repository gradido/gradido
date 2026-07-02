import { Field, ObjectType } from 'type-graphql'
import { MutationError } from './MutationError'

@ObjectType()
export class MutationResult {
  @Field(() => Boolean)
  success: boolean

  @Field(() => MutationError, { nullable: true })
  error?: MutationError
}
