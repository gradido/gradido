import { ObjectType, Field } from 'type-graphql'

import { OpenCreation } from './OpenCreation'

@ObjectType()
export class OpenCreations {
  @Field(() => OpenCreation)
  lastMonth: OpenCreation

  @Field(() => OpenCreation)
  thisMonth: OpenCreation

  public constructor(openCreationsArray: OpenCreation[]) {
    if (openCreationsArray.length === 3) {
      this.lastMonth = openCreationsArray[1]
      this.thisMonth = openCreationsArray[2]
    }
  }
}
