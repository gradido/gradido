import { GroupTag as DbGroupTag } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'

// Group functions: a canonical group tag (stored WITHOUT the leading '#').
@ObjectType()
export class GroupTag {
  constructor(dbGroupTag: DbGroupTag) {
    this.id = dbGroupTag.id
    this.tag = dbGroupTag.tag
    this.name = dbGroupTag.name
  }

  @Field(() => Int)
  id: number

  @Field(() => String)
  tag: string

  @Field(() => String, { nullable: true })
  name: string | null
}
