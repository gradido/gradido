/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class KlickTipp {
  constructor(json: any) {
    this.newsletterState = json.status === 'Subscribed'
  }

  @Field(() => Boolean)
  newsletterState: boolean
}
