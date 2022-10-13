import { ObjectType, Field } from 'type-graphql'
import { ContributionMonth } from './ContributionMonth'
import { Contribution } from './Contribution'
import { Contribution as dbContribution } from '@entity/Contribution'
import { User as dbUser } from '@entity/User'

@ObjectType()
export class AdminCreateContribution {
  constructor(contrib: dbContribution, user: dbUser, creation: ContributionMonth[]) {
    this.contribution = new Contribution(contrib, user)
    this.creation = creation
  }

  @Field(() => Contribution)
  contribution: Contribution

  @Field(() => [ContributionMonth])
  creation: ContributionMonth[]
}
