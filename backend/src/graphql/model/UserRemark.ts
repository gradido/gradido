// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

/**
 * The moderation's remark on a member, as every moderator reads it: the words, when they were
 * written last, and who wrote them -- by their real name, as the contribution list names a
 * colleague; null where that account is deleted.
 */
@ObjectType()
export class UserRemark {
  @Field(() => String)
  remark: string

  @Field(() => Date)
  updatedAt: Date

  @Field(() => String, { nullable: true })
  updatedByName: string | null
}
