// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'
import type { HandledCreationGroups as Choice } from '@/data/HandledCreationGroups.schema'

// "Meine Gruppen" (MG1): the creation groups the signed-in moderator handles themself, by number,
// and whether "no group" is among them. Both empty where no choice counts.
@ObjectType()
export class HandledCreationGroups {
  constructor({ groupIds, untagged }: Choice) {
    this.groupIds = groupIds
    this.untagged = untagged
  }

  @Field(() => [Int])
  groupIds: number[]

  @Field(() => Boolean)
  untagged: boolean
}
