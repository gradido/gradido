import { registerEnumType } from 'type-graphql'

export enum TypeId {
  CREATION = 1,
  SEND = 2,
  RECEIVE = 3,
  // This is a virtual property, never occurring on the database
  DECAY = 4,
}

registerEnumType(TypeId, {
  name: 'TypeId', // this one is mandatory
  description: 'Type of the transaction', // this one is optional
})
