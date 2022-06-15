import { ObjectType, Field } from 'type-graphql'
import { ContributionLink } from '@model/ContributionLink'

@ObjectType()
export class ContributionLinkList {
  @Field(() => [ContributionLink])
  links: ContributionLink[]

  @Field(() => Number)
  count: number
}
