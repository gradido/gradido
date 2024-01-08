import { Point } from '@dbTools/typeorm'
import { ArgsType, Field, InputType, Int } from 'type-graphql'

@InputType()
@ArgsType()
// @ObjectType()
export class Location {
  constructor(lon: number, lat: number) {
    this.longitude = lon
    this.latitude = lat
  }

  @Field(() => Int)
  longitude: number

  @Field(() => Int)
  latitude: number

  // point is no Field and not part of the graphql type
  private point: Point

  public getPoint(): Point {
    const pointStr = '{ "type": "Point", "coordinates": ['
      .concat(this.longitude.toString())
      .concat(', ')
      .concat(this.latitude.toString())
      .concat('] }')
    this.point = JSON.parse(pointStr) as Point
    return this.point
  }
}
