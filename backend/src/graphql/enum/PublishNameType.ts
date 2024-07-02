import { registerEnumType } from 'type-graphql'

export enum PublishNameType {
  PUBLISH_NAME_ALIAS_OR_INITALS = 0,
  PUBLISH_NAME_INITIALS = 1,
  PUBLISH_NAME_FIRST = 2,
  PUBLISH_NAME_FIRST_INITIAL = 3,
  PUBLISH_NAME_FULL = 4,
}

registerEnumType(PublishNameType, {
  name: 'PublishNameType', // this one is mandatory
  description: 'Type of name publishing', // this one is optional
})
