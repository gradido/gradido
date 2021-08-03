/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class UpdateUserInfosResponse {
  constructor(json: any) {
    this.validValues = json.valid_values
  }

  @Field(() => Number)
  validValues: number
}
