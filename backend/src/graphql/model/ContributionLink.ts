import { ObjectType, Field, Int } from 'type-graphql'
import Decimal from 'decimal.js-light'
import { ContributionLinks as dbContributionLinks } from '@entity/ContributionLinks'
import CONFIG from '@/config'

@ObjectType()
export class ContributionLink {
  constructor(contributionLink: dbContributionLinks) {
    this.amount = contributionLink.amount
    this.code = contributionLink.code
    this.createdAt = contributionLink.createdAt
    this.cycle = contributionLink.cycle
    this.deletedAt = contributionLink.deletedAt
    this.endDate = contributionLink.validTo
    this.id = contributionLink.id
    this.linkEnabled = contributionLink.linkEnabled
    this.link = CONFIG.COMMUNITY_CONTRIBUTION_URL.replace(/{code}/g, contributionLink.code)
    this.maxAccountBalance = contributionLink.maxAccountBalance
    this.maxAmountPerMonth = contributionLink.maxAmountPerMonth
    this.memo = contributionLink.memo
    this.minGapHours = contributionLink.minGapHours
    this.name = contributionLink.name
    this.repetition = contributionLink.maxPerCycle
    this.startDate = contributionLink.validFrom
    this.totalMaxCountOfContribution = contributionLink.totalMaxCountOfContribution
  }

  @Field(() => Decimal)
  amount: Decimal

  @Field(() => String)
  code: string

  @Field(() => Date, { nullable: true })
  createdAt: Date | null

  @Field(() => String)
  cycle: string

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null

  @Field(() => Date, { nullable: true })
  endDate: Date | null

  @Field(() => Int)
  id?: number

  @Field(() => Boolean, { nullable: true })
  linkEnabled: boolean | null

  @Field(() => String)
  link: string

  @Field(() => Decimal)
  maxAccountBalance: Decimal

  @Field(() => Decimal)
  maxAmountPerMonth: Decimal

  @Field(() => String)
  memo: string

  @Field(() => Int, { nullable: true })
  minGapHours: number | null

  @Field(() => String)
  name: string

  @Field(() => Int)
  repetition: number

  @Field(() => Date, { nullable: true })
  startDate: Date | null

  @Field(() => Int, { nullable: true })
  totalMaxCountOfContribution: number | null
}
