import { User as DbUser } from '../..'
import Decimal from 'decimal.js-light'
import { TransactionTypeId } from 'shared'

export interface TransactionInterface {
  sender: DbUser,
  receiver: DbUser,
  amount: Decimal,
  memo: string,
  type: TransactionTypeId,
  creationDate: Date
}