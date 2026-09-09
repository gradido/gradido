import { Field, ObjectType } from 'type-graphql'

import { Location } from './Location'

@ObjectType()
export class UserLocationResult {
  // Nullable, because "no position set yet" is a normal state of an account and has to
  // be sayable. It used to come back as an empty Location, which every reader took for
  // a place. The community location beside it is not nullable: it is a property of the
  // instance, not of the member, and the resolver refuses to answer at all without it.
  @Field(() => Location, { nullable: true })
  userLocation: Location | null

  @Field(() => Location)
  communityLocation: Location
}
