import { registerEnumType } from 'type-graphql'

export enum ContributionMessageType {
  HISTORY = 'HISTORY',
  DIALOG = 'DIALOG',
}

registerEnumType(ContributionMessageType, {
  name: 'ContributionMessageType',
  description: 'Name of the Type of the ContributionMessage',
})
