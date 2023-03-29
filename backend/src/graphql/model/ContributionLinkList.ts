import { ObjectType, Field, Int } from 'type-graphql'
import { ContributionLink } from '@model/ContributionLink'

@ObjectType()
export class ContributionLinkList {
  @Field(() => [ContributionLink])
  links: ContributionLink[]

  @Field(() => Int)
  count: number
}
