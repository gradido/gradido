import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class AdminCreateContributions {
  constructor() {
    this.success = false
    this.successfulContribution = []
    this.failedContribution = []
  }

  @Field(() => Boolean)
  success: boolean

  @Field(() => [String])
  successfulContribution: string[]

  @Field(() => [String])
  failedContribution: string[]
}
