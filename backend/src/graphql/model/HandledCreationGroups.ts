// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'
import type { HandledCreationGroups as Choice } from '@/data/HandledCreationGroups.schema'

// "Meine Gruppen" (MG1): the creation groups the signed-in moderator handles themself, by number,
// and whether "no group" is among them; `off` where an administrator handles nothing of the column's
// kind (MG5), the ticks standing behind it. All empty and on where no choice counts.
@ObjectType()
export class HandledCreationGroups {
  constructor({ groupIds, untagged, off }: Choice) {
    this.groupIds = groupIds
    this.untagged = untagged
    this.off = off
  }

  @Field(() => [Int])
  groupIds: number[]

  @Field(() => Boolean)
  untagged: boolean

  @Field(() => Boolean)
  off: boolean
}
