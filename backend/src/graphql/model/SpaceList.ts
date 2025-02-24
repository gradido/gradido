import { ObjectType, Field, Int } from 'type-graphql'

import { SpacesResponse } from '@/apis/humhub/model/SpacesResponse'

import { Space } from './Space'

@ObjectType()
export class SpaceList {
  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  pages: number

  @Field(() => [Space])
  results: Space[]

  constructor(data: SpacesResponse) {
    Object.assign(this, data)
  }
}
