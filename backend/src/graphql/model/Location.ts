import { ArgsType, Field, Float, Int } from 'type-graphql'

@ArgsType()
export class Location {
  @Field(() => Float)
  longitude: number

  @Field(() => Float)
  latitude: number
}
