import { registerEnumType } from 'type-graphql'

export enum GmsPublishNameType {
  GMS_PUBLISH_NAME_ALIAS_OR_INITALS = 0,
  GMS_PUBLISH_NAME_INITIALS = 1,
  GMS_PUBLISH_NAME_FIRST = 2,
  GMS_PUBLISH_NAME_FIRST_INITIAL = 3,
  GMS_PUBLISH_NAME_FULL = 4,
}

registerEnumType(GmsPublishNameType, {
  name: 'GmsPublishNameType', // this one is mandatory
  description: 'Type of name publishing', // this one is optional
})
