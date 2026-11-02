// AI-GENERATED — not an architecture reference
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { IsOptional, IsUUID, ValidateNested } from 'class-validator'
import { Field, InputType } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema

/**
 * What a member's own note is about (Bernd, 27.10.2026): a person -- `member`, the pair the
 * contact window holds -- or a group -- `groupUuid`, as the group window holds it. Exactly one of
 * the two; userNoteSubjectOf refuses anything else.
 */
@InputType()
export class UserNoteSubjectInput {
  @Field(() => MemberAvatarRefInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  member?: MemberAvatarRefInput | null

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID('all')
  groupUuid?: string | null
}
