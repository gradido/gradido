import { registerEnumType } from 'type-graphql'

export enum GmsPublishNameType {
  GMS_PUBLISH_NAME_NOTHING = 0,
  GMS_PUBLISH_NAME_INITIALS = 1,
  GMS_PUBLISH_NAME_FIRST = 2,
  GMS_PUBLISH_NAME_FIRST_INITIAL = 3,
  GMS_PUBLISH_NAME_FULL = 4,
}

registerEnumType(GmsPublishNameType, {
  name: 'GmsPublishNameType', // this one is mandatory
  description: 'Type of name publishing', // this one is optional
})

export enum GmsPublishPhoneType {
  GMS_PUBLISH_PHONE_NOTHING = 0,
  GMS_PUBLISH_PHONE_COUNTRY = 1,
  GMS_PUBLISH_PHONE_FULL = 2,
}

registerEnumType(GmsPublishPhoneType, {
  name: 'GmsPublishPhoneType', // this one is mandatory
  description: 'Type of Phone publishing', // this one is optional
})

export enum GmsPublishPostType {
  GMS_PUBLISH_POST_NOTHING = 0,
  GMS_PUBLISH_POST_COUNTRY = 1,
  GMS_PUBLISH_POST_CITY = 2,
  GMS_PUBLISH_POST_FULL = 3,
}

registerEnumType(GmsPublishPostType, {
  name: 'GmsPublishPostType', // this one is mandatory
  description: 'Type of name publishing', // this one is optional
})
