import { ObjectType, Field } from 'type-graphql'
import { EventProtocol } from '@entity/EventProtocol'
import { EventProtocolType } from '@/event/EventProtocolType'
import Decimal from 'decimal.js-light'

export interface EventInterface {
  type: string
  createdAt: Date
  userId: number
  xUserId?: number
  xCommunityId?: number
  transactionId?: number
  contributionId?: number
  amount?: Decimal
}

@ObjectType()
export class Event {
  constructor(event: EventProtocol) {
    this.id = event.id
    this.type = event.type
    this.createdAt = event.createdAt
    this.userId = event.userId
    this.xUserId = event.xUserId
    this.xCommunityId = event.xCommunityId
    this.transactionId = event.transactionId
    this.contributionId = event.contributionId
    this.amount = event.amount
  }

  @Field(() => Number)
  id: number

  @Field(() => EventProtocolType)
  type: string

  @Field(() => Date)
  createdAt: Date

  @Field(() => Number)
  userId: number

  @Field(() => Number, { nullable: true })
  xUserId: number | null

  @Field(() => Number, { nullable: true })
  xCommunityId: number | null

  @Field(() => Number, { nullable: true })
  transactionId: number | null

  @Field(() => Number, { nullable: true })
  contributionId: number | null

  @Field(() => Decimal)
  amount: Decimal | null
}
