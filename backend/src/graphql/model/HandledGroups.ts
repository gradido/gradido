// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'
import type { HandledCreationGroups as Choice } from '@/data/HandledCreationGroups.schema'
import { HandledCreationGroups } from './HandledCreationGroups'

// "Meine Gruppen" in two columns (MG2b): the creation groups whose creations, and those whose
// support requests, the signed-in moderator handles themself -- as setHandledGroups stored them.
@ObjectType()
export class HandledGroups {
  constructor(creation: Choice, support: Choice) {
    this.creation = new HandledCreationGroups(creation)
    this.support = new HandledCreationGroups(support)
  }

  @Field(() => HandledCreationGroups)
  creation: HandledCreationGroups

  @Field(() => HandledCreationGroups)
  support: HandledCreationGroups
}
