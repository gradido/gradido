import { registerEnumType } from 'type-graphql'

export enum PublishNameType {
  PUBLISH_NAME_ALIAS_OR_INITALS = 1,
  PUBLISH_NAME_INITIALS = 2,
  PUBLISH_NAME_FIRST = 3,
  PUBLISH_NAME_FIRST_INITIAL = 4,
  PUBLISH_NAME_FULL = 5,
}

registerEnumType(PublishNameType, {
  name: 'PublishNameType', // this one is mandatory
  description: 'Type of name publishing', // this one is optional
})
