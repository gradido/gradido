// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

/**
 * A member's own note, with what it is about: a person by the pair (`communityUuid`, `gradidoID`),
 * or a group by `groupUuid` -- the other fields null. For the search of the contacts page.
 */
@ObjectType()
export class UserNote {
  @Field(() => String, { nullable: true })
  communityUuid: string | null

  @Field(() => String, { nullable: true })
  gradidoID: string | null

  @Field(() => String, { nullable: true })
  groupUuid: string | null

  @Field(() => String)
  note: string
}
