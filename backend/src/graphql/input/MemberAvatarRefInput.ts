// AI-GENERATED — not an architecture reference
import { IsOptional, IsString, MaxLength } from 'class-validator'
import { Field, InputType } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot MemberAvatarRef.schema.ts
// after the update to typescript 5 is possible

/**
 * Which member a picture is being asked about.
 *
 * ★ A PAIR, not a plain id, and today that is a promise rather than a need: every member
 * a wallet can currently see a booking with is in the same community, so communityUuid is
 * carried through and nothing else. It is here because members of other communities are a
 * decided, separate delivery (AS-004), and the day they arrive this interface must not
 * have to change -- which would mean a second query name, two paths in the wallet, and a
 * migration of whatever cache the first one built.
 *
 * Nullable because a local member registered before the home community had a uuid has
 * none stored either (see UserResolver.createUser), and rejecting those would hide
 * exactly the oldest members.
 */
@InputType()
export class MemberAvatarRefInput {
  @Field(() => String)
  @IsString()
  @MaxLength(36)
  gradidoID: string

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(36)
  communityUuid?: string | null
}
