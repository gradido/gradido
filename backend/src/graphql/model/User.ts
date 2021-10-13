/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'
import { KlickTipp } from './KlickTipp'

@ObjectType()
export class User {
  /*
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number
  */
  constructor(json: any) {
    this.email = json.email
    this.firstName = json.first_name
    this.lastName = json.last_name
    this.username = json.username
    this.description = json.description
    this.pubkey = json.public_hex
    this.language = json.language
    this.publisherId = json.publisher_id
  }

  @Field(() => String)
  email: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => String)
  username: string

  @Field(() => String)
  description: string

  @Field(() => String)
  pubkey: string
  /*
  @Field(() => String)
  pubkey: string

  // not sure about the type here. Maybe better to have a string
  @Field(() => number)
  created: number

  @Field(() => Boolean)
  emailChecked: boolean

  @Field(() => Boolean)
  passphraseShown: boolean
  */

  @Field(() => String)
  language: string

  /*
  @Field(() => Boolean)
  disabled: boolean
  */

  /* I suggest to have a group as type here
  @Field(() => ID)
  groupId: number
*/
  // what is publisherId?
  @Field(() => Number)
  publisherId: number

  @Field(() => Boolean)
  coinanimation: boolean

  @Field(() => KlickTipp)
  klickTipp: KlickTipp

  @Field(() => Boolean, { nullable: true })
  hasElopage?: boolean
}
