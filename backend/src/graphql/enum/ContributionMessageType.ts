import { registerEnumType } from 'type-graphql'

export enum ContributionMessageType {
  HISTORY = 'HISTORY',
  DIALOG = 'DIALOG',
  MODERATOR = 'MODERATOR', // messages for moderator communication, can only be seen by moderators
}

registerEnumType(ContributionMessageType, {
  name: 'ContributionMessageType',
  description: 'Name of the Type of the ContributionMessage',
})
