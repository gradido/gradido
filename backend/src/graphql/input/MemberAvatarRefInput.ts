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
 * ⚠️ `communityUuid` is nullable for historical reasons only, and nothing legitimately sends
 * null: every uuid a client holds came from the server, where `User.communityUuid` is
 * `String!` and `users.community_uuid` NOT NULL (0134), and a booking with another
 * community always records theirs -- a community without a uuid is unverified and takes
 * part in none. A null that arrives anyway is read as this community (resolveCommunityUuid).
 * Candidate for `String!` once no caller passes one.
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
