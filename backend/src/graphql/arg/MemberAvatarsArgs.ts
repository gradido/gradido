// AI-GENERATED — not an architecture reference

import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

/**
 * Whose pictures are being asked about.
 *
 * The size limit sits here as well as in the resolver, and that is not redundancy: this
 * one rejects an oversized request before a single row is read, while the one in the
 * resolver is the rule stated where somebody changing the query will see it. Only the
 * first can protect the database, only the second explains itself.
 */
export const MEMBER_AVATARS_MAX_REFS = 100

/**
 * How many FULL-size pictures one request may be served (AS-018).
 *
 * ⛔ Counted per REQUEST, not per field, and that is the whole point: `memberAvatarFull`
 * takes one member, so a limit inside the resolver would count to one however many times
 * the field appears. GraphQL aliasing makes that number unbounded — `a: memberAvatarFull(…)
 * b: memberAvatarFull(…) …` is one document — and at roughly 60 KB a picture, five hundred
 * of them is a thirty-megabyte answer to a single authenticated request.
 *
 * Ten rather than one, because a member who opens several faces in a row on a flaky
 * connection may legitimately have a few in flight; and because a limit that the ordinary
 * use can reach gets raised by whoever hits it, without the reasoning being read again.
 */
export const MEMBER_AVATARS_FULL_MAX_PER_REQUEST = 10

@ArgsType()
export class MemberAvatarsArgs {
  @Field(() => [MemberAvatarRefInput])
  @IsArray()
  @ArrayMaxSize(MEMBER_AVATARS_MAX_REFS)
  @ValidateNested({ each: true })
  refs: MemberAvatarRefInput[]
}
