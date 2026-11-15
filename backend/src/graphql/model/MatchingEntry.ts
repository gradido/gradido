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
    this.keyed = Boolean(dbMatchingEntry.keyedAt)
    this.exactSentence = dbMatchingEntry.exactSentence === true
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

  /**
   * Whether the entry has its words yet - the keying run's. The GMS finds with an entry only
   * once it has them (its `findMatches` reads the keyed entries of the member), and they are
   * worked out a moment after a save, or after the member joins the GMS. The map asks again
   * while one of the member's entries has none (MatchingMap.vue). An edit clears them.
   */
  @Field(() => Boolean)
  keyed: boolean

  /**
   * The "genau" of the entry (KA-020): it finds only the members with the same sentence, and the
   * map asks the GMS for them (`sentence-matches`). Set by a project link, or by the member's tick
   * at the map (setMatchingEntryExactSentence); it falls when the member changes the sentence or
   * the kind. False also where it was never decided -- the column tells the two apart, for the
   * link, which sets it only where nobody decided.
   */
  @Field(() => Boolean)
  exactSentence: boolean
}
