/**
 * based on TransactionBody data oneOf
 *  https://github.com/gradido/gradido_protocol/blob/master/proto/gradido/transaction_body.proto
 * for storing type in db as number
 */
export enum TransactionType {
  GRADIDO_CREATION = 1,
  GRADIDO_TRANSFER = 2,
  GROUP_FRIENDS_UPDATE = 3,
  REGISTER_ADDRESS = 4,
  GRADIDO_DEFERRED_TRANSFER = 5,
  COMMUNITY_ROOT = 6,
}
