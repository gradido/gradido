/**
 * Enum for protobuf
 * Determine Cross Group type of Transactions
 * LOCAL: no cross group transactions, sender and recipient community are the same, only one transaction
 * INBOUND: cross group transaction, Inbound part. On recipient community chain. Recipient side by Transfer Transactions
 * OUTBOUND: cross group transaction, Outbound part. On sender community chain. Sender side by Transfer Transactions
 * CROSS: for cross group transaction which haven't a direction like group friend update
 * master implementation: https://github.com/gradido/gradido_protocol/blob/master/proto/gradido/transaction_body.proto
 *
 * Transaction Handling differ from database focused backend
 * In Backend for each transfer transaction there are always two entries in db,
 * on for sender user and one for recipient user despite storing basically the same data two times
 * In Blockchain Implementation there only two transactions on cross group transactions, one for
 * the sender community chain, one for the recipient community chain
 * if the transaction stay in the community there is only one transaction
 */
export enum CrossGroupType {
  LOCAL = 0,
  INBOUND = 1,
  OUTBOUND = 2,
  CROSS = 3,
}
