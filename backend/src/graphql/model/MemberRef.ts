// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

/** The uuid pair that names a member -- what a favourite IS, as stored. */
@ObjectType()
export class MemberRef {
  constructor(communityUuid: string, gradidoID: string) {
    this.communityUuid = communityUuid
    this.gradidoID = gradidoID
  }

  @Field(() => String)
  communityUuid: string

  @Field(() => String)
  gradidoID: string
}
