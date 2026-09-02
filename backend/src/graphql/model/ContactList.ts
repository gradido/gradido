// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'
import { Contact } from './Contact'

@ObjectType()
export class ContactList {
  constructor(contacts: Contact[], count: number) {
    this.contacts = contacts
    this.count = count
  }

  @Field(() => [Contact])
  contacts: Contact[]

  /** People, not bookings -- and only those the search matched, when there is one. */
  @Field(() => Int)
  count: number
}
