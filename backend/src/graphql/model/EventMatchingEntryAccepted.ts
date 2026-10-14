// AI-GENERATED — not an architecture reference
import { MatchingEntrySelect } from 'database'
import { Field, ObjectType } from 'type-graphql'
import { MatchingEntry } from './MatchingEntry'

/**
 * The answer to an event link opened by a signed-in member (`acceptEventMatchingEntry`): the
 * entry the link stands for, and whether it was made just now. `created: false` means the member
 * had it already -- live or paused --, and the wallet says nothing then.
 */
@ObjectType()
export class EventMatchingEntryAccepted {
  constructor(created: boolean, entry: MatchingEntrySelect) {
    this.created = created
    this.entry = new MatchingEntry(entry)
  }

  @Field(() => Boolean)
  created: boolean

  @Field(() => MatchingEntry)
  entry: MatchingEntry
}
