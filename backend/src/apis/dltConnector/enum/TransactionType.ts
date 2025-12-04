import { registerEnumType } from 'type-graphql'

/**
 * Transaction Types on Blockchain
 */
export enum TransactionType {
  GRADIDO_TRANSFER = 'GRADIDO_TRANSFER',
  GRADIDO_CREATION = 'GRADIDO_CREATION',
  GROUP_FRIENDS_UPDATE = 'GROUP_FRIENDS_UPDATE',
  REGISTER_ADDRESS = 'REGISTER_ADDRESS',
  GRADIDO_DEFERRED_TRANSFER = 'GRADIDO_DEFERRED_TRANSFER',
  GRADIDO_REDEEM_DEFERRED_TRANSFER = 'GRADIDO_REDEEM_DEFERRED_TRANSFER',
  COMMUNITY_ROOT = 'COMMUNITY_ROOT',
}

registerEnumType(TransactionType, {
  name: 'TransactionType', // this one is mandatory
  description: 'Type of the transaction', // this one is optional
})
