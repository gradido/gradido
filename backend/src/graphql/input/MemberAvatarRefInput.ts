// AI-GENERATED — not an architecture reference
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { Field, InputType } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot MemberAvatarRef.schema.ts
// after the update to typescript 5 is possible

/**
 * Which member is meant -- a picture is being asked about, a heart is given
 * (ContactResolver), or a booking list is narrowed to them (TransactionResolver). One
 * input type for one question, whoever asks it.
 *
 * ★ A PAIR, not a plain id. The contact list already carries members of other
 * communities, keyed by this pair, and the booking filter matches them by it; a plain id
 * would have needed a second query name and two paths in the wallet the day they arrived.
 *
 * Nullable because a local member registered before the home community had a uuid has
 * none stored either (see UserResolver.createUser), and rejecting those would hide
 * exactly the oldest members.
 */
@InputType()
export class MemberAvatarRefInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  gradidoID: string

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(36)
  communityUuid?: string | null
}
