import { ObjectType, Field, Int, Float } from 'type-graphql'

import { GdtEntry } from './GdtEntry'

@ObjectType()
export class GdtEntryList {
  constructor(status = '', count = 0, gdtEntries = [], gdtSum = 0, timeUsed = 0) {
    this.status = status
    this.count = count
    this.gdtEntries = gdtEntries
    this.gdtSum = gdtSum
    this.timeUsed = timeUsed
  }

  @Field(() => String)
  status: string

  @Field(() => Int)
  count: number

  @Field(() => [GdtEntry], { nullable: true })
  gdtEntries: GdtEntry[] | null

  @Field(() => Float)
  gdtSum: number

  @Field(() => Float)
  timeUsed: number
}
