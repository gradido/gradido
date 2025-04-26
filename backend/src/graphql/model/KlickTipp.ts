import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class KlickTipp {
  constructor(newsletterState: boolean) {
    this.newsletterState = newsletterState
  }

  @Field(() => Boolean)
  newsletterState: boolean
}
