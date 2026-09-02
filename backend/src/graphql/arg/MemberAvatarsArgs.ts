// AI-GENERATED — not an architecture reference

import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'
import { MEMBER_AVATARS_MAX_REFS } from '@/data/MemberAvatars.logic'

/**
 * Whose pictures are being asked about.
 *
 * The size limit sits here as well as in the resolver, and that is not redundancy: this
 * one rejects an oversized request before a single row is read, while the one in the
 * resolver is the rule stated where somebody changing the query will see it. Only the
 * first can protect the database, only the second explains itself. The number itself lives
 * in `data/MemberAvatars.logic.ts`, where the wallet's drift spec can read it.
 */
@ArgsType()
export class MemberAvatarsArgs {
  @Field(() => [MemberAvatarRefInput])
  @IsArray()
  @ArrayMaxSize(MEMBER_AVATARS_MAX_REFS)
  @ValidateNested({ each: true })
  refs: MemberAvatarRefInput[]
}
