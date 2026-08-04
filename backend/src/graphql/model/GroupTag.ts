import { GroupTag as DbGroupTag } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'

// Group functions: a canonical group tag (stored WITHOUT the leading '#').
@ObjectType()
export class GroupTag {
  constructor(dbGroupTag: DbGroupTag) {
    this.id = dbGroupTag.id
    this.tag = dbGroupTag.tag
    this.name = dbGroupTag.name
    this.hashtagsAdoptedAt = dbGroupTag.hashtagsAdoptedAt
    this.hashtagsAdoptedCount = dbGroupTag.hashtagsAdoptedCount
  }

  @Field(() => Int)
  id: number

  @Field(() => String)
  tag: string

  @Field(() => String, { nullable: true })
  name: string | null

  // When the hashtags that predate the group field were last adopted for this group, and
  // how many contributions that run linked. Null means never looked at -- true for every
  // group created before the adoption existed, which is why the answer is stored rather
  // than derived from the group's age.
  @Field(() => Date, { nullable: true })
  hashtagsAdoptedAt: Date | null

  @Field(() => Int, { nullable: true })
  hashtagsAdoptedCount: number | null
}
