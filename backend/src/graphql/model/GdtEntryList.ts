/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { GdtEntry } from './GdtEntry'
import { ObjectType, Field, Int, Float } from 'type-graphql'

@ObjectType()
export class GdtEntryList {
  constructor(json: any) {
    this.state = json.state
    this.count = json.count
    this.gdtEntries = json.gdtEntries ? json.gdtEntries.map((json: any) => new GdtEntry(json)) : []
    this.gdtSum = json.gdtSum
    this.timeUsed = json.timeUsed
  }

  @Field(() => String)
  state: string

  @Field(() => Int)
  count: number

  @Field(() => [GdtEntry], { nullable: true })
  gdtEntries: GdtEntry[] | null

  @Field(() => Float)
  gdtSum: number

  @Field(() => Float)
  timeUsed: number
}
