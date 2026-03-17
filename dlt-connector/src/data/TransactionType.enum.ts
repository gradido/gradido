export enum TransactionType {
  //! Invalid or Empty Transaction
  NONE = 'NONE',
  //! Creation Transaction, creates new Gradidos
  CREATION = 'CREATION',
  //! Transfer Transaction, move Gradidos from one account to another
  TRANSFER = 'TRANSFER',
  //! Group Friends Update Transaction, update relationship between groups
  COMMUNITY_FRIENDS_UPDATE = 'COMMUNITY_FRIENDS_UPDATE',
  //! Register new address or sub address to group or move addres to another group
  REGISTER_ADDRESS = 'REGISTER_ADDRESS',
  //! Special Transfer Transaction with timeout used for Gradido Link
  DEFERRED_TRANSFER = 'DEFERRED_TRANSFER',
  //! First Transaction in Blockchain
  COMMUNITY_ROOT = 'COMMUNITY_ROOT',
  //! redeeming deferred transfer
  REDEEM_DEFERRED_TRANSFER = 'REDEEM_DEFERRED_TRANSFER',
  //! timeout deferred transfer, send back locked gdds
  TIMEOUT_DEFERRED_TRANSFER = 'TIMEOUT_DEFERRED_TRANSFER',
}