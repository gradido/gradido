import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class AdminCreateContribution {
  constructor() {
    this.success = false
    this.successfulCreation = []
    this.failedCreation = []
  }

  @Field(() => Boolean)
  success: boolean

  @Field(() => [String])
  successfulCreation: string[]

  @Field(() => [String])
  failedCreation: string[]
}
