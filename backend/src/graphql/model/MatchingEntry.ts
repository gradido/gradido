// AI-GENERATED — not an architecture reference
import { MatchingEntrySelect } from 'database'
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class MatchingEntry {
  constructor(dbMatchingEntry: MatchingEntrySelect) {
    this.uuid = dbMatchingEntry.uuid
    this.matchingType = dbMatchingEntry.matchingType
    this.summary = dbMatchingEntry.summary
    this.details = dbMatchingEntry.details
    this.remote = dbMatchingEntry.remote
    this.active = dbMatchingEntry.active
    this.createdAt = dbMatchingEntry.createdAt
    this.updatedAt = dbMatchingEntry.updatedAt
  }

  @Field(() => String)
  uuid: string

  @Field(() => String)
  matchingType: string

  @Field(() => String)
  summary: string

  @Field(() => String, { nullable: true })
  details: string | null

  @Field(() => Boolean)
  remote: boolean

  @Field(() => Boolean)
  active: boolean

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
