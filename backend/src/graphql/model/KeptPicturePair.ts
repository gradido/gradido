// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

/** A person the member keeps a picture of (AS-023), without the picture. */
@ObjectType()
export class KeptPicturePair {
  @Field(() => String)
  gradidoID: string

  @Field(() => String)
  communityUuid: string
}
