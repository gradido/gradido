import { registerEnumType } from 'type-graphql'

// enum for graphql but with int because it is the same in backend
// for transaction type from backend
export enum InputTransactionType {
  GRADIDO_TRANSFER = 'GRADIDO_TRANSFER',
  GRADIDO_CREATION = 'GRADIDO_CREATION',
  GROUP_FRIENDS_UPDATE = 'GROUP_FRIENDS_UPDATE',
  REGISTER_ADDRESS = 'REGISTER_ADDRESS',
  GRADIDO_DEFERRED_TRANSFER = 'GRADIDO_DEFERRED_TRANSFER',
  GRADIDO_REDEEM_DEFERRED_TRANSFER = 'GRADIDO_REDEEM_DEFERRED_TRANSFER',
  COMMUNITY_ROOT = 'COMMUNITY_ROOT',
}

registerEnumType(InputTransactionType, {
  name: 'InputTransactionType', // this one is mandatory
  description: 'Type of the transaction', // this one is optional
})
