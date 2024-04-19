import { registerEnumType } from 'type-graphql'

/**
 * Enum for decide which parts from first- and last-name are allowed to be published in an extern service
 */
export enum PublishNameType {
  PUBLISH_NAME_NONE = 0,
  PUBLISH_NAME_INITIALS = 1,
  PUBLISH_NAME_FIRST = 2,
  PUBLISH_NAME_FIRST_INITIAL = 3,
  PUBLISH_NAME_LAST = 4,
  PUBLISH_NAME_INITIAL_LAST = 5,
  PUBLISH_NAME_FULL = 6,
}

registerEnumType(PublishNameType, {
  name: 'PublishNameType', // this one is mandatory
  description: 'Type of first- and last-name publishing for extern service', // this one is optional
})
