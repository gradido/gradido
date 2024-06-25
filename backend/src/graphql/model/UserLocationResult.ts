import { Field, ObjectType } from 'type-graphql'

import { Location } from '@model/Location'

@ObjectType()
export class UserLocationResult {
  @Field(() => Location)
  userLocation: Location

  @Field(() => Location)
  communityLocation: Location
}
