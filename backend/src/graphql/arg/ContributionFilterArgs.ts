import { IsString } from 'class-validator'
import { ArgsType, Field, InputType } from 'type-graphql'

// Group functions: the wallet's own contribution filter. Deliberately much
// smaller than the admin's SearchContributionsFilterArgs: a member may search by text,
// by the name of the person who submitted, and by group — but NEVER by e-mail address.
// Keeping this a separate type means the admin-only filter fields cannot leak into the
// wallet API by accident.
@ArgsType()
@InputType()
export class ContributionFilterArgs {
  @Field(() => String, { nullable: true, defaultValue: null })
  @IsString()
  query?: string | null

  // A single group tag, stored WITHOUT the leading '#'. Separate from `query`, so text
  // search and group filter can be used at the same time.
  @Field(() => String, { nullable: true, defaultValue: null })
  @IsString()
  groupTag?: string | null
}
