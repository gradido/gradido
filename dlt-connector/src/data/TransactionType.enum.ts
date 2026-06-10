export enum TransactionType {
  //! Invalid or Empty Transaction
  GRDT_TRANSACTION_NONE = 'GRDT_TRANSACTION_NONE',
  //! Creation Transaction, creates new Gradidos
  GRDT_TRANSACTION_CREATION = 'GRDT_TRANSACTION_CREATION',
  //! Transfer Transaction, move Gradidos from one account to another
  GRDT_TRANSACTION_TRANSFER = 'GRDT_TRANSACTION_TRANSFER',
  //! Group Friends Update Transaction, update relationship between groups
  GRDT_TRANSACTION_COMMUNITY_FRIENDS_UPDATE = 'GRDT_TRANSACTION_COMMUNITY_FRIENDS_UPDATE',
  //! Register new address or sub address to group or move addres to another group
  GRDT_TRANSACTION_REGISTER_ADDRESS = 'GRDT_TRANSACTION_REGISTER_ADDRESS',
  //! Special Transfer Transaction with timeout used for Gradido Link
  GRDT_TRANSACTION_DEFERRED_TRANSFER = 'GRDT_TRANSACTION_DEFERRED_TRANSFER',
  //! First Transaction in Blockchain
  GRDT_TRANSACTION_COMMUNITY_ROOT = 'GRDT_TRANSACTION_COMMUNITY_ROOT',
  //! redeeming deferred transfer
  GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER = 'GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER',
  //! timeout deferred transfer, send back locked gdds
  GRDT_TRANSACTION_TIMEOUT_DEFERRED_TRANSFER = 'GRDT_TRANSACTION_TIMEOUT_DEFERRED_TRANSFER',
}
