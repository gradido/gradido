import { Field, ObjectType } from 'type-graphql'
import { ContributionMessage as DbContributionMessage } from '@entity/ContributionMessage'
import { User } from '@entity/User'

@ObjectType()
export class ContributionMessage {
  constructor(contributionMessage: DbContributionMessage, user: User) {
    this.id = contributionMessage.id
    this.message = contributionMessage.message
    this.createdAt = contributionMessage.createdAt
    this.updatedAt = contributionMessage.updatedAt
    this.type = contributionMessage.type
    this.userFirstName = user.firstName
    this.userLastName = user.lastName
  }

  @Field(() => Number)
  id: number

  @Field(() => String)
  message: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null

  @Field(() => String)
  type: string

  @Field(() => String, { nullable: true })
  userFirstName: string | null

  @Field(() => String, { nullable: true })
  userLastName: string | null
}
