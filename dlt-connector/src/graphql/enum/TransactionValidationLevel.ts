import { registerEnumType } from 'type-graphql'

export enum TransactionValidationLevel {
  SINGLE = 1, // check only the transaction
  SINGLE_PREVIOUS = 2, // check also with previous transaction
  DATE_RANGE = 3, // check all transaction from within date range by creation automatic the same month
  PAIRED = 4, // check paired transaction on another group by cross group transactions
  CONNECTED_GROUP = 5, // check all transactions in the group which connected with this transaction address(es)
  CONNECTED_BLOCKCHAIN = 6, // check all transactions which connected with this transaction
}

registerEnumType(TransactionValidationLevel, {
  name: 'TransactionValidationLevel',
  description: 'Transaction Validation Levels',
})
