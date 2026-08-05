import { CreationGroup as DbCreationGroup } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'

// Group functions: a canonical creation group (stored WITHOUT the leading '#').
@ObjectType()
export class CreationGroup {
  constructor(dbCreationGroup: DbCreationGroup) {
    this.id = dbCreationGroup.id
    this.tag = dbCreationGroup.tag
    this.name = dbCreationGroup.name
    this.hashtagsAdoptedAt = dbCreationGroup.hashtagsAdoptedAt
    this.hashtagsAdoptedCount = dbCreationGroup.hashtagsAdoptedCount
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
