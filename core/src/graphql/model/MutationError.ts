import { Field, ObjectType } from 'type-graphql'
import { MutationErrorType } from '../enum/MutationErrorType'

@ObjectType()
export class MutationError {
  @Field(() => String)
  name: string

  @Field(() => String)
  message: string

  @Field(() => MutationErrorType)
  type: MutationErrorType
}
