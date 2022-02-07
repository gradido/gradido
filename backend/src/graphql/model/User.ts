/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field, Int } from 'type-graphql'
import { KlickTipp } from './KlickTipp'

@ObjectType()
export class User {
  /*
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number
  */
  constructor(json?: any) {
    if (json) {
      this.id = json.id
      this.email = json.email
      this.firstName = json.first_name
      this.lastName = json.last_name
      this.pubkey = json.public_hex
      this.language = json.language
      this.publisherId = json.publisher_id
      this.isAdmin = json.isAdmin
    }
  }

  @Field(() => Number)
  id: number

  @Field(() => String)
  email: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => String)
  pubkey: string
  /*
  @Field(() => String)
  pubkey: string

  // not sure about the type here. Maybe better to have a string
  @Field(() => number)
  created: number

  @Field(() =>>> Boolean)
  emailChecked: boolean
  */

  @Field(() => String)
  language: string

  /*
  @Field(() => Boolean)
  disabled: boolean
  */

  // what is publisherId?
  @Field(() => Int, { nullable: true })
  publisherId?: number

  @Field(() => Boolean)
  isAdmin: boolean

  @Field(() => Boolean)
  coinanimation: boolean

  @Field(() => KlickTipp)
  klickTipp: KlickTipp

  @Field(() => Boolean, { nullable: true })
  hasElopage?: boolean
}
