import { registerEnumType } from 'type-graphql'

export enum GmsPublishLocationType {
  GMS_LOCATION_TYPE_EXACT = 0,
  GMS_LOCATION_TYPE_APPROXIMATE = 1,
  GMS_LOCATION_TYPE_RANDOM = 2,
}

registerEnumType(GmsPublishLocationType, {
  name: 'GmsPublishLocationType', // this one is mandatory
  description: 'Type of location treatment in GMS', // this one is optional
})
