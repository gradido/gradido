import { ArgsType, Field, Int } from 'type-graphql'

@ArgsType()
export class Location {
  @Field(() => Int)
  longitude: number

  @Field(() => Int)
  latitude: number
}
