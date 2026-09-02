// AI-GENERATED — not an architecture reference
import { IsOptional, IsString, MaxLength } from 'class-validator'
import { Field, InputType } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot MemberRef.schema.ts after
// the update to typescript 5 is possible

/**
 * Which member is meant: the uuid pair, as the wallet addresses everybody it has seen a
 * booking with (see `I - Gradido-Adresse`: what is STORED is the pair, what is SHOWN is
 * the alias).
 *
 * communityUuid is nullable for the same reason MemberAvatarRefInput's is: a member who
 * registered before the home community had a uuid carries none on their row, and the
 * wallet passes on what the booking gave it. The resolver fills in the home community.
 */
@InputType()
export class MemberRefInput {
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
