import type { ContributionLink as dbContributionLink } from '@entity/ContributionLink'
import { Decimal } from 'decimal.js-light'
import { Field, Int, ObjectType } from 'type-graphql'

import { CONFIG } from '@/config'

@ObjectType()
export class ContributionLink {
  constructor(contributionLink: dbContributionLink) {
    this.id = contributionLink.id
    this.amount = contributionLink.amount
    this.name = contributionLink.name
    this.memo = contributionLink.memo
    this.createdAt = contributionLink.createdAt
    this.deletedAt = contributionLink.deletedAt
    this.validFrom = contributionLink.validFrom
    this.validTo = contributionLink.validTo
    this.maxAmountPerMonth = contributionLink.maxAmountPerMonth
    this.cycle = contributionLink.cycle
    this.maxPerCycle = contributionLink.maxPerCycle
    this.code = contributionLink.code
    this.link = CONFIG.COMMUNITY_REDEEM_CONTRIBUTION_URL + this.code
  }

  @Field(() => Int)
  id: number

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  name: string

  @Field(() => String)
  memo: string

  @Field(() => String)
  code: string

  @Field(() => String)
  link: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null

  @Field(() => Date, { nullable: true })
  validFrom: Date | null

  @Field(() => Date, { nullable: true })
  validTo: Date | null

  @Field(() => Decimal, { nullable: true })
  maxAmountPerMonth: Decimal | null

  @Field(() => String)
  cycle: string

  @Field(() => Int)
  maxPerCycle: number
}
