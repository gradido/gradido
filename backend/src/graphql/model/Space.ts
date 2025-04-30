import { Field, Int, ObjectType } from 'type-graphql'

import type { Space as HumhubSpace } from '@/apis/humhub/model/Space'

@ObjectType()
export class Space {
  @Field(() => Int)
  id: number

  @Field(() => String)
  guid: string

  @Field(() => String)
  name: string

  @Field(() => String)
  description: string

  @Field(() => String)
  url: string

  constructor(data: HumhubSpace) {
    Object.assign(this, data)
  }
}
