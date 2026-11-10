// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

/** A picture the member keeps of a person (AS-023), in the small rendition, for their lists. */
@ObjectType()
export class KeptPicture {
  @Field(() => String)
  gradidoID: string

  @Field(() => String)
  communityUuid: string

  /** 128x128 JPEG, base64 without a data URI prefix. */
  @Field(() => String)
  picture: string
}
