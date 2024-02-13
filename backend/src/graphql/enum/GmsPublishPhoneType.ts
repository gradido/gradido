import { registerEnumType } from 'type-graphql'

export enum GmsPublishPhoneType {
  GMS_PUBLISH_PHONE_NOTHING = 0,
  GMS_PUBLISH_PHONE_COUNTRY = 1,
  GMS_PUBLISH_PHONE_FULL = 2,
}

registerEnumType(GmsPublishPhoneType, {
  name: 'GmsPublishPhoneType', // this one is mandatory
  description: 'Type of Phone publishing', // this one is optional
})
