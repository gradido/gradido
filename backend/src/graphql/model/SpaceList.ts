import { Field, ObjectType } from 'type-graphql'

import { SpacesResponse } from '@/apis/humhub/model/SpacesResponse'

import { Pagination } from './Pagination'
import { Space } from './Space'

@ObjectType()
export class SpaceList {
  @Field(() => Pagination)
  pagination: Pagination

  @Field(() => [Space])
  results: Space[]

  constructor(data: SpacesResponse) {
    this.pagination = new Pagination(data.total, data.page, data.pages)
    this.results = data.results
  }
}
