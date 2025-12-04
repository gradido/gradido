import { ContributionLink } from '@model/ContributionLink'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class ContributionLinkList {
  @Field(() => [ContributionLink])
  links: ContributionLink[]

  @Field(() => Int)
  count: number
}
