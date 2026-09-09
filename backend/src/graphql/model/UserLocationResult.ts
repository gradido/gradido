import { Field, ObjectType } from 'type-graphql'

import { Location } from './Location'

@ObjectType()
export class UserLocationResult {
  // Both nullable, because both can legitimately be unset and neither absence may take
  // the answer down with it. "No position yet" is a normal state of an account; it used
  // to come back as an empty Location, which every reader took for a place.
  //
  // And the community's own point is nullable in the column, filled only when an admin
  // sets it. Making the resolver refuse to answer without it would have been the wrong
  // trade: one unset admin field would take the whole matching area down for every
  // member of the instance -- including everyone who has a position of their own and
  // never needed the community's. The readers fall back to CONFIG.COMMUNITY_LOCATION,
  // as the settings map has always done for its own error case.
  @Field(() => Location, { nullable: true })
  userLocation: Location | null

  @Field(() => Location, { nullable: true })
  communityLocation: Location | null
}
